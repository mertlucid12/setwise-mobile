import { ActivityLevel, MainGoal, Profile } from '@/types';

/**
 * Multipliers applied to resting rate to get maintenance. These are the
 * long-standing Harris-Benedict activity factors; they describe life outside
 * the gym, which is why training frequency doesn't feed into them - two people
 * lifting four times a week still differ by whether they sit at a desk.
 */
const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/**
 * Calorie shift from maintenance per goal. Deliberately gentle: a 20% deficit
 * is roughly 0.5 kg a week for most people and is sustainable, where the
 * crash deficits these calculators often produce are not, and a 10% surplus
 * is about as fast as you can gain without most of it being fat.
 */
const GOAL_ADJUSTMENT: Record<MainGoal, number> = {
  lose_fat: -0.2,
  build_muscle: 0.1,
  get_stronger: 0.1,
  general_fitness: 0,
};

/**
 * Protein per kg of bodyweight. Higher when cutting: in a deficit protein is
 * what keeps the weight you lose from being muscle.
 */
const PROTEIN_PER_KG: Record<MainGoal, number> = {
  lose_fat: 2.2,
  build_muscle: 1.8,
  get_stronger: 1.8,
  general_fitness: 1.6,
};

/** Share of calories from fat, before the rest goes to carbs. */
const FAT_RATIO = 0.25;

const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

export interface NutritionTargets {
  /** Mifflin-St Jeor resting rate, kcal/day. */
  bmr: number;
  /** Resting rate x activity factor - what you burn on an average day. */
  maintenance: number;
  /** Maintenance shifted for the goal. This is the number to eat. */
  target: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  /** Age the calculation used, so the UI can show what it assumed. */
  age: number;
}

/** Fields the calculation cannot proceed without. */
export type MissingNutritionInput = 'weight' | 'height' | 'birthDate' | 'gender' | 'activityLevel' | 'goal';

export function missingNutritionInputs(profile: Profile): MissingNutritionInput[] {
  const missing: MissingNutritionInput[] = [];
  if (profile.weightKg == null) missing.push('weight');
  if (profile.heightCm == null) missing.push('height');
  if (!profile.birthDate) missing.push('birthDate');
  // 'unspecified' is a valid answer for the profile but not for Mifflin-St
  // Jeor, which has separate male and female constants and no neutral case.
  if (profile.gender !== 'male' && profile.gender !== 'female') missing.push('gender');
  if (!profile.activityLevel) missing.push('activityLevel');
  if (!profile.mainGoal) missing.push('goal');
  return missing;
}

/** Whole years elapsed, counting only birthdays that have already passed. */
export function ageFromBirthDate(birthDate: string, now = new Date()): number {
  const born = new Date(`${birthDate}T00:00:00`);
  let age = now.getFullYear() - born.getFullYear();
  const beforeBirthday =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/**
 * Daily calorie and macro targets from the profile alone.
 *
 * Every step is a published formula rather than a fitted model, because the
 * user has to be able to argue with the number: Mifflin-St Jeor for resting
 * rate, an activity factor for maintenance, a percentage shift for the goal,
 * then protein by bodyweight, fat as a share of calories and carbs as
 * whatever is left. Returns null when an input is missing rather than
 * guessing - a calorie target built on an assumed age is worse than none.
 */
export function computeNutritionTargets(profile: Profile, now = new Date()): NutritionTargets | null {
  if (missingNutritionInputs(profile).length > 0) return null;

  const weight = profile.weightKg!;
  const height = profile.heightCm!;
  const age = ageFromBirthDate(profile.birthDate!, now);
  const goal = profile.mainGoal!;

  // Mifflin-St Jeor: the sex term is +5 for men, -161 for women.
  const sexOffset = profile.gender === 'male' ? 5 : -161;
  const bmr = 10 * weight + 6.25 * height - 5 * age + sexOffset;

  const maintenance = bmr * ACTIVITY_FACTOR[profile.activityLevel!];
  const target = maintenance * (1 + GOAL_ADJUSTMENT[goal]);

  const proteinG = Math.round(weight * PROTEIN_PER_KG[goal]);
  const fatG = Math.round((target * FAT_RATIO) / KCAL_PER_G.fat);
  // Carbs absorb the rounding of the other two, and are floored at zero so an
  // extreme profile can't render a negative number.
  const carbsG = Math.max(
    0,
    Math.round((target - proteinG * KCAL_PER_G.protein - fatG * KCAL_PER_G.fat) / KCAL_PER_G.carbs)
  );

  return {
    bmr: Math.round(bmr),
    maintenance: Math.round(maintenance),
    target: Math.round(target),
    proteinG,
    carbsG,
    fatG,
    age,
  };
}
