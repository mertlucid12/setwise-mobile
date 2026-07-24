import { supabase } from './supabase';
import { WorkoutDay } from '@/types';

function toDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * One `workouts` row is created per calendar day (see getOrCreateTodayWorkout
 * in workouts.ts), so listing workouts in a date range doubles as "which
 * days had a session" for the calendar grid.
 */
export async function fetchWorkoutDays(userId: string, monthStart: Date, monthEnd: Date): Promise<WorkoutDay[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('id, created_at, notes')
    .eq('user_id', userId)
    .gte('created_at', monthStart.toISOString())
    .lt('created_at', monthEnd.toISOString())
    .order('created_at');

  if (error) throw error;

  return (data ?? []).map((row) => ({
    workoutId: row.id,
    dateKey: toDateKey(row.created_at),
    notes: row.notes,
  }));
}

export async function saveWorkoutNotes(workoutId: string, notes: string): Promise<void> {
  const { error } = await supabase
    .from('workouts')
    .update({ notes: notes.trim() || null })
    .eq('id', workoutId);

  if (error) throw error;
}
