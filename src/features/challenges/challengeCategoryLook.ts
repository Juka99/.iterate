import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Brain, Dumbbell, Flame, Focus, HeartPulse, Sparkles, Sprout, Swords, Target } from 'lucide-react';

const challengeCategoryLooks = [
  {
    icon: Focus,
    keys: ['focus', 'productivity', 'clarity'],
    primary: '34 211 238',
    secondary: '59 130 246',
  },
  {
    icon: HeartPulse,
    keys: ['health', 'wellness', 'recovery'],
    primary: '45 212 191',
    secondary: '34 197 94',
  },
  {
    icon: Swords,
    keys: ['discipline', 'consistency', 'routine'],
    primary: '59 130 246',
    secondary: '124 58 237',
  },
  {
    icon: Sprout,
    keys: ['growth', 'learning', 'skill'],
    primary: '34 197 94',
    secondary: '132 204 22',
  },
  {
    icon: Flame,
    keys: ['courage', 'hard', 'bravery'],
    primary: '251 113 133',
    secondary: '249 115 22',
  },
  {
    icon: Dumbbell,
    keys: ['strength', 'fitness', 'movement'],
    primary: '251 191 36',
    secondary: '245 158 11',
  },
  {
    icon: Brain,
    keys: ['mind', 'thinking', 'mental'],
    primary: '168 85 247',
    secondary: '236 72 153',
  },
  {
    icon: Sparkles,
    keys: ['creative', 'creativity', 'craft'],
    primary: '244 114 182',
    secondary: '217 70 239',
  },
] as const;

const fallbackChallengeLook = {
  icon: Target,
  primary: '139 92 246',
  secondary: '34 211 238',
};

type ChallengeIconStyle = CSSProperties & {
  '--challenge-icon-primary': string;
  '--challenge-icon-secondary': string;
};

export interface ChallengeCategoryLook {
  icon: LucideIcon;
  primary: string;
  secondary: string;
}

export function getChallengeCategoryLook(category: string): ChallengeCategoryLook {
  const normalizedCategory = category.toLowerCase();

  return (
    challengeCategoryLooks.find(({ keys }) => keys.some((key) => normalizedCategory.includes(key))) ?? fallbackChallengeLook
  );
}

export function getChallengeIconStyle({ primary, secondary }: ChallengeCategoryLook): ChallengeIconStyle {
  return {
    '--challenge-icon-primary': primary,
    '--challenge-icon-secondary': secondary,
  };
}
