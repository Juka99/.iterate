import type { Database } from '@/types/database';

export type UserAchievement = Database['public']['Tables']['user_achievements']['Row'];

export type AchievementCategory = 'challenge' | 'guild' | 'rank' | 'shop' | 'streak';
export type AchievementStatus = 'claimable' | 'claimed' | 'locked';

export interface AchievementDefinition {
  category: AchievementCategory;
  description: string;
  essenceReward: number;
  id: string;
  image: string;
  name: string;
  rewardItemId?: string;
}

export interface AchievementState extends AchievementDefinition {
  claimedAt: string | null;
  status: AchievementStatus;
}
