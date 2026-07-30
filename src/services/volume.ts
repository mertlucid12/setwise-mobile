import { SetEntry, WEEKLY_VOLUME_TARGETS, MuscleGroup, MuscleVolumeSummary, Exercise } from '@/types';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Computes sets-per-muscle-group for the trailing 7 days, counting a set
 * once for the primary muscle. Secondary muscles are counted as a half-set
 * (a common convention in volume-tracking apps) to avoid overcounting.
 */
export function computeWeeklyMuscleVolume(sets: SetEntry[], exercises: Exercise[]): MuscleVolumeSummary[] {
  const cutoff = Date.now() - ONE_WEEK_MS;
  // Warm-up sets are deliberately sub-maximal and don't count as working volume.
  const recentSets = sets.filter((s) => s.timestamp >= cutoff && s.setType !== 'warmup');
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));

  const totals: Record<MuscleGroup, number> = {
    chest: 0, back: 0, shoulders: 0, biceps: 0, triceps: 0,
    quads: 0, hamstrings: 0, glutes: 0, calves: 0, abs: 0,
  };

  for (const set of recentSets) {
    const exercise = exerciseById.get(set.exerciseId);
    if (!exercise) continue;
    totals[exercise.primaryMuscle] += 1;
    for (const secondary of exercise.secondaryMuscles ?? []) {
      totals[secondary] += 0.5;
    }
  }

  return (Object.keys(totals) as MuscleGroup[]).map((muscle) => {
    const setsThisWeek = Math.round(totals[muscle] * 10) / 10;
    const target = WEEKLY_VOLUME_TARGETS[muscle];
    let status: MuscleVolumeSummary['status'] = 'in_range';
    if (setsThisWeek < target.min) status = 'below';
    if (setsThisWeek > target.max) status = 'above';
    return { muscle, setsThisWeek, target, status };
  });
}

export type RecoveryStatus = 'untrained' | 'fatigued' | 'recovering' | 'fresh';

export interface MuscleRecovery {
  muscle: MuscleGroup;
  daysSinceTrained: number | null; // null = never logged
  status: RecoveryStatus;
}

const FATIGUED_MS = 24 * 60 * 60 * 1000;
const RECOVERING_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Per-muscle-group recovery estimate based on time since it was last a
 * primary muscle in a logged (non-warm-up) set. Thresholds follow the
 * common ~48-72h hypertrophy recovery window: <24h still fatigued, <3 days
 * recovering, 3+ days fresh. This is a simple heuristic, not a physiological
 * model - there's no sleep/soreness/RPE input to refine it further yet.
 */
export function computeMuscleRecovery(sets: SetEntry[], exercises: Exercise[]): MuscleRecovery[] {
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));
  const lastTrainedAt: Partial<Record<MuscleGroup, number>> = {};

  for (const set of sets) {
    if (set.setType === 'warmup') continue;
    const exercise = exerciseById.get(set.exerciseId);
    if (!exercise) continue;
    const muscle = exercise.primaryMuscle;
    if (lastTrainedAt[muscle] == null || set.timestamp > lastTrainedAt[muscle]!) {
      lastTrainedAt[muscle] = set.timestamp;
    }
  }

  const now = Date.now();
  const muscles: MuscleGroup[] = [
    'chest', 'back', 'shoulders', 'biceps', 'triceps',
    'quads', 'hamstrings', 'glutes', 'calves', 'abs',
  ];

  return muscles.map((muscle) => {
    const trainedAt = lastTrainedAt[muscle];
    if (trainedAt == null) return { muscle, daysSinceTrained: null, status: 'untrained' as const };

    const elapsed = now - trainedAt;
    const daysSinceTrained = Math.floor(elapsed / (24 * 60 * 60 * 1000));
    let status: RecoveryStatus = 'fresh';
    if (elapsed < FATIGUED_MS) status = 'fatigued';
    else if (elapsed < RECOVERING_MS) status = 'recovering';
    return { muscle, daysSinceTrained, status };
  });
}

/**
 * Very simple explainable progressive-overload suggestion: if the last two
 * sessions for an exercise hit the top of the rep range, suggest a small
 * weight increase and say why. This is intentionally transparent (not a
 * black box) - the "why" is the whole point per the research: Hevy's AI is
 * algorithmic but not explainable to the user.
 *
 * Rep count is the only signal available — there's no RPE/effort input
 * anywhere in the app (no UI, no `sets` column for it), so this can't yet
 * hold back a suggestion just because an exercise felt hard.
 */
export interface LoadSuggestion {
  suggestedWeightKg: number | null;
  reasonKey: string;
  reasonParams?: Record<string, string | number>;
}

export function suggestNextLoad(exerciseId: string, history: SetEntry[]): LoadSuggestion {
  const relevant = history
    .filter((s) => s.exerciseId === exerciseId)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 6); // last ~2 sessions assuming ~3 sets each

  if (relevant.length === 0) {
    return { suggestedWeightKg: null, reasonKey: 'suggest.noHistory' };
  }

  const lastWeight = relevant[0].weightKg;
  const avgReps = relevant.reduce((sum, s) => sum + s.reps, 0) / relevant.length;

  if (avgReps >= 10) {
    const bump = lastWeight >= 40 ? 2.5 : 1.25;
    return {
      suggestedWeightKg: lastWeight + bump,
      reasonKey: 'suggest.aboveRange',
      reasonParams: { reps: avgReps.toFixed(1), bump },
    };
  }

  if (avgReps < 6) {
    return {
      suggestedWeightKg: lastWeight,
      reasonKey: 'suggest.belowRange',
      reasonParams: { reps: avgReps.toFixed(1) },
    };
  }

  return { suggestedWeightKg: lastWeight, reasonKey: 'suggest.normal' };
}
