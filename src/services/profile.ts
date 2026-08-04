import { supabase } from './supabase';
import { Profile } from '@/types';

interface ProfileRow {
  display_name: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  gender: string | null;
  main_goal: string | null;
  experience_level: string | null;
  goal_weight_kg: number | null;
  birth_date: string | null;
  activity_level: string | null;
  onboarding_completed: boolean;
}

const SELECT_COLUMNS =
  'display_name, weight_kg, height_cm, gender, main_goal, experience_level, goal_weight_kg, birth_date, activity_level, onboarding_completed';

function rowToProfile(row: ProfileRow): Profile {
  return {
    displayName: row.display_name,
    weightKg: row.weight_kg,
    heightCm: row.height_cm,
    gender: row.gender as Profile['gender'],
    mainGoal: row.main_goal as Profile['mainGoal'],
    experienceLevel: row.experience_level as Profile['experienceLevel'],
    goalWeightKg: row.goal_weight_kg,
    birthDate: row.birth_date,
    activityLevel: row.activity_level as Profile['activityLevel'],
    onboardingCompleted: row.onboarding_completed,
  };
}

export const EMPTY_PROFILE: Profile = {
  displayName: null,
  weightKg: null,
  heightCm: null,
  gender: null,
  mainGoal: null,
  experienceLevel: null,
  goalWeightKg: null,
  birthDate: null,
  activityLevel: null,
  onboardingCompleted: false,
};

/**
 * Reads the same `profiles` table the web dashboard uses. No row yet
 * (first launch) is a normal state, not an error - returns EMPTY_PROFILE,
 * which has onboardingCompleted: false so the onboarding flow triggers.
 */
export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select(SELECT_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return EMPTY_PROFILE;
  return rowToProfile(data);
}

export async function saveProfile(userId: string, profile: Profile): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      display_name: profile.displayName,
      weight_kg: profile.weightKg,
      height_cm: profile.heightCm,
      gender: profile.gender,
      main_goal: profile.mainGoal,
      experience_level: profile.experienceLevel,
      goal_weight_kg: profile.goalWeightKg,
      birth_date: profile.birthDate,
      activity_level: profile.activityLevel,
      onboarding_completed: profile.onboardingCompleted,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Profil kaydedilemedi.');
  return rowToProfile(data);
}
