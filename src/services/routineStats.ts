import { Exercise, MuscleGroup, Routine } from '@/types';

/**
 * Average seconds a single working set consumes end to end: the set itself
 * plus the rest that follows it. Matches REST_SECONDS_DEFAULT (90s) in
 * WorkoutLogScreen plus ~45s under the bar, so the estimate lines up with
 * how the app actually paces a session.
 */
const SECONDS_PER_SET = 135;

export interface RoutineStats {
  exerciseCount: number;
  totalSets: number;
  totalReps: number;
  /** Rounded to the nearest 5 minutes - it's an estimate, not a measurement. */
  estimatedMinutes: number;
  /** Primary muscles the routine hits, ordered by set count (descending). */
  muscles: MuscleGroup[];
  /**
   * The same ordering with the set counts kept. A bare icon says a routine
   * touches the chest; "Chest 9" says whether that is the point of the session
   * or an afterthought, which is what you need to tell two routines apart in a
   * list without opening either.
   */
  muscleSets: { muscle: MuscleGroup; sets: number }[];
}

export function computeRoutineStats(routine: Routine, exercises: Exercise[]): RoutineStats {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const setsPerMuscle = new Map<MuscleGroup, number>();

  let totalSets = 0;
  let totalReps = 0;

  for (const re of routine.exercises) {
    totalSets += re.targetSets;
    totalReps += re.targetSets * re.targetReps;

    const muscle = byId.get(re.exerciseId)?.primaryMuscle;
    if (muscle) setsPerMuscle.set(muscle, (setsPerMuscle.get(muscle) ?? 0) + re.targetSets);
  }

  const rawMinutes = (totalSets * SECONDS_PER_SET) / 60;
  const ranked = [...setsPerMuscle.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([muscle, sets]) => ({ muscle, sets }));

  return {
    exerciseCount: routine.exercises.length,
    totalSets,
    totalReps,
    estimatedMinutes: rawMinutes > 0 ? Math.max(5, Math.round(rawMinutes / 5) * 5) : 0,
    muscles: ranked.map((m) => m.muscle),
    muscleSets: ranked,
  };
}
