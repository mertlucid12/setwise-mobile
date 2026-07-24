import { supabase } from './supabase';
import { SetEntry, SetType } from '@/types';

interface SetRow {
  id: string;
  weight: number;
  reps: number;
  created_at: string;
  set_type: SetType;
  rpe: number | null;
  workout_exercises: { exercise_id: string } | null;
}

function rowToSetEntry(row: SetRow): SetEntry {
  return {
    id: row.id,
    exerciseId: row.workout_exercises?.exercise_id ?? '',
    weightKg: Number(row.weight),
    reps: row.reps,
    timestamp: new Date(row.created_at).getTime(),
    setType: row.set_type,
    rpe: row.rpe ?? undefined,
  };
}

/**
 * Reads completed sets since `sinceMs`, joined through workout_exercises for
 * the exerciseId. RLS scopes this to the signed-in user. Excludes
 * `completed: false` rows (e.g. a planned-but-not-yet-done set) so volume
 * totals and progressive-overload suggestions only count weight actually
 * lifted.
 */
export async function fetchRecentSets(sinceMs: number): Promise<SetEntry[]> {
  const { data, error } = await supabase
    .from('sets')
    .select('id, weight, reps, created_at, set_type, rpe, workout_exercises(exercise_id)')
    .eq('completed', true)
    .gte('created_at', new Date(sinceMs).toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data ?? []) as unknown as SetRow[]).map(rowToSetEntry);
}

/**
 * Sets for one specific workout (a single calendar day), for the calendar
 * screen's day-detail view. Uses `!inner` so the `workout_id` filter on the
 * embedded workout_exercises resource actually restricts the join.
 */
export async function fetchSetsForWorkout(workoutId: string): Promise<SetEntry[]> {
  const { data, error } = await supabase
    .from('sets')
    .select('id, weight, reps, created_at, set_type, rpe, workout_exercises!inner(exercise_id, workout_id)')
    .eq('workout_exercises.workout_id', workoutId)
    .eq('completed', true)
    .order('created_at');

  if (error) throw error;
  return ((data ?? []) as unknown as SetRow[]).map(rowToSetEntry);
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function getOrCreateTodayWorkout(userId: string): Promise<string> {
  const { data: existing, error: findError } = await supabase
    .from('workouts')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', startOfTodayIso())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing.id;

  const { data: created, error: createError } = await supabase
    .from('workouts')
    .insert({ user_id: userId })
    .select('id')
    .single();

  if (createError) throw createError;
  return created.id;
}

async function getOrCreateWorkoutExercise(
  userId: string,
  workoutId: string,
  exerciseId: string,
  exerciseName: string
): Promise<string> {
  const { data: existing, error: findError } = await supabase
    .from('workout_exercises')
    .select('id')
    .eq('workout_id', workoutId)
    .eq('exercise_id', exerciseId)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing.id;

  const { count } = await supabase
    .from('workout_exercises')
    .select('id', { count: 'exact', head: true })
    .eq('workout_id', workoutId);

  const { data: created, error: createError } = await supabase
    .from('workout_exercises')
    .insert({
      workout_id: workoutId,
      user_id: userId,
      exercise_id: exerciseId,
      name: exerciseName,
      position: count ?? 0,
    })
    .select('id')
    .single();

  if (createError) throw createError;
  return created.id;
}

/**
 * Logs one set. Finds-or-creates today's workout and this exercise's row
 * within it (the mobile UI has no explicit "start workout" step, unlike the
 * web dashboard), then inserts the set - matching the same
 * workouts -> workout_exercises -> sets shape the web app uses.
 */
export async function logSet(params: {
  userId: string;
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  setType?: SetType;
  rpe?: number;
}): Promise<SetEntry> {
  const { userId, exerciseId, exerciseName, weightKg, reps, setType = 'normal', rpe } = params;

  const workoutId = await getOrCreateTodayWorkout(userId);
  const workoutExerciseId = await getOrCreateWorkoutExercise(userId, workoutId, exerciseId, exerciseName);

  const { count } = await supabase
    .from('sets')
    .select('id', { count: 'exact', head: true })
    .eq('workout_exercise_id', workoutExerciseId);

  const { data, error } = await supabase
    .from('sets')
    .insert({
      workout_exercise_id: workoutExerciseId,
      user_id: userId,
      weight: weightKg,
      reps,
      completed: true,
      position: count ?? 0,
      set_type: setType,
      rpe: rpe ?? null,
    })
    .select('id, created_at')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    exerciseId,
    weightKg,
    reps,
    timestamp: new Date(data.created_at).getTime(),
    setType,
    rpe,
  };
}
