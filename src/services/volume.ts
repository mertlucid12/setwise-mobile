import { SetEntry, WEEKLY_VOLUME_TARGETS, MuscleGroup, MuscleVolumeSummary, Exercise } from '@/types';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Computes sets-per-muscle-group for the trailing 7 days, counting a set
 * once for the primary muscle. Secondary muscles are counted as a half-set
 * (a common convention in volume-tracking apps) to avoid overcounting.
 */
export function computeWeeklyMuscleVolume(sets: SetEntry[], exercises: Exercise[]): MuscleVolumeSummary[] {
  const cutoff = Date.now() - ONE_WEEK_MS;
  const recentSets = sets.filter((s) => s.timestamp >= cutoff);
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
export function suggestNextLoad(
  exerciseId: string,
  history: SetEntry[]
): { suggestedWeightKg: number | null; reason: string } {
  const relevant = history
    .filter((s) => s.exerciseId === exerciseId)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 6); // last ~2 sessions assuming ~3 sets each

  if (relevant.length === 0) {
    return { suggestedWeightKg: null, reason: 'Henüz bu egzersiz için geçmiş veri yok.' };
  }

  const lastWeight = relevant[0].weightKg;
  const avgReps = relevant.reduce((sum, s) => sum + s.reps, 0) / relevant.length;

  if (avgReps >= 10) {
    const bump = lastWeight >= 40 ? 2.5 : 1.25;
    return {
      suggestedWeightKg: lastWeight + bump,
      reason: `Son seansta ortalama ${avgReps.toFixed(1)} tekrar yaptın, hedef aralığın üstündesin. Ağırlığı ${bump}kg artırmayı dene.`,
    };
  }

  if (avgReps < 6) {
    return {
      suggestedWeightKg: lastWeight,
      reason: `Tekrar sayın hedefin altında (${avgReps.toFixed(1)}). Bu hafta aynı ağırlıkla kal, formu ve dinlenme süresini gözden geçir.`,
    };
  }

  return {
    suggestedWeightKg: lastWeight,
    reason: `İlerleme normal aralıkta. Aynı ağırlıkla devam edip tekrar sayısını artırmayı hedefle.`,
  };
}
