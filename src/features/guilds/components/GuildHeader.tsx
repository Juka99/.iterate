import { Crown, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { GuildOverview } from '../guildTypes';
import { GuildXpBar } from './GuildXpBar';
import styles from '../GuildPage.module.scss';

interface GuildHeaderProps {
  isLeaving: boolean;
  onLeave: () => void;
  overview: GuildOverview;
}

export function GuildHeader({ isLeaving, onLeave, overview }: GuildHeaderProps) {
  const { guild, members } = overview;

  return (
    <section className={styles.guildHero}>
      <div className={styles.guildEmblem}>
        {guild.emblem_url ? <img alt="" src={guild.emblem_url} /> : <Shield />}
      </div>
      <div className={styles.guildHeroCopy}>
        <p>Guild Hall</p>
        <h1>{guild.name}</h1>
        <span>{guild.description || 'A shared progression hall for hunters who turn personal wins into collective power.'}</span>
        <GuildXpBar totalXp={guild.total_xp} />
      </div>
      <div className={styles.guildHeroStats}>
        <div>
          <Crown />
          <span>Level</span>
          <strong>{guild.level}</strong>
        </div>
        <div>
          <Shield />
          <span>Members</span>
          <strong>
            {members.length}/{guild.member_limit}
          </strong>
        </div>
        <Button onClick={onLeave} variant="ghost">
          {isLeaving ? 'Leaving' : 'Leave'}
        </Button>
      </div>
    </section>
  );
}
