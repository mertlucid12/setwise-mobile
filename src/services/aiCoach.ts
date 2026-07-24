import { SetEntry, AICoachMessage, Exercise } from '@/types';
import { computeWeeklyMuscleVolume } from './volume';
import { supabase } from './supabase';

/**
 * Calls the 'aiCoach' Supabase Edge Function, which holds the Anthropic API
 * key server-side. supabase.functions.invoke resolves the project URL and
 * attaches the current session's auth token automatically.
 */
export async function askCoach(
  userMessage: string,
  recentSets: SetEntry[],
  exercises: Exercise[],
  history: AICoachMessage[]
): Promise<string> {
  const volumeSummary = computeWeeklyMuscleVolume(recentSets, exercises);

  const context = {
    weeklyVolume: volumeSummary,
    recentMessages: history.slice(-6), // keep the payload small
  };

  const { data, error } = await supabase.functions.invoke('aiCoach', {
    body: { message: userMessage, context },
  });

  if (error) {
    throw new Error(`AI coach request failed: ${error.message}`);
  }
  if (typeof data?.reply !== 'string') {
    throw new Error('AI coach response missing "reply" string field');
  }
  return data.reply;
}
