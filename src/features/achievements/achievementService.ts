import { supabase } from '@/lib/supabaseClient';
import { ACHIEVEMENTS } from './achievementData';
import type { AchievementState, AchievementStatus, UserAchievement } from './achievementTypes';

export async function getUserAchievements(userId: string): Promise<AchievementState[]> {
  const [{ data: claimedAchievements, error: claimedError }, { data: unlockedAchievements, error: unlockedError }] = await Promise.all([
    supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('claimed_at', { ascending: false }),
    supabase.rpc('get_unlocked_achievement_ids', {}),
  ]);

  if (claimedError) {
    throw claimedError;
  }

  if (unlockedError) {
    throw unlockedError;
  }

  const claimedById = new Map((claimedAchievements ?? []).map((achievement) => [achievement.achievement_id, achievement]));
  const unlockedIds = new Set((unlockedAchievements ?? []).map((achievement) => achievement.achievement_id));

  return ACHIEVEMENTS.map((achievement) => {
    const claimed = claimedById.get(achievement.id);
    const status: AchievementStatus = claimed ? 'claimed' : unlockedIds.has(achievement.id) ? 'claimable' : 'locked';

    return {
      ...achievement,
      claimedAt: claimed?.claimed_at ?? null,
      status,
    };
  }).sort((a, b) => {
    const statusOrder: Record<AchievementStatus, number> = { claimable: 0, locked: 1, claimed: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });
}

export async function claimAchievement(achievementId: string): Promise<UserAchievement> {
  const { data, error } = await supabase.rpc('claim_achievement', { target_achievement_id: achievementId });

  if (error) {
    throw error;
  }

  return data;
}
