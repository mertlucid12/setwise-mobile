import { Exercise } from '@/types';

// Offline/first-launch fallback library, used by src/services/exercises.ts
// when the Supabase `exercises` table can't be reached. The live list comes
// from the same table the web dashboard reads, so IDs here won't match real
// workout_exercises.exercise_id rows once synced - they're a bootstrap only.
export const EXERCISES: Exercise[] = [
  { id: 'bench-press', name: 'Bench Press', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'] },
  { id: 'incline-db-press', name: 'Incline Dumbbell Press', primaryMuscle: 'chest', secondaryMuscles: ['shoulders'] },
  { id: 'barbell-row', name: 'Barbell Row', primaryMuscle: 'back', secondaryMuscles: ['biceps'] },
  { id: 'lat-pulldown', name: 'Lat Pulldown', primaryMuscle: 'back', secondaryMuscles: ['biceps'] },
  { id: 'overhead-press', name: 'Overhead Press', primaryMuscle: 'shoulders', secondaryMuscles: ['triceps'] },
  { id: 'lateral-raise', name: 'Lateral Raise', primaryMuscle: 'shoulders' },
  { id: 'barbell-curl', name: 'Barbell Curl', primaryMuscle: 'biceps' },
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', primaryMuscle: 'triceps' },
  { id: 'back-squat', name: 'Back Squat', primaryMuscle: 'quads', secondaryMuscles: ['glutes'] },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: ['glutes', 'back'] },
  { id: 'leg-press', name: 'Leg Press', primaryMuscle: 'quads', secondaryMuscles: ['glutes'] },
  { id: 'hip-thrust', name: 'Hip Thrust', primaryMuscle: 'glutes', secondaryMuscles: ['hamstrings'] },
  { id: 'calf-raise', name: 'Standing Calf Raise', primaryMuscle: 'calves' },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', primaryMuscle: 'abs' },
];
