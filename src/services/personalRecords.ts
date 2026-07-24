import { SetEntry } from '@/types';

export interface PersonalRecord {
  kind: 'weight' | 'volume';
  message: string;
}

/**
 * Compares a just-logged set against prior sets for the same exercise
 * (excluding warm-ups, which are lighter by design and wouldn't be genuine
 * records) to detect a new heaviest-weight or highest-single-set-volume PR.
 */
export function detectPersonalRecord(newSet: SetEntry, priorSets: SetEntry[]): PersonalRecord | null {
  const history = priorSets.filter(
    (s) => s.exerciseId === newSet.exerciseId && s.setType !== 'warmup' && s.id !== newSet.id
  );
  if (history.length === 0) return null;

  const prevMaxWeight = Math.max(...history.map((s) => s.weightKg));
  if (newSet.weightKg > prevMaxWeight) {
    return { kind: 'weight', message: `Yeni ağırlık rekoru! Önceki en iyi: ${prevMaxWeight}kg` };
  }

  const newVolume = newSet.weightKg * newSet.reps;
  const prevMaxVolume = Math.max(...history.map((s) => s.weightKg * s.reps));
  if (newVolume > prevMaxVolume) {
    return { kind: 'volume', message: `Yeni set hacmi rekoru! ${newSet.weightKg}kg × ${newSet.reps} tekrar` };
  }

  return null;
}
