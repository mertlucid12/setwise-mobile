import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RoutineSchedule, Weekday } from '@/types';
import {
  fetchRoutineSchedules,
  addRoutineSchedule as addInSupabase,
  removeRoutineSchedule as removeInSupabase,
} from '@/services/routineSchedules';

export function useRoutineSchedules() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [schedules, setSchedules] = useState<RoutineSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setSchedules([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setSchedules(await fetchRoutineSchedules(userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Program yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  /** Weekday -> routine ids planned for it, for the calendar's day cells. */
  const routineIdsByWeekday = useMemo(() => {
    const map = new Map<Weekday, string[]>();
    for (const s of schedules) {
      const list = map.get(s.weekday) ?? [];
      list.push(s.routineId);
      map.set(s.weekday, list);
    }
    return map;
  }, [schedules]);

  async function toggleWeekday(routineId: string, weekday: Weekday) {
    if (!userId) throw new Error('Oturum açık değil.');
    const existing = schedules.find((s) => s.routineId === routineId && s.weekday === weekday);
    if (existing) {
      // Optimistic: the row is already gone from the user's point of view, and
      // a failed delete just reappears on the next reload.
      setSchedules((prev) => prev.filter((s) => s.id !== existing.id));
      await removeInSupabase(existing.id);
      return;
    }
    const created = await addInSupabase(userId, routineId, weekday);
    setSchedules((prev) => [...prev, created]);
  }

  function weekdaysForRoutine(routineId: string): Weekday[] {
    return schedules.filter((s) => s.routineId === routineId).map((s) => s.weekday);
  }

  return { schedules, routineIdsByWeekday, loading, error, reload, toggleWeekday, weekdaysForRoutine };
}
