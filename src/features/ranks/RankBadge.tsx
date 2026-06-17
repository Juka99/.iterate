import type { CSSProperties } from 'react';
import styles from './RankBadge.module.scss';

const rankBadgeLooks: Record<string, { alt: string; image: string; primary: string; secondary: string }> = {
  E: { alt: 'Rank E iron shield badge', image: '/assets/ranks/rank-e.png', primary: '148 163 184', secondary: '71 85 105' },
  D: { alt: 'Rank D bronze crest badge', image: '/assets/ranks/rank-d.png', primary: '34 197 94', secondary: '20 184 166' },
  C: { alt: 'Rank C silver cyan badge', image: '/assets/ranks/rank-c.png', primary: '34 211 238', secondary: '59 130 246' },
  B: { alt: 'Rank B violet amethyst badge', image: '/assets/ranks/rank-b.png', primary: '139 92 246', secondary: '217 70 239' },
  A: { alt: 'Rank A sapphire trophy badge', image: '/assets/ranks/rank-a.png', primary: '59 130 246', secondary: '34 211 238' },
  S: { alt: 'Rank S golden crown badge', image: '/assets/ranks/rank-s.png', primary: '251 191 36', secondary: '249 115 22' },
  SS: { alt: 'Rank SS rose violet mythic badge', image: '/assets/ranks/rank-ss.png', primary: '251 113 133', secondary: '124 58 237' },
  SSS: { alt: 'Rank SSS cosmic starburst badge', image: '/assets/ranks/rank-sss.png', primary: '244 114 182', secondary: '34 211 238' },
};

type RankBadgeStyle = CSSProperties & {
  '--rank-primary': string;
  '--rank-secondary': string;
};

interface RankBadgeProps {
  className?: string;
  rank: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function RankBadge({ className, rank, showLabel = true, size = 'md' }: RankBadgeProps) {
  const look = rankBadgeLooks[rank] ?? rankBadgeLooks.E;
  const badgeStyle: RankBadgeStyle = {
    '--rank-primary': look.primary,
    '--rank-secondary': look.secondary,
  };

  return (
    <span
      aria-label={`Rank ${rank}`}
      className={`${styles.badge} ${styles[size]} ${className ?? ''}`}
      data-rank={rank}
      style={badgeStyle}
    >
      <img alt={look.alt} src={look.image} />
      {showLabel && <strong>{rank}</strong>}
    </span>
  );
}
