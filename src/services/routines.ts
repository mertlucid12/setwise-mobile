import { supabase } from './supabase';
import { Routine, RoutineExercise } from '@/types';

interface RoutineRow {
  id: string;
  title: string;
}

interface RoutineExerciseRow {
  id: string;
  routine_id: string;
  exercise_id: string;
  name: string;
  target_sets: number;
  target_reps: number;
  position: number;
}

function rowToRoutineExercise(row: RoutineExerciseRow): RoutineExercise {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    name: row.name,
    targetSets: row.target_sets,
    targetReps: row.target_reps,
    position: row.position,
  };
}

/**
 * Reads the same `routines`/`routine_exercises` tables the web dashboard
 * writes to (a routine planned on web can be started here, and vice versa).
 */
export async function fetchRoutines(userId: string): Promise<Routine[]> {
  const [{ data: routineRows, error: routinesError }, { data: exerciseRows, error: exercisesError }] =
    await Promise.all([
      supabase.from('routines').select('id, title').eq('user_id', userId).order('created_at'),
      supabase
        .from('routine_exercises')
        .select('id, routine_id, exercise_id, name, target_sets, target_reps, position')
        .eq('user_id', userId)
        .order('position'),
    ]);

  if (routinesError) throw routinesError;
  if (exercisesError) throw exercisesError;

  const exercisesByRoutine = new Map<string, RoutineExercise[]>();
  for (const row of (exerciseRows ?? []) as RoutineExerciseRow[]) {
    const list = exercisesByRoutine.get(row.routine_id) ?? [];
    list.push(rowToRoutineExercise(row));
    exercisesByRoutine.set(row.routine_id, list);
  }

  return ((routineRows ?? []) as RoutineRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    exercises: exercisesByRoutine.get(row.id) ?? [],
  }));
}

export async function createRoutine(userId: string, title: string): Promise<Routine> {
  const { data, error } = await supabase
    .from('routines')
    .insert({ user_id: userId, title })
    .select('id, title')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Rutin oluşturulamadı.');
  return { id: data.id, title: data.title, exercises: [] };
}

export async function deleteRoutine(routineId: string): Promise<void> {
  const { error } = await supabase.from('routines').delete().eq('id', routineId);
  if (error) throw error;
}

export async function addRoutineExercise(
  userId: string,
  routineId: string,
  exerciseId: string,
  exerciseName: string,
  targetSets: number,
  targetReps: number
): Promise<RoutineExercise> {
  const { count } = await supabase
    .from('routine_exercises')
    .select('id', { count: 'exact', head: true })
    .eq('routine_id', routineId);

  const { data, error } = await supabase
    .from('routine_exercises')
    .insert({
      routine_id: routineId,
      user_id: userId,
      exercise_id: exerciseId,
      name: exerciseName,
      target_sets: targetSets,
      target_reps: targetReps,
      position: count ?? 0,
    })
    .select('id, routine_id, exercise_id, name, target_sets, target_reps, position')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Egzersiz rutine eklenemedi.');
  return rowToRoutineExercise(data);
}

export async function deleteRoutineExercise(id: string): Promise<void> {
  const { error } = await supabase.from('routine_exercises').delete().eq('id', id);
  if (error) throw error;
}
