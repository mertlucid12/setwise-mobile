import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RoutineSchedule, Weekday } from '@/types';
import {
  fetchRoutineSchedules,
  addRoutineSchedule as addInSupabase,
  removeRoutineSchedule as removeInSupabase,
  updateRoutineScheduleWeekday as updateWeekdayInSupabase,
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

  /** Drops one routine from one weekday, every week. */
  async function removeFromWeekday(routineId: string, weekday: Weekday) {
    const existing = schedules.find((s) => s.routineId === routineId && s.weekday === weekday);
    if (!existing) return;
    setSchedules((prev) => prev.filter((s) => s.id !== existing.id));
    await removeInSupabase(existing.id);
  }

  /**
   * Swaps two weekdays' routines permanently - "train Monday's session on
   * Wednesday from now on, and vice versa".
   *
   * A routine sitting on both days is left alone: swapping it with itself is a
   * no-op, and moving it would collide with the (routine_id, weekday) unique
   * constraint. Everything else only ever moves onto a day it isn't on yet, so
   * the updates are safe to apply one by one.
   */
  async function swapWeekdays(a: Weekday, b: Weekday) {
    if (a === b) return;
    const onA = schedules.filter((s) => s.weekday === a);
    const onB = schedules.filter((s) => s.weekday === b);
    const bothDays = new Set(
      onA.filter((s) => onB.some((o) => o.routineId === s.routineId)).map((s) => s.routineId)
    );

    const moves = [
      ...onA.filter((s) => !bothDays.has(s.routineId)).map((s) => ({ id: s.id, weekday: b })),
      ...onB.filter((s) => !bothDays.has(s.routineId)).map((s) => ({ id: s.id, weekday: a })),
    ];
    if (moves.length === 0) return;

    setSchedules((prev) =>
      prev.map((s) => {
        const move = moves.find((m) => m.id === s.id);
        return move ? { ...s, weekday: move.weekday } : s;
      })
    );

    try {
      for (const move of moves) {
        await updateWeekdayInSupabase(move.id, move.weekday);
      }
    } catch (err) {
      // Partial swaps leave the plan in a state the user didn't ask for, so
      // pull the real rows back rather than trusting the optimistic patch.
      await reload();
      throw err;
    }
  }

  return {
    schedules,
    routineIdsByWeekday,
    loading,
    error,
    reload,
    toggleWeekday,
    weekdaysForRoutine,
    removeFromWeekday,
    swapWeekdays,
  };
}
