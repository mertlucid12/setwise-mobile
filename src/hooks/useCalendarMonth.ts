import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WorkoutDay } from '@/types';
import { fetchWorkoutDays, saveWorkoutNotes as saveWorkoutNotesInSupabase } from '@/services/calendar';

/**
 * Loads workout days for an arbitrary range. Range (not month) based because
 * the calendar's week view can straddle two months - fetching only the anchor
 * month would drop the workout markers on the spillover days.
 *
 * Bounds are passed as timestamps so the effect's dependency list stays
 * stable across renders (a fresh Date object every render would re-fetch
 * forever).
 */
export function useCalendarRange(startMs: number, endMs: number) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setDays([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setDays(await fetchWorkoutDays(userId, new Date(startMs), new Date(endMs)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Takvim yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [userId, startMs, endMs]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function saveNotes(workoutId: string, notes: string) {
    await saveWorkoutNotesInSupabase(workoutId, notes);
    setDays((prev) => prev.map((d) => (d.workoutId === workoutId ? { ...d, notes: notes.trim() || null } : d)));
  }

  return { days, loading, error, saveNotes, reload };
}
