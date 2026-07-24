import { useEffect, useState } from 'react';
import { Exercise } from '@/types';
import { fetchExercises } from '@/services/exercises';

let cache: Exercise[] | null = null;

/**
 * The exercise list includes the caller's own custom rows (RLS-scoped), so
 * the cache must be dropped on sign-out — otherwise a second account signing
 * in on the same device would briefly see the previous user's custom
 * exercises until an unrelated reason happened to refetch.
 */
export function clearExercisesCache() {
  cache = null;
}

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    fetchExercises().then((list) => {
      if (cancelled) return;
      cache = list;
      setExercises(list);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function addExercise(exercise: Exercise) {
    cache = [...(cache ?? []), exercise];
    setExercises(cache);
  }

  return { exercises, loading, addExercise };
}
