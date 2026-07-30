import React, { createContext, useContext, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { Session } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '@/services/supabase';
import { clearExercisesCache } from '@/hooks/useExercises';
import { saveProfile } from '@/services/profile';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextValue {
  session: Session | null;
  initializing: boolean;
  passwordRecovery: boolean;
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
    });

    Linking.getInitialURL().then(handleIncomingUrl);
    const urlSub = Linking.addEventListener('url', ({ url }) => handleIncomingUrl(url));

    return () => {
      listener.subscription.unsubscribe();
      urlSub.remove();
    };
  }, []);

  const value: AuthContextValue = {
    session,
    initializing,
    passwordRecovery,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    signUp: async (email, password, fullName) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (!error && data.session && data.user) {
        await saveProfile(data.user.id, {
          displayName: fullName,
          weightKg: null,
          heightCm: null,
          gender: null,
          mainGoal: null,
          experienceLevel: null,
          goalWeightKg: null,
          onboardingCompleted: false,
        }).catch(() => {});
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
