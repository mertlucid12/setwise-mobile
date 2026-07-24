import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BodyMeasurement } from '@/types';
import { fetchMeasurements, addMeasurement as addMeasurementToSupabase } from '@/services/measurements';

export function useMeasurements() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setMeasurements([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setMeasurements(await fetchMeasurements(userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ölçümler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function addMeasurement(values: Partial<Omit<BodyMeasurement, 'id' | 'recordedAt'>>) {
    if (!userId) throw new Error('Oturum açık değil.');
    const entry = await addMeasurementToSupabase(userId, values);
    setMeasurements((prev) => [entry, ...prev]);
  }

  return { measurements, loading, error, addMeasurement };
}
