import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SetEntry } from '@/types';
import { fetchRecentSets, logSet as logSetToSupabase } from '@/services/workouts';

const FOUR_WEEKS_MS = 28 * 24 * 60 * 60 * 1000;

export function useWorkoutSets() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [sets, setSets] = useState<SetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setSets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setSets(await fetchRecentSets(Date.now() - FOUR_WEEKS_MS));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Geçmiş yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function logSet(exerciseId: string, exerciseName: string, weightKg: number, reps: number) {
    if (!userId) throw new Error('Oturum açık değil.');
    const entry = await logSetToSupabase({ userId, exerciseId, exerciseName, weightKg, reps });
    setSets((prev) => [entry, ...prev]);
  }

  return { sets, loading, error, logSet, reload };
}
