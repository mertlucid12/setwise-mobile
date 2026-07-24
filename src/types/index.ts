export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'abs';

export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
}

export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure';

export interface SetEntry {
  id: string;
  exerciseId: string;
  weightKg: number;
  reps: number;
  timestamp: number;
  setType: SetType;
  rpe?: number;
}

export interface WorkoutSession {
  id: string;
  date: string; // ISO date
  sets: SetEntry[];
  notes?: string;
}

// Science-informed weekly set targets per muscle group (MEV-MRV style range).
// These are starting defaults; later versions can personalize based on
// training age, recovery data, and logged progress.
export const WEEKLY_VOLUME_TARGETS: Record<MuscleGroup, { min: number; max: number }> = {
  chest: { min: 10, max: 20 },
  back: { min: 10, max: 22 },
  shoulders: { min: 8, max: 20 },
  biceps: { min: 8, max: 20 },
  triceps: { min: 6, max: 18 },
  quads: { min: 8, max: 18 },
  hamstrings: { min: 6, max: 16 },
  glutes: { min: 6, max: 16 },
  calves: { min: 8, max: 16 },
  abs: { min: 0, max: 25 },
};

export interface MuscleVolumeSummary {
  muscle: MuscleGroup;
  setsThisWeek: number;
  target: { min: number; max: number };
  status: 'below' | 'in_range' | 'above';
}

export interface AICoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Profile {
  displayName: string | null;
  weightKg: number | null;
  heightCm: number | null;
}

export interface RoutineExercise {
  id: string;
  exerciseId: string;
  name: string;
  targetSets: number;
  targetReps: number;
  position: number;
}

export interface Routine {
  id: string;
  title: string;
  exercises: RoutineExercise[];
}

export interface WorkoutDay {
  workoutId: string;
  dateKey: string; // 'YYYY-MM-DD', local calendar date
  notes: string | null;
}

export interface BodyMeasurement {
  id: string;
  recordedAt: number;
  weightKg: number | null;
  waistCm: number | null;
  chestCm: number | null;
  armCm: number | null;
  thighCm: number | null;
  hipCm: number | null;
  calfCm: number | null;
}
