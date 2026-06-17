import type { Challenge } from '@/types/challenge';

export function getChallengeEssenceReward(challenge: Challenge) {
  return Math.max(5, Math.round(challenge.xp_reward / 5));
}
