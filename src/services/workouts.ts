import { supabase } from './supabase';
import { SetEntry, SetType } from '@/types';

interface SetRow {
  id: string;
  weight: number;
  reps: number;
  created_at: string;
  set_type: SetType;
  rpe: number | null;
  workout_exercises: { exercise_id: string } | null;
}

function rowToSetEntry(row: SetRow): SetEntry {
  return {
    id: row.id,
    exerciseId: row.workout_exercises?.exercise_id ?? '',
    weightKg: Number(row.weight),
    reps: row.reps,
    timestamp: new Date(row.created_at).getTime(),
    setType: row.set_type,
    rpe: row.rpe ?? undefined,
  };
}

/**
 * Reads completed sets since `sinceMs`, joined through workout_exercises for
 * the exerciseId. RLS scopes this to the signed-in user. Excludes
 * `completed: false` rows (e.g. a planned-but-not-yet-done set) so volume
 * totals and progressive-overload suggestions only count weight actually
 * lifted.
 */
export async function fetchRecentSets(sinceMs: number): Promise<SetEntry[]> {
  const { data, error } = await supabase
    .from('sets')
    .select('id, weight, reps, created_at, set_type, rpe, workout_exercises(exercise_id)')
    .eq('completed', true)
    .gte('created_at', new Date(sinceMs).toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data ?? []) as unknown as SetRow[]).map(rowToSetEntry);
}

/**
 * Sets for one specific workout (a single calendar day), for the calendar
 * screen's day-detail view. Uses `!inner` so the `workout_id` filter on the
 * embedded workout_exercises resource actually restricts the join.
 */
export async function fetchSetsForWorkout(workoutId: string): Promise<SetEntry[]> {
  const { data, error } = await supabase
    .from('sets')
    .select('id, weight, reps, created_at, set_type, rpe, workout_exercises!inner(exercise_id, workout_id)')
    .eq('workout_exercises.workout_id', workoutId)
    .eq('completed', true)
    .order('created_at');

  if (error) throw error;
  return ((data ?? []) as unknown as SetRow[]).map(rowToSetEntry);
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Noon local rather than midnight: a day that gets rendered from its UTC
 * timestamp can't slip into the neighbouring date under any timezone offset.
 */
function dateKeyToIso(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
}

/**
 * Find-or-create the workout row for an arbitrary calendar day, so the
 * calendar can back-fill a session the user forgot to log at the time.
 * `created_at` is written explicitly, which is what puts the set in the right
 * day for both the calendar grid and weekly volume totals.
 */
export async function getOrCreateWorkoutForDate(userId: string, dateKey: string): Promise<string> {
  const dayStart = new Date(`${dateKey}T00:00:00`);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const { data: existing, error: findError } = await supabase
    .from('workouts')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', dayStart.toISOString())
    .lt('created_at', dayEnd.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing.id;

  const { data: created, error: createError } = await supabase
    .from('workouts')
    .insert({ user_id: userId, created_at: dateKeyToIso(dateKey) })
    .select('id')
    .single();

  if (createError) throw createError;
  return created.id;
}

/**
 * Today's workout, created if this is the first set of the day. A row created
 * here is a live session, so it gets `started_at` - that's what separates it
 * from a day back-filled through getOrCreateWorkoutForDate, which has no
 * honest start time.
 *
 * An existing row that predates session tracking (or was created by the web
 * app) is adopted as-is rather than stamped: writing "started now" onto a
 * workout whose first set was logged hours ago would invent a duration.
 */
async function getOrCreateTodayWorkout(userId: string): Promise<string> {
  const { data: existing, error: findError } = await supabase
    .from('workouts')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', startOfTodayIso())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing.id;

  const { data: created, error: createError } = await supabase
    .from('workouts')
    .insert({ user_id: userId, started_at: new Date().toISOString() })
    .select('id')
    .single();

  if (createError) throw createError;
  return created.id;
}

async function getOrCreateWorkoutExercise(
  userId: string,
  workoutId: string,
  exerciseId: string,
  exerciseName: string
): Promise<string> {
  const { data: existing, error: findError } = await supabase
    .from('workout_exercises')
    .select('id')
    .eq('workout_id', workoutId)
    .eq('exercise_id', exerciseId)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing.id;

  const { count } = await supabase
    .from('workout_exercises')
    .select('id', { count: 'exact', head: true })
    .eq('workout_id', workoutId);

  const { data: created, error: createError } = await supabase
    .from('workout_exercises')
    .insert({
      workout_id: workoutId,
      user_id: userId,
      exercise_id: exerciseId,
      name: exerciseName,
      position: count ?? 0,
    })
    .select('id')
    .single();

  if (createError) throw createError;
  return created.id;
}

/**
 * Logs one set. Finds-or-creates today's workout and this exercise's row
 * within it (the mobile UI has no explicit "start workout" step, unlike the
 * web dashboard), then inserts the set - matching the same
 * workouts -> workout_exercises -> sets shape the web app uses.
 */
export async function logSet(params: {
  userId: string;
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  setType?: SetType;
  rpe?: number;
  /** 'YYYY-MM-DD' to back-fill a past day; omitted means today. */
  dateKey?: string;
}): Promise<SetEntry> {
  const { userId, exerciseId, exerciseName, weightKg, reps, setType = 'normal', rpe, dateKey } = params;

  const workoutId = dateKey
    ? await getOrCreateWorkoutForDate(userId, dateKey)
    : await getOrCreateTodayWorkout(userId);
  const workoutExerciseId = await getOrCreateWorkoutExercise(userId, workoutId, exerciseId, exerciseName);

  const { count } = await supabase
    .from('sets')
    .select('id', { count: 'exact', head: true })
    .eq('workout_exercise_id', workoutExerciseId);

  const { data, error } = await supabase
    .from('sets')
    .insert({
      workout_exercise_id: workoutExerciseId,
      user_id: userId,
      weight: weightKg,
      reps,
      completed: true,
      position: count ?? 0,
      set_type: setType,
      rpe: rpe ?? null,
      // Back-filled sets must carry the target day too, or volume queries
      // (which read sets.created_at, not the workout's) count them as today.
      ...(dateKey ? { created_at: dateKeyToIso(dateKey) } : {}),
    })
    .select('id, created_at')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    exerciseId,
    weightKg,
    reps,
    timestamp: new Date(data.created_at).getTime(),
    setType,
    rpe,
  };
}

/**
 * Corrects an already-logged set. Everything downstream - volume totals, PR
 * detection, load suggestions - reads these rows, so without this a mistyped
 * weight quietly poisons every number the app shows.
 */
export async function updateSet(
  setId: string,
  values: { weightKg: number; reps: number; setType: SetType; rpe?: number }
): Promise<void> {
  const { error } = await supabase
    .from('sets')
    .update({
      weight: values.weightKg,
      reps: values.reps,
      set_type: values.setType,
      rpe: values.rpe ?? null,
    })
    .eq('id', setId);

  if (error) throw error;
}

export async function deleteSet(setId: string): Promise<void> {
  const { error } = await supabase.from('sets').delete().eq('id', setId);
  if (error) throw error;
}

/** The session in progress: today's workout that was started and not ended. */
export async function fetchActiveSession(userId: string): Promise<WorkoutSessionRow | null> {
  const { data, error } = await supabase
    .from('workouts')
    .select('id, created_at, started_at, finished_at')
    .eq('user_id', userId)
    .is('finished_at', null)
    .gte('created_at', startOfTodayIso())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    // A row from before session tracking has no started_at; its creation time
    // is the closest honest answer rather than showing no timer at all.
    startedAt: new Date(data.started_at ?? data.created_at).getTime(),
    finishedAt: null,
  };
}

