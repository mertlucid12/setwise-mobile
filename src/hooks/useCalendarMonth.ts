import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WorkoutDay } from '@/types';
import { fetchWorkoutDays, saveWorkoutNotes as saveWorkoutNotesInSupabase } from '@/services/calendar';

/** `month` is 0-indexed, matching Date.getMonth(). */
export function useCalendarMonth(year: number, month: number) {
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
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 1);
      setDays(await fetchWorkoutDays(userId, monthStart, monthEnd));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Takvim yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [userId, year, month]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function saveNotes(workoutId: string, notes: string) {
    await saveWorkoutNotesInSupabase(workoutId, notes);
    setDays((prev) => prev.map((d) => (d.workoutId === workoutId ? { ...d, notes: notes.trim() || null } : d)));
  }

  return { days, loading, error, saveNotes, reload };
}
