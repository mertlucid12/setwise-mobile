import { supabase } from './supabase';
import { Exercise, MuscleGroup } from '@/types';
import { EXERCISES as FALLBACK_EXERCISES } from '@/data/exercises';
import { mapToMuscleGroup } from './muscleMap';

interface ExerciseRow {
  id: string;
  name: string;
  name_tr: string;
  primary_muscles: string[];
  secondary_muscles: string[];
}

function rowToExercise(row: ExerciseRow): Exercise {
  const primary = row.primary_muscles
    .map(mapToMuscleGroup)
    .filter((m): m is MuscleGroup => !!m);
  const secondary = [...row.primary_muscles.slice(1), ...row.secondary_muscles]
    .map(mapToMuscleGroup)
    .filter((m): m is MuscleGroup => !!m && m !== primary[0]);

  return {
    id: row.id,
    name: row.name_tr || row.name,
    primaryMuscle: primary[0] ?? 'chest',
    secondaryMuscles: Array.from(new Set(secondary)),
  };
}

/**
 * Reads the same `exercises` table the web dashboard (LiftLog/Setwise)
 * writes to, so IDs stay valid foreign keys for workout_exercises on both
 * apps. Falls back to the bundled starter list if offline or the table is
 * empty, so the app still works standalone.
 */
export async function fetchExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, name_tr, primary_muscles, secondary_muscles')
    .order('name_tr');

  if (error || !data || data.length === 0) {
    return FALLBACK_EXERCISES;
  }

  return data.map(rowToExercise);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Inserts a user-owned exercise into the shared `exercises` table (RLS
 * requires owner_id = auth.uid(); is_custom rows are only visible to their
 * owner). Visible to both this app and the web dashboard.
 */
export async function createCustomExercise(
  ownerId: string,
  name: string,
  primaryMuscle: MuscleGroup,
  secondaryMuscles: MuscleGroup[] = [],
  equipment: string = ''
): Promise<Exercise> {
  const id = `custom-${slugify(name)}-${Date.now().toString(36)}`;

  const { data, error } = await supabase
    .from('exercises')
    .insert({
      id,
      name,
      name_tr: name,
      primary_muscles: [primaryMuscle],
      secondary_muscles: secondaryMuscles,
      equipment,
      is_custom: true,
      owner_id: ownerId,
    })
    .select('id, name, name_tr, primary_muscles, secondary_muscles')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Egzersiz oluşturulamadı.');
  }

  return rowToExercise(data);
}
