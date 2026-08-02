import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Supabase refresh tokens don't expire on their own, so a stored session keeps
 * signing the last account back in forever - open the app after a month away
 * and you're straight into someone else's data with no password asked.
 *
 * This adds an idle timeout on top: the app records when it was last used, and
 * a session that has gone untouched for longer than IDLE_LIMIT_MS is dropped
 * on the next launch, sending the user back to the email + password form.
 * Active users never see it, because every foreground stamps the clock again.
 */
const LAST_ACTIVE_KEY = 'setwise.lastActiveAt';

/** 14 days - long enough to survive a holiday, short enough that a forgotten
 *  phone doesn't stay signed in indefinitely. */
export const IDLE_LIMIT_MS = 14 * 24 * 60 * 60 * 1000;

export async function markSessionActive(): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  } catch {
    // A failed stamp only risks an extra sign-in prompt, never lost data.
  }
}

/**
 * True when the stored session has been idle past the limit. A missing or
 * unparseable stamp counts as fresh: it means this build wrote no stamp yet
 * (first launch after upgrading), and logging those users out would punish
 * them for our own missing data.
 */
export async function hasSessionIdledOut(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
    if (!raw) return false;
    const lastActive = Number(raw);
    if (!Number.isFinite(lastActive)) return false;
    return Date.now() - lastActive > IDLE_LIMIT_MS;
  } catch {
    return false;
  }
}

export async function clearSessionActivity(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LAST_ACTIVE_KEY);
  } catch {
    // Ignored for the same reason as above.
  }
}
