import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ScheduleOverride, ScheduleOverrideAction } from '@/types';
import {
  fetchScheduleOverrides,
  setScheduleOverride as setInSupabase,
  clearScheduleOverride as clearInSupabase,
} from '@/services/scheduleOverrides';

/**
 * Date-specific exceptions to the weekly plan, scoped to the span the calendar
 * is currently drawing. The range is passed in rather than derived here so this
 * hook stays in step with whatever the grid shows - week view straddling two
 * months included.
 */
export function useScheduleOverrides(startKey: string, endKey: string) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) {
      setOverrides([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setOverrides(await fetchScheduleOverrides(userId, startKey, endKey));
    } finally {
      setLoading(false);
    }
  }, [userId, startKey, endKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  const overridesByDate = useMemo(() => {
    const map = new Map<string, ScheduleOverride[]>();
    for (const o of overrides) {
      const list = map.get(o.dateKey) ?? [];
      list.push(o);
      map.set(o.dateKey, list);
    }
    return map;
  }, [overrides]);

  /**
   * Writes an exception and patches local state, so the grid and day panel
   * update without a refetch. An override that already exists for that routine
   * and date is replaced - the table allows only one.
   */
  async function setOverride(routineId: string, dateKey: string, action: ScheduleOverrideAction) {
    if (!userId) throw new Error('Oturum açık değil.');
    const created = await setInSupabase(userId, routineId, dateKey, action);
    setOverrides((prev) => [
      ...prev.filter((o) => !(o.routineId === routineId && o.dateKey === dateKey)),
      created,
    ]);
    return created;
  }

  /** Drops an exception, putting that date back under the weekly plan. */
  async function clearOverride(routineId: string, dateKey: string) {
    const existing = overrides.find((o) => o.routineId === routineId && o.dateKey === dateKey);
    if (!existing) return;
    setOverrides((prev) => prev.filter((o) => o.id !== existing.id));
    await clearInSupabase(existing.id);
  }

  /**
   * Moves one occurrence to another date: hide it where the plan put it, show
   * it where the user wants it this once. The weekly plan is untouched, so next
   * week goes back to normal.
   */
  async function moveOccurrence(routineId: string, fromDateKey: string, toDateKey: string) {
    if (fromDateKey === toDateKey) return;
    await setOverride(routineId, fromDateKey, 'skip');
    await setOverride(routineId, toDateKey, 'add');
  }

  return { overrides, overridesByDate, loading, reload, setOverride, clearOverride, moveOccurrence };
}
