export interface RankDefinition {
  maxXp: number | null;
  minXp: number;
  name: string;
  order: number;
}

export interface RankProgress {
  currentRank: RankDefinition;
  nextRank: RankDefinition | null;
  progressMax: number;
  progressValue: number;
}

