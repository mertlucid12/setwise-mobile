import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchActiveSession,
  finishWorkout,
  WorkoutSessionRow,
} from '@/services/workouts';

/**
 * The workout session in progress. Until now a "workout" was only a day
 * marker, so the app could never say how long you trained or show a session
 * summary - Finish just cleared local state.
 *
 * The session starts implicitly with the first logged set (the service stamps
 * started_at when it creates the day's row), which is why there's no start
 * button: making people press one before their first set is a step they'd
 * forget, and then the whole session would be untimed.
 *
 * Elapsed time is derived from startedAt on every tick rather than counted
 * up, so backgrounding the app or locking the phone can't drift the clock -
 * the ticker only exists to force a re-render.
 */
export function useWorkoutSession() {
  const { session: authSession } = useAuth();
  const userId = authSession?.user.id ?? null;

  const [session, setSession] = useState<WorkoutSessionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [, forceTick] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setSession(null);
      setLoading(false);
      return;
    }
    try {
      setSession(await fetchActiveSession(userId));
    } catch {
      // A failed lookup only costs the timer display; logging still works, so
      // this must never block the screen.
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Coming back from the background can cross midnight or land after the
  // session was finished on another device.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') reload();
    });
    return () => sub.remove();
  }, [reload]);

  useEffect(() => {
    if (!session) {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }
    tickRef.current = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [session]);

  const elapsedSeconds = session ? Math.max(0, Math.floor((Date.now() - session.startedAt) / 1000)) : 0;

  /** Ends the session and returns its id so the caller can pull the summary. */
  async function finish(): Promise<string | null> {
    if (!session) return null;
    const workoutId = session.id;
    await finishWorkout(workoutId);
    setSession(null);
    return workoutId;
  }

  return { session, elapsedSeconds, loading, finish, reload };
}
