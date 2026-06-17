import { useMemo, useState } from 'react';
import { CheckCircle, Coins, Gift, Lock, Sparkles, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { getShopItemById } from '@/features/shop/shopData';
import { useAchievements, useClaimAchievement } from './hooks/useAchievements';
import type { AchievementState } from './achievementTypes';
import styles from './AchievementsPage.module.scss';

function getCategoryLabel(category: AchievementState['category']) {
  return {
    challenge: 'Challenge',
    guild: 'Guild',
    rank: 'Rank',
    shop: 'Shop',
    streak: 'Streak',
  }[category];
}

function getStatusLabel(status: AchievementState['status']) {
  return {
    claimable: 'Ready',
    claimed: 'Claimed',
    locked: 'Locked',
  }[status];
}

function AchievementCard({
  achievement,
  isClaiming,
  onClaim,
}: {
  achievement: AchievementState;
  isClaiming: boolean;
  onClaim: (achievement: AchievementState) => void;
}) {
  const rewardItem = achievement.rewardItemId ? getShopItemById(achievement.rewardItemId) : null;
  const canClaim = achievement.status === 'claimable';
  const buttonIcon = achievement.status === 'claimed' ? <CheckCircle /> : achievement.status === 'locked' ? <Lock /> : <Gift />;
  const buttonLabel = achievement.status === 'claimed' ? 'Claimed' : achievement.status === 'locked' ? 'Locked' : isClaiming ? 'Claiming' : 'Claim';

  return (
    <article className={styles.achievementCard} data-status={achievement.status}>
      <div className={styles.achievementImage}>
        <img alt="" src={achievement.image} />
        <span>{getStatusLabel(achievement.status)}</span>
      </div>
      <div className={styles.achievementBody}>
        <div className={styles.achievementMeta}>
          <Badge tone={achievement.status === 'claimable' ? 'success' : achievement.status === 'claimed' ? 'info' : 'neutral'}>
            {getCategoryLabel(achievement.category)}
          </Badge>
        </div>
        <h3>{achievement.name}</h3>
        <p>{achievement.description}</p>
        <div className={styles.rewardBox}>
          <span>
            <Coins />
            {achievement.essenceReward.toLocaleString()} Essence
          </span>
          {rewardItem && (
            <span>
              <Gift />
              {rewardItem.name}
            </span>
          )}
        </div>
      </div>
      <div className={styles.achievementActions}>
        <Button disabled={!canClaim || isClaiming} icon={buttonIcon} onClick={() => onClaim(achievement)} variant={canClaim ? 'primary' : 'ghost'}>
          {buttonLabel}
        </Button>
      </div>
    </article>
  );
}

export function AchievementsPage() {
  const { user } = useAuthSession();
  const { data: achievements = [], error, isLoading } = useAchievements(user?.id);
  const claimAchievement = useClaimAchievement(user?.id);
  const [pendingAchievementId, setPendingAchievementId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const counts = useMemo(
    () => ({
      claimable: achievements.filter((achievement) => achievement.status === 'claimable').length,
      claimed: achievements.filter((achievement) => achievement.status === 'claimed').length,
      total: achievements.length,
    }),
    [achievements],
  );

  async function handleClaim(achievement: AchievementState) {
    setPendingAchievementId(achievement.id);
    setMessage(null);

    try {
      const claim = await claimAchievement.mutateAsync(achievement.id);
      const rewardItem = claim.reward_item_id ? getShopItemById(claim.reward_item_id) : null;
      const rewardParts = [claim.essence_reward > 0 ? `${claim.essence_reward.toLocaleString()} Essence` : null, rewardItem?.name ?? null].filter(Boolean);
      setMessage(`${achievement.name} claimed${rewardParts.length > 0 ? `: ${rewardParts.join(' and ')}` : '.'}`);
    } catch (claimError) {
      setMessage(claimError instanceof Error ? claimError.message : 'Achievement could not be claimed.');
    } finally {
      setPendingAchievementId(null);
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroIcon}>
          <Trophy />
        </div>
        <div>
          <p>Milestone archive</p>
          <h1>Achievements</h1>
          <span>Claim rewards for rank climbs, challenge consistency, guild victories, and shop milestones.</span>
        </div>
        <dl className={styles.heroStats}>
          <div>
            <dt>Ready</dt>
            <dd>{counts.claimable}</dd>
          </div>
          <div>
            <dt>Claimed</dt>
            <dd>{counts.claimed}</dd>
          </div>
        </dl>
      </section>

      {message && <p className={styles.message}>{message}</p>}
      {isLoading && (
        <Card className={styles.state}>
          <Loader label="Loading achievements" size="md" />
        </Card>
      )}
      {error && <Card className={styles.error}>Achievements could not be loaded. Check the achievements migration and Supabase policies.</Card>}

      {!isLoading && !error && (
        <>
          <Card className={styles.summaryCard} eyebrow="Rewards" title="Collection Progress">
            <div className={styles.summaryGrid}>
              <article>
                <Sparkles />
                <span>Available claims</span>
                <strong>{counts.claimable}</strong>
              </article>
              <article>
                <CheckCircle />
                <span>Collected</span>
                <strong>
                  {counts.claimed}/{counts.total}
                </strong>
              </article>
            </div>
          </Card>

          <section className={styles.achievementGrid}>
            {achievements.map((achievement) => (
              <AchievementCard
                achievement={achievement}
                isClaiming={pendingAchievementId === achievement.id}
                key={achievement.id}
                onClaim={handleClaim}
              />
            ))}
          </section>
        </>
      )}
    </div>
  );
}
