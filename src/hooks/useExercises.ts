import { useEffect, useState } from 'react';
import { Exercise } from '@/types';
import { fetchExercises } from '@/services/exercises';

let cache: Exercise[] | null = null;

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
