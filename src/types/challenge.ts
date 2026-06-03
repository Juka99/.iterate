import type { Database } from './database';

export type Challenge = Database['public']['Tables']['challenges']['Row'];
export type ChallengeDifficulty = Challenge['difficulty'];
export type UserChallenge = Database['public']['Tables']['user_challenges']['Row'];
export type XpLog = Database['public']['Tables']['xp_logs']['Row'];

export interface RecentActivityItem {
  amount: number;
  created_at: string;
  id: string;
  reason: string;
}

