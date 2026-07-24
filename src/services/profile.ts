import { supabase } from './supabase';
import { Profile } from '@/types';

interface ProfileRow {
  display_name: string | null;
  weight_kg: number | null;
  height_cm: number | null;
}

function rowToProfile(row: ProfileRow): Profile {
  return {
    displayName: row.display_name,
    weightKg: row.weight_kg,
    heightCm: row.height_cm,
  };
}

/**
 * Reads the same `profiles` table the web dashboard uses. No row yet
 * (first launch) is a normal state, not an error - returns nulls.
 */
export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, weight_kg, height_cm')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return { displayName: null, weightKg: null, heightCm: null };
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
    })
    .select('display_name, weight_kg, height_cm')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Profil kaydedilemedi.');
  return rowToProfile(data);
}
