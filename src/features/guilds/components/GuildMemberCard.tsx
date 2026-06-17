import { Clock, Flame, Target, UserMinus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RankBadge } from '@/features/ranks/RankBadge';
import type { GuildMemberWithProfile } from '../guildTypes';
import { GuildRoleBadge } from './GuildRoleBadge';
import styles from '../GuildPage.module.scss';

interface GuildMemberCardProps {
  canManage?: boolean;
  member: GuildMemberWithProfile;
  onRequestDemote?: (member: GuildMemberWithProfile) => void;
  onRequestPromote?: (member: GuildMemberWithProfile) => void;
  onRequestRemove?: (member: GuildMemberWithProfile) => void;
}

function formatLastActive(lastActive: string | null) {
  if (!lastActive) {
    return 'No guild activity yet';
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(lastActive));
}

function getMemberName(member: GuildMemberWithProfile) {
  return member.profile?.username || `Hunter ${member.user_id.slice(0, 6)}`;
}

export function GuildMemberCard({ canManage = false, member, onRequestDemote, onRequestPromote, onRequestRemove }: GuildMemberCardProps) {
  const username = getMemberName(member);
  const rank = member.profile?.current_rank ?? 'E';
  const canPromote = canManage && member.role === 'hunter';
  const canDemote = canManage && member.role === 'captain';
  const canRemove = canManage && member.role !== 'guild_master';

  return (
    <article className={styles.memberCard}>
      <div className={styles.memberIdentity}>
        <RankBadge rank={rank} showLabel={false} size="sm" />
        <div>
          <strong>{username}</strong>
          <GuildRoleBadge role={member.role} />
        </div>
      </div>
      <dl className={styles.memberStats}>
        <div>
          <Target />
          <dt>Week XP</dt>
          <dd>{member.weekly_xp_contributed.toLocaleString()}</dd>
        </div>
        <div>
          <Flame />
          <dt>Today</dt>
          <dd>{member.challengesCompletedToday}</dd>
        </div>
        <div>
          <Clock />
          <dt>Last active</dt>
          <dd>{formatLastActive(member.lastActive)}</dd>
        </div>
      </dl>
      {(canPromote || canDemote || canRemove) && (
        <div className={styles.memberActions}>
          {canPromote && (
            <Button icon={<UserPlus />} onClick={() => onRequestPromote?.(member)} variant="secondary">
              Promote
            </Button>
          )}
          {canDemote && (
            <Button icon={<UserMinus />} onClick={() => onRequestDemote?.(member)} variant="secondary">
              Demote
            </Button>
          )}
          {canRemove && (
            <Button icon={<UserMinus />} onClick={() => onRequestRemove?.(member)} variant="danger">
              Kick
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
