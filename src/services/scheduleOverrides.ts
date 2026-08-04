import { supabase } from './supabase';
import { ScheduleOverride, ScheduleOverrideAction, Weekday } from '@/types';

/**
 * What is actually planned for one date: the weekly plan for that weekday,
 * minus anything skipped on that date, plus anything added to it.
 *
 * Kept pure and separate from the screen because it is the one rule the whole
 * feature turns on - the grid cell, the day panel, the adherence stat and the
 * "move" action all have to agree on what "planned" means for a given day.
 */
export function resolvePlannedRoutineIds(
  dateKey: string,
  weekday: Weekday,
  routineIdsByWeekday: Map<Weekday, string[]>,
  overridesByDate: Map<string, ScheduleOverride[]>
): string[] {
  const overrides = overridesByDate.get(dateKey) ?? [];
  const skipped = new Set(overrides.filter((o) => o.action === 'skip').map((o) => o.routineId));
  const added = overrides.filter((o) => o.action === 'add').map((o) => o.routineId);

  const weekly = (routineIdsByWeekday.get(weekday) ?? []).filter((id) => !skipped.has(id));

  // A routine already on the weekday shouldn't appear twice if it was also
  // added explicitly - the added row is redundant but harmless.
  return [...weekly, ...added.filter((id) => !weekly.includes(id))];
}

interface ScheduleOverrideRow {
  id: string;
  routine_id: string;
  on_date: string;
  action: string;
}

function rowToOverride(row: ScheduleOverrideRow): ScheduleOverride {
  return {
    id: row.id,
    routineId: row.routine_id,
    dateKey: row.on_date,
    action: row.action as ScheduleOverrideAction,
  };
}

/**
 * Exceptions to the weekly plan, for one visible span of the calendar.
 *
 * The weekly plan says what you normally train; these say what happens on one
 * specific date instead. Fetching by range rather than wholesale keeps this
 * proportional to what the grid draws - a user two years in shouldn't pay for
 * every exception they ever made to look at this month.
 *
 * `startKey` is inclusive, `endKey` exclusive, both 'YYYY-MM-DD'.
 */
export async function fetchScheduleOverrides(
  userId: string,
  startKey: string,
  endKey: string
): Promise<ScheduleOverride[]> {
  const { data, error } = await supabase
    .from('routine_schedule_overrides')
    .select('id, routine_id, on_date, action')
    .eq('user_id', userId)
    .gte('on_date', startKey)
    .lt('on_date', endKey);

  if (error) throw error;
  return ((data ?? []) as ScheduleOverrideRow[]).map(rowToOverride);
}

/**
 * Writes one exception. A routine can only have one override per date - the
 * table enforces it - so this upserts rather than inserting: skipping a day you
 * had already added the routine to should replace that row, not fail.
 */
export async function setScheduleOverride(
  userId: string,
  routineId: string,
  dateKey: string,
  action: ScheduleOverrideAction
): Promise<ScheduleOverride> {
  const { data, error } = await supabase
    .from('routine_schedule_overrides')
    .upsert(
      { user_id: userId, routine_id: routineId, on_date: dateKey, action },
      { onConflict: 'routine_id,on_date' }
    )
    .select('id, routine_id, on_date, action')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Gün değişikliği kaydedilemedi.');
  return rowToOverride(data as ScheduleOverrideRow);
}

export async function clearScheduleOverride(overrideId: string): Promise<void> {
  const { error } = await supabase.from('routine_schedule_overrides').delete().eq('id', overrideId);
  if (error) throw error;
}
