import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Profile } from '@/types';
import { fetchProfile, saveProfile as saveProfileToSupabase } from '@/services/profile';

export function useProfile() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [profile, setProfile] = useState<Profile>({ displayName: null, weightKg: null, heightCm: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setProfile({ displayName: null, weightKg: null, heightCm: null });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setProfile(await fetchProfile(userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profil yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function saveProfile(next: Profile) {
    if (!userId) throw new Error('Oturum açık değil.');
    setProfile(await saveProfileToSupabase(userId, next));
  }

  return { profile, loading, error, saveProfile };
}
