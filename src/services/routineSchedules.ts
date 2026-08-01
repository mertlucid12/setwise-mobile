import { supabase } from './supabase';
import { RoutineSchedule, Weekday } from '@/types';

interface RoutineScheduleRow {
  id: string;
  routine_id: string;
  weekday: number;
}

function rowToSchedule(row: RoutineScheduleRow): RoutineSchedule {
  return { id: row.id, routineId: row.routine_id, weekday: row.weekday as Weekday };
}

/**
 * Weekly plan: which routines recur on which weekdays. The calendar projects
 * these forward so a user who trains Push/Pull/Legs on Tue/Thu/Sat sees those
 * sessions on every future week without creating a row per date.
 */
export async function fetchRoutineSchedules(userId: string): Promise<RoutineSchedule[]> {
  const { data, error } = await supabase
    .from('routine_schedules')
    .select('id, routine_id, weekday')
    .eq('user_id', userId)
    .order('weekday');

  if (error) throw error;
  return ((data ?? []) as RoutineScheduleRow[]).map(rowToSchedule);
}

export async function addRoutineSchedule(
  userId: string,
  routineId: string,
  weekday: Weekday
): Promise<RoutineSchedule> {
  const { data, error } = await supabase
    .from('routine_schedules')
    .insert({ user_id: userId, routine_id: routineId, weekday })
    .select('id, routine_id, weekday')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Gün eklenemedi.');
  return rowToSchedule(data as RoutineScheduleRow);
}

export async function removeRoutineSchedule(scheduleId: string): Promise<void> {
  const { error } = await supabase.from('routine_schedules').delete().eq('id', scheduleId);
  if (error) throw error;
}
