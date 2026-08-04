import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { Session } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '@/services/supabase';
import { clearExercisesCache } from '@/hooks/useExercises';
import { saveProfile, EMPTY_PROFILE } from '@/services/profile';
import { clearSessionActivity, hasSessionIdledOut, markSessionActive } from '@/services/sessionExpiry';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextValue {
  session: Session | null;
  initializing: boolean;
  passwordRecovery: boolean;
  /** Set when a stored session was dropped for being idle too long, so the
   *  auth screen can say why the user is looking at a login form again. */
  sessionExpired: boolean;
  acknowledgeSessionExpired: () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  resendConfirmationEmail: (email: string) => Promise<{ error: string | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Recovery-link redirects arrive as `setwise://reset-password?code=...` (PKCE).
 * Must ignore every other deep link - notably `setwise://auth-callback` from
 * signInWithGoogle, which already exchanges its own code directly. Reacting
 * to that link here too would consume the same one-time PKCE code twice and
 * make one of the two exchanges fail.
 */
async function handleIncomingUrl(url: string | null) {
  if (!url) return;
  const parsed = new URL(url);
  if (parsed.hostname !== 'reset-password' && !parsed.pathname.includes('reset-password')) return;
  const code = parsed.searchParams.get('code');
  if (code) await supabase.auth.exchangeCodeForSession(code);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    /**
     * Restore the stored session, but only if it hasn't gone stale. Without
     * this the app silently signs the last account back in no matter how long
     * ago that was - what the user should get after a long break is the email
     * and password form.
     */
    async function restore() {
      const { data } = await supabase.auth.getSession();
      if (data.session && (await hasSessionIdledOut())) {
        await supabase.auth.signOut();
        await clearSessionActivity();
        clearExercisesCache();
        setSession(null);
        setSessionExpired(true);
      } else {
        setSession(data.session);
        if (data.session) await markSessionActive();
      }
      setInitializing(false);
    }
    restore();

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      // A fresh sign-in (or a token refresh, which only happens while the app
      // is in use) restarts the idle clock.
      if (newSession) markSessionActive();
    });

    // Foregrounding is the other moment the clock matters: an app left running
    // in the background for weeks would otherwise never re-check on launch.
    const appStateSub = AppState.addEventListener('change', async (state) => {
      if (state !== 'active') return;
      const { data } = await supabase.auth.getSession();
      if (data.session && (await hasSessionIdledOut())) {
        await supabase.auth.signOut();
        await clearSessionActivity();
        clearExercisesCache();
        setSessionExpired(true);
      } else if (data.session) {
        await markSessionActive();
      }
    });

    Linking.getInitialURL().then(handleIncomingUrl);
    const urlSub = Linking.addEventListener('url', ({ url }) => handleIncomingUrl(url));

    return () => {
      listener.subscription.unsubscribe();
      appStateSub.remove();
      urlSub.remove();
    };
  }, []);

  const value: AuthContextValue = {
    session,
    initializing,
    passwordRecovery,
    sessionExpired,
    acknowledgeSessionExpired: () => setSessionExpired(false),
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) setSessionExpired(false);
      return { error: error?.message ?? null };
    },
    signUp: async (email, password, fullName) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (!error && data.session && data.user) {
        // Spread the empty profile rather than listing every field: this seeds
        // a brand-new row, so it should pick up any column added later without
        // needing to be edited again.
        await saveProfile(data.user.id, { ...EMPTY_PROFILE, displayName: fullName }).catch(() => {});
      }
      // Supabase projects with "Confirm email" enabled return no error and no
      // session on signUp - the account exists but can't sign in until the
      // user clicks the confirmation link in their inbox.
      return { error: error?.message ?? null, needsEmailConfirmation: !error && !data.session };
    },
    signInWithGoogle: async () => {
      const redirectTo = AuthSession.makeRedirectUri({ scheme: 'setwise', path: 'auth-callback' });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data?.url) return { error: error?.message ?? 'Google girişi başlatılamadı.' };

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success' || !result.url) {
        return result.type === 'cancel' ? { error: null } : { error: 'Google girişi tamamlanamadı.' };
      }

      const code = new URL(result.url).searchParams.get('code');
      if (!code) return { error: 'Google girişinden yetkilendirme kodu alınamadı.' };

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      return { error: exchangeError?.message ?? null };
    },
    resendConfirmationEmail: async (email) => {
      const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
      return { error: error?.message ?? null };
    },
    resetPasswordForEmail: async (email) => {
      const redirectTo = AuthSession.makeRedirectUri({ scheme: 'setwise', path: 'reset-password' });
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      return { error: error?.message ?? null };
    },
    updatePassword: async (newPassword) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (!error) setPasswordRecovery(false);
      return { error: error?.message ?? null };
    },
    signOut: async () => {
      await supabase.auth.signOut();
      await clearSessionActivity();
      clearExercisesCache();
      setPasswordRecovery(false);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
