import type { RankDefinition, RankProgress } from './rankTypes';

export const RANKS: RankDefinition[] = [
  { name: 'E', minXp: 0, maxXp: 249, order: 1 },
  { name: 'D', minXp: 250, maxXp: 749, order: 2 },
  { name: 'C', minXp: 750, maxXp: 1499, order: 3 },
  { name: 'B', minXp: 1500, maxXp: 2999, order: 4 },
  { name: 'A', minXp: 3000, maxXp: 4999, order: 5 },
  { name: 'S', minXp: 5000, maxXp: null, order: 6 },
];

export function getRankForXp(totalXp: number): RankDefinition {
  return RANKS.find((rank) => totalXp >= rank.minXp && (rank.maxXp === null || totalXp <= rank.maxXp)) ?? RANKS[0];
}

export function getRankProgress(totalXp: number): RankProgress {
  const currentRank = getRankForXp(totalXp);
  const nextRank = RANKS.find((rank) => rank.order === currentRank.order + 1) ?? null;

  if (!nextRank) {
    return {
      currentRank,
      nextRank,
      progressMax: 1,
      progressValue: 1,
    };
  }

  return {
    currentRank,
    nextRank,
    progressMax: nextRank.minXp - currentRank.minXp,
    progressValue: Math.max(totalXp - currentRank.minXp, 0),
  };
}

