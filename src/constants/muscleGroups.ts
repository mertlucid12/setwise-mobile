import { MuscleGroup } from '@/types';
import { IconName } from '@/components/Icon';

/** i18n key for a muscle group's display label — resolve with t(). */
export function muscleLabelKey(muscle: MuscleGroup): string {
  return `muscle.${muscle}`;
}

// Leans on armour/force imagery where anatomy has no clean glyph: a shield
// for the chest plate, a lat spread as stacked chevrons, an anvil for the
// hip hinge.
export const MUSCLE_ICONS: Record<MuscleGroup, IconName> = {
  chest: 'body-outline',
  back: 'lats',
  shoulders: 'triangle-outline',
  biceps: 'biceps',
  triceps: 'barbell',
  quads: 'walk-outline',
  hamstrings: 'fitness-outline',
  glutes: 'anvil',
  calves: 'footsteps-outline',
  abs: 'grid-outline',
};

// Rough head-to-toe ordering so the picker reads like a body scan.
export const ALL_MUSCLES: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'abs',
  'glutes',
  'quads',
  'hamstrings',
  'calves',
];
