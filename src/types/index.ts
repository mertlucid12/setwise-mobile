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

export interface SetEntry {
  id: string;
  exerciseId: string;
  weightKg: number;
  reps: number;
  rpe?: number; // 1-10, optional perceived effort
  soreness?: number; // 1-5, optional self-reported soreness for that muscle pre-session
  timestamp: number;
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
