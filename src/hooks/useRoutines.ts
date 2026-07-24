import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Routine } from '@/types';
import {
  fetchRoutines,
  createRoutine as createRoutineInSupabase,
  deleteRoutine as deleteRoutineInSupabase,
  addRoutineExercise as addRoutineExerciseInSupabase,
  deleteRoutineExercise as deleteRoutineExerciseInSupabase,
} from '@/services/routines';

export function useRoutines() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setRoutines([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setRoutines(await fetchRoutines(userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rutinler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function createRoutine(title: string) {
    if (!userId) throw new Error('Oturum açık değil.');
    const routine = await createRoutineInSupabase(userId, title);
    setRoutines((prev) => [...prev, routine]);
    return routine;
  }

  async function deleteRoutine(routineId: string) {
    await deleteRoutineInSupabase(routineId);
    setRoutines((prev) => prev.filter((r) => r.id !== routineId));
  }

  async function addExerciseToRoutine(
    routineId: string,
    exerciseId: string,
    exerciseName: string,
    targetSets: number,
    targetReps: number
  ) {
    if (!userId) throw new Error('Oturum açık değil.');
    const exercise = await addRoutineExerciseInSupabase(
      userId,
      routineId,
      exerciseId,
      exerciseName,
      targetSets,
      targetReps
    );
    setRoutines((prev) =>
      prev.map((r) => (r.id === routineId ? { ...r, exercises: [...r.exercises, exercise] } : r))
    );
  }

  async function removeExerciseFromRoutine(routineId: string, routineExerciseId: string) {
    await deleteRoutineExerciseInSupabase(routineExerciseId);
    setRoutines((prev) =>
      prev.map((r) =>
        r.id === routineId ? { ...r, exercises: r.exercises.filter((e) => e.id !== routineExerciseId) } : r
      )
    );
  }

  return { routines, loading, error, createRoutine, deleteRoutine, addExerciseToRoutine, removeExerciseFromRoutine };
}
