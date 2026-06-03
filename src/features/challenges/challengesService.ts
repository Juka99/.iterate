import { supabase } from '@/lib/supabaseClient';
import { getRankForXp } from '@/features/ranks/rankUtils';
import type { Challenge, RecentActivityItem } from '@/types/challenge';

export async function getDailyChallenges(limit = 3): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data;
}

export async function getRecentActivity(userId: string, limit = 5): Promise<RecentActivityItem[]> {
  const { data, error } = await supabase
    .from('xp_logs')
    .select('id, amount, reason, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data;
}

export async function completeChallenge(userId: string, challenge: Challenge) {
  const now = new Date().toISOString();

  const { error: completionError } = await supabase.from('user_challenges').insert({
    challenge_id: challenge.id,
    completed_at: now,
    status: 'completed',
    user_id: userId,
  });

  if (completionError) {
    throw completionError;
  }

  const { error: logError } = await supabase.from('xp_logs').insert({
    amount: challenge.xp_reward,
    reason: `Completed ${challenge.title}`,
    source_id: challenge.id,
    source_type: 'challenge',
    user_id: userId,
  });

  if (logError) {
    throw logError;
  }

  const { data: profile, error: profileError } = await supabase.from('profiles').select('total_xp').eq('id', userId).single();

  if (profileError) {
    throw profileError;
  }

  const nextXp = (profile?.total_xp ?? 0) + challenge.xp_reward;
  const nextRank = getRankForXp(nextXp).name;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ current_rank: nextRank, total_xp: nextXp })
    .eq('id', userId);

  if (updateError) {
    throw updateError;
  }

  return { nextRank, nextXp };
}

