import { MuscleGroup } from '@/types';

/**
 * The web dashboard's `exercises` table (LiftLog/Setwise Supabase schema)
 * uses a finer-grained muscle taxonomy than this app's 10-group volume
 * model. This maps the web taxonomy down to MuscleGroup so both apps can
 * read the same exercise rows.
 */
const MUSCLE_MAP: Record<string, MuscleGroup> = {
  chest: 'chest',
  'front-delts': 'shoulders',
  'side-delts': 'shoulders',
  'rear-delts': 'shoulders',
  shoulders: 'shoulders',
  triceps: 'triceps',
  biceps: 'biceps',
  forearms: 'biceps',
  lats: 'back',
  'upper-back': 'back',
  'lower-back': 'back',
  traps: 'back',
  back: 'back',
  quads: 'quads',
  hamstrings: 'hamstrings',
  glutes: 'glutes',
  calves: 'calves',
  abs: 'abs',
};

export function mapToMuscleGroup(webMuscle: string): MuscleGroup | undefined {
  return MUSCLE_MAP[webMuscle];
}
