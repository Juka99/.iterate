import type { RankDefinition, RankProgress } from './rankTypes';

export const RANKS: RankDefinition[] = [
  { name: 'E', classTitle: 'Iron Initiate', minXp: 0, maxXp: 249, order: 1 },
  { name: 'D', classTitle: 'Bronze Scout', minXp: 250, maxXp: 749, order: 2 },
  { name: 'C', classTitle: 'Silver Adept', minXp: 750, maxXp: 1499, order: 3 },
  { name: 'B', classTitle: 'Violet Vanguard', minXp: 1500, maxXp: 2999, order: 4 },
  { name: 'A', classTitle: 'Sapphire Elite', minXp: 3000, maxXp: 4999, order: 5 },
  { name: 'S', classTitle: 'Golden Sovereign', minXp: 5000, maxXp: 7999, order: 6 },
  { name: 'SS', classTitle: 'Mythic Paragon', minXp: 8000, maxXp: 11999, order: 7 },
  { name: 'SSS', classTitle: 'Celestial Ascendant', minXp: 12000, maxXp: null, order: 8 },
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
