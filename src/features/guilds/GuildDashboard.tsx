import { Card } from '@/components/ui/Card';
import { GuildActivityFeed } from './components/GuildActivityFeed';
import { GuildBossCard } from './components/GuildBossCard';
import { GuildChatCard } from './components/GuildChatCard';
import { GuildHeader } from './components/GuildHeader';
import { GuildMemberList } from './components/GuildMemberList';
import { GuildProjectCard } from './components/GuildProjectCard';
import { useLeaveGuild, useStartGuildBoss, useStartGuildProject } from './hooks/useGuildMutations';
import type { GuildOverview } from './guildTypes';
import styles from './GuildPage.module.scss';

interface GuildDashboardProps {
  overview: GuildOverview;
  userId: string;
}

export function GuildDashboard({ overview, userId }: GuildDashboardProps) {
  const leaveGuild = useLeaveGuild(userId);
  const startBoss = useStartGuildBoss(userId);
  const startProject = useStartGuildProject(userId);
  const canLead = overview.membership.role === 'guild_master' || overview.membership.role === 'captain';
  const topContributors = overview.members.slice(0, 4);

  return (
    <div className={styles.guildDashboard}>
      <GuildHeader isLeaving={leaveGuild.isPending} onLeave={() => leaveGuild.mutate(overview)} overview={overview} />
      {leaveGuild.error && <p className={styles.error}>{leaveGuild.error instanceof Error ? leaveGuild.error.message : 'Could not leave guild.'}</p>}

      <GuildChatCard guildId={overview.guild.id} members={overview.members} userId={userId} />

      <section className={styles.guildGrid}>
        <GuildBossCard
          boss={overview.boss}
          canStart={canLead}
          isStarting={startBoss.isPending}
          onStart={() => startBoss.mutate(overview.guild.id)}
        />
        <GuildProjectCard
          canStart={canLead}
          isStarting={startProject.isPending}
          onStart={() => startProject.mutate(overview.guild.id)}
          project={overview.project}
        />
      </section>

      <section className={styles.guildGrid}>
        <Card className={styles.contributorsCard} eyebrow="This week" title="Top contributors">
          <div className={styles.contributorList}>
            {topContributors.map((member, index) => (
              <article key={member.id}>
                <span>{index + 1}</span>
                <div>
                  <strong>{member.profile?.username || `Hunter ${member.user_id.slice(0, 6)}`}</strong>
                  <small>{member.weekly_xp_contributed.toLocaleString()} Guild XP</small>
                </div>
              </article>
            ))}
          </div>
        </Card>
        <GuildActivityFeed activity={overview.activity} />
      </section>

      <GuildMemberList currentUserId={userId} isGuildMaster={overview.membership.role === 'guild_master'} members={overview.members} />

    </div>
  );
}
