import { supabase } from './supabase';
import { BodyMeasurement } from '@/types';

interface MeasurementRow {
  id: string;
  recorded_at: string;
  weight_kg: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
  hip_cm: number | null;
  calf_cm: number | null;
}

function rowToMeasurement(row: MeasurementRow): BodyMeasurement {
  return {
    id: row.id,
    recordedAt: new Date(row.recorded_at).getTime(),
    weightKg: row.weight_kg,
    waistCm: row.waist_cm,
    chestCm: row.chest_cm,
    armCm: row.arm_cm,
    thighCm: row.thigh_cm,
    hipCm: row.hip_cm,
    calfCm: row.calf_cm,
  };
}

/** Newest first, for the check-in history list. */
export async function fetchMeasurements(userId: string): Promise<BodyMeasurement[]> {
  const { data, error } = await supabase
    .from('body_measurements')
    .select('id, recorded_at, weight_kg, waist_cm, chest_cm, arm_cm, thigh_cm, hip_cm, calf_cm')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false });

  if (error) throw error;
  return ((data ?? []) as MeasurementRow[]).map(rowToMeasurement);
}

/**
 * `recordedAt` lets a check-in be back-dated - people weigh in on Monday and
 * get around to typing it on Wednesday. Omitted, the column default (now)
 * stands, which is what the same-day case wants.
 */
export async function addMeasurement(
  userId: string,
  values: Partial<Omit<BodyMeasurement, 'id' | 'recordedAt'>>,
  recordedAt?: Date
): Promise<BodyMeasurement> {
  const { data, error } = await supabase
    .from('body_measurements')
    .insert({
      user_id: userId,
      ...(recordedAt ? { recorded_at: recordedAt.toISOString() } : {}),
      weight_kg: values.weightKg ?? null,
      waist_cm: values.waistCm ?? null,
      chest_cm: values.chestCm ?? null,
      arm_cm: values.armCm ?? null,
      thigh_cm: values.thighCm ?? null,
      hip_cm: values.hipCm ?? null,
      calf_cm: values.calfCm ?? null,
    })
    .select('id, recorded_at, weight_kg, waist_cm, chest_cm, arm_cm, thigh_cm, hip_cm, calf_cm')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Ölçüm kaydedilemedi.');
  return rowToMeasurement(data);
}
