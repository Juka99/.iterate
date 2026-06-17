import { useState } from 'react';
import { Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import type { ChallengeWithCompletion } from '@/types/challenge';
import { formatResetDistance, getNextDailyReset, getNextWeeklyReset } from './challengesService';
import { ChallengeList } from './components/ChallengeList';
import { useChallengeSections } from './hooks/useChallengeSections';
import { useCompleteChallenge } from './hooks/useCompleteChallenge';
import { useRevertChallengeCompletion } from './hooks/useRevertChallengeCompletion';
import styles from './ChallengesPage.module.scss';

interface ChallengeSectionProps {
  challenges: ChallengeWithCompletion[];
  completingChallengeId?: string;
  emptyMessage: string;
  eyebrow: string;
  meta: string;
  showClock?: boolean;
  onComplete: (challenge: ChallengeWithCompletion) => void;
  onRevert: (challenge: ChallengeWithCompletion) => void;
  title: string;
}

function ChallengeSection({
  challenges,
  completingChallengeId,
  emptyMessage,
  eyebrow,
  meta,
  showClock = false,
  onComplete,
  onRevert,
  title,
}: ChallengeSectionProps) {
  return (
    <Card className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <p>{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <span>
          {showClock && <Clock />}
          {meta}
        </span>
      </div>
      <ChallengeList
        challenges={challenges}
        completingChallengeId={completingChallengeId}
        emptyMessage={emptyMessage}
        onComplete={onComplete}
        onRevert={onRevert}
      />
    </Card>
  );
}

export function ChallengesPage() {
  const { user } = useAuthSession();
  const [completingChallengeId, setCompletingChallengeId] = useState<string | undefined>();
  const { data: sections, error, isLoading } = useChallengeSections(user?.id);
  const completeChallenge = useCompleteChallenge();
  const revertChallengeCompletion = useRevertChallengeCompletion();
  const dailyResetLabel = formatResetDistance(getNextDailyReset());
  const weeklyResetLabel = formatResetDistance(getNextWeeklyReset());

  async function handleComplete(challenge: ChallengeWithCompletion) {
    if (!user) {
      return;
    }

    setCompletingChallengeId(challenge.id);

    try {
      await completeChallenge.mutateAsync({ challenge, userId: user.id });
    } finally {
      setCompletingChallengeId(undefined);
    }
  }

  async function handleRevert(challenge: ChallengeWithCompletion) {
    if (!user) {
      return;
    }

    setCompletingChallengeId(challenge.id);

    try {
      await revertChallengeCompletion.mutateAsync({ challenge, userId: user.id });
    } finally {
      setCompletingChallengeId(undefined);
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.heading}>
        <p>Mission board</p>
        <h1>Challenges</h1>
      </section>
      <div className={styles.sections}>
        {isLoading && <Loader className={styles.state} label="Loading challenges" size="lg" />}
        {error && <p className={styles.error}>Could not load challenges.</p>}
        {!isLoading && !error && sections && (
          <>
            <ChallengeSection
              challenges={sections.daily}
              completingChallengeId={completingChallengeId}
              emptyMessage="No daily challenges are available at this rank."
              eyebrow="Daily reset"
              meta={`Resets in ${dailyResetLabel}`}
              onComplete={handleComplete}
              onRevert={handleRevert}
              showClock
              title="Daily tasks"
            />
            <ChallengeSection
              challenges={sections.weekly}
              completingChallengeId={completingChallengeId}
              emptyMessage="No weekly challenges are available at this rank."
              eyebrow="Weekly reset"
              meta={`Resets in ${weeklyResetLabel}`}
              onComplete={handleComplete}
              onRevert={handleRevert}
              showClock
              title="Weekly tasks"
            />
            <ChallengeSection
              challenges={sections.repeatable}
              completingChallengeId={completingChallengeId}
              emptyMessage="No repeatable training tasks are available at this rank."
              eyebrow="Training loop"
              meta="No reset limit"
              onComplete={handleComplete}
              onRevert={handleRevert}
              title="Repeatable tasks"
            />
          </>
        )}
      </div>
    </div>
  );
}
