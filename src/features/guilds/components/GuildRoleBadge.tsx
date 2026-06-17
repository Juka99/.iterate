import type { GuildRole } from '../guildTypes';
import styles from '../GuildPage.module.scss';

const roleLabels: Record<GuildRole, string> = {
  captain: 'Captain',
  guild_master: 'Guild Master',
  hunter: 'Hunter',
};

interface GuildRoleBadgeProps {
  role: GuildRole;
}

export function GuildRoleBadge({ role }: GuildRoleBadgeProps) {
  return <span className={styles.roleBadge}>{roleLabels[role]}</span>;
}
