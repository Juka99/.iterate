import type { Database } from './database';

export type Challenge = Database['public']['Tables']['challenges']['Row'];
export type ChallengeCadence = Challenge['cadence'];
export type ChallengeDifficulty = Challenge['difficulty'];
export type UserChallenge = Database['public']['Tables']['user_challenges']['Row'];
export type XpLog = Database['public']['Tables']['xp_logs']['Row'];

export interface ChallengeWithCompletion extends Challenge {
  completed_at?: string | null;
  is_completed: boolean;
}

export interface ChallengeSections {
  daily: ChallengeWithCompletion[];
  repeatable: ChallengeWithCompletion[];
  weekly: ChallengeWithCompletion[];
}

export interface RecentActivityItem {
  amount: number;
  category?: string | null;
  created_at: string;
  id: string;
  reason: string;
}