export interface WorkoutSessionRow {
  id: string;
  startedAt: number;
  finishedAt: number | null;
}

/** Ends the session and hands back the finish time used, for the summary. */
export async function finishWorkout(workoutId: string): Promise<number> {
  const finishedAt = new Date();
  const { error } = await supabase
    .from('workouts')
    .update({ finished_at: finishedAt.toISOString() })
    .eq('id', workoutId);

  if (error) throw error;
  return finishedAt.getTime();
}

export interface SessionSummary {
  workoutId: string;
  dateKey: string;
  startedAt: number | null;
  finishedAt: number | null;
  /** Seconds, or null when the session was never explicitly started/ended. */
  durationSeconds: number | null;
  /** Started but never finished - the user closed the app mid-session. Kept
   *  distinct from a back-filled day, which never had a clock at all. */
  unfinished: boolean;
  setCount: number;
  totalVolumeKg: number;
  exerciseNames: string[];
}

interface HistoryRow {
  id: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  workout_exercises: { name: string; sets: { weight: number; reps: number; completed: boolean }[] }[];
}

function toDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Past sessions, newest first, with their totals rolled up. Aggregating in one
 * nested select rather than a query per workout keeps the history screen to a
 * single round trip.
 *
 * Workouts with no completed sets are dropped: an empty row gets created the
 * moment a day is opened, and listing those as "sessions" would pad the
 * history with days nothing happened.
 */
export async function fetchSessionHistory(userId: string, limit = 30): Promise<SessionSummary[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('id, created_at, started_at, finished_at, workout_exercises(name, sets(weight, reps, completed))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return ((data ?? []) as unknown as HistoryRow[])
    .map((row) => {
      let setCount = 0;
      let totalVolumeKg = 0;
      const exerciseNames: string[] = [];

      for (const we of row.workout_exercises ?? []) {
        const done = (we.sets ?? []).filter((s) => s.completed);
        if (done.length === 0) continue;
        exerciseNames.push(we.name);
        setCount += done.length;
        for (const s of done) totalVolumeKg += Number(s.weight) * s.reps;
      }

      const startedAt = row.started_at ? new Date(row.started_at).getTime() : null;
      const finishedAt = row.finished_at ? new Date(row.finished_at).getTime() : null;

      return {
        workoutId: row.id,
        dateKey: toDateKey(row.created_at),
        startedAt,
        finishedAt,
        durationSeconds:
          startedAt != null && finishedAt != null ? Math.round((finishedAt - startedAt) / 1000) : null,
        unfinished: startedAt != null && finishedAt == null,
        setCount,
        totalVolumeKg: Math.round(totalVolumeKg),
        exerciseNames,
      };
    })
    .filter((session) => session.setCount > 0);
}
