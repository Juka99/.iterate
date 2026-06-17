import { FormEvent, useEffect, useState } from 'react';
import { ImageOff, Save, User } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { SPECIALIZATION_PATHS } from '@/features/challenges/specializationPaths';
import { RANKS, getRankForXp } from '@/features/ranks/rankUtils';
import { getDefaultProfileCosmetics } from './profileCosmetics';
import { useProfileCosmetics } from './hooks/useProfileCosmetics';
import { useProfile } from './hooks/useProfile';
import { useProfileShowcaseStats } from './hooks/useProfileShowcaseStats';
import { chooseHunterLegacyPath, updateProfile } from './profileService';
import styles from './ProfilePage.module.scss';

export function ProfilePage() {
  const queryClient = useQueryClient();
  const { user } = useAuthSession();
  const { data: profile, error, isLoading } = useProfile(user?.id);
  const { data: cosmetics = getDefaultProfileCosmetics() } = useProfileCosmetics(user?.id);
  const shouldShowShowcase = cosmetics.showcase !== 'none';
  const { data: showcaseStats, isLoading: isShowcaseLoading } = useProfileShowcaseStats(user?.id, shouldShowShowcase);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [hasAvatarError, setHasAvatarError] = useState(false);
  const [isChoosingLegacyPath, setIsChoosingLegacyPath] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    setUsername(profile?.username ?? '');
    setAvatarUrl(profile?.avatar_url ?? '');
    setHasAvatarError(false);
  }, [profile]);

  const normalizedAvatarUrl = avatarUrl.trim();
  const earnedRanks = RANKS.filter((rank) => rank.order <= getRankForXp(profile?.total_xp ?? 0).order);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    const normalizedUsername = username.trim();

    if (normalizedUsername.length < 2 || normalizedUsername.length > 17) {
      setMessage('Username must be between 2 and 17 characters.');
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const updatedProfile = await updateProfile(user.id, {
        avatar_url: normalizedAvatarUrl || null,
        username: normalizedUsername,
      });
      queryClient.setQueryData(['profile', user.id], updatedProfile);
      await queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      setMessage('Profile saved.');
    } catch (profileError) {
      setMessage(profileError instanceof Error ? profileError.message : 'Profile could not be saved.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChooseLegacyPath(targetPath: string) {
    setIsChoosingLegacyPath(true);
    setMessage(null);

    try {
      const updatedProfile = await chooseHunterLegacyPath(targetPath);
      queryClient.setQueryData(['profile', updatedProfile.id], updatedProfile);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile', updatedProfile.id] }),
        queryClient.invalidateQueries({ queryKey: ['daily-challenges', updatedProfile.id] }),
        queryClient.invalidateQueries({ queryKey: ['challenge-sections', updatedProfile.id] }),
      ]);
      setMessage(`Hunter Legacy bound to the ${targetPath} path.`);
    } catch (legacyError) {
      setMessage(legacyError instanceof Error ? legacyError.message : 'Hunter Legacy path could not be chosen.');
    } finally {
      setIsChoosingLegacyPath(false);
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.heading}>
        <p>Identity</p>
        <h1>Profile</h1>
      </section>
      <Card title="Player details">
        {isLoading && <Loader className={styles.state} label="Loading profile" size="md" />}
        {error && <p className={styles.error}>Profile could not be loaded.</p>}
        {!isLoading && !error && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div
              className={`${styles.preview} ${
                cosmetics.nameplate === 'living' ? styles.livingIdentityCard : cosmetics.nameplate === 'paragon' ? styles.paragonIdentityCard : ''
              }`}
            >
              <div
                className={`${styles.avatar} ${
                  cosmetics.nameplate === 'living' ? styles.livingPlate : cosmetics.nameplate === 'paragon' ? styles.paragonPlate : ''
                } ${cosmetics.aura === 'iterated' ? styles.iteratedAura : ''} ${
                  cosmetics.frame === 'cosmic' ? styles.cosmicFrame : ''
                }`}
              >
                {normalizedAvatarUrl && !hasAvatarError ? (
                  <img alt="Profile avatar preview" onError={() => setHasAvatarError(true)} src={normalizedAvatarUrl} />
                ) : hasAvatarError ? (
                  <ImageOff />
                ) : (
                  <User />
                )}
              </div>
              <div>
                <strong className={cosmetics.nameplate === 'paragon' ? styles.paragonNameplate : cosmetics.nameplate === 'living' ? styles.livingNameplate : ''}>
                  {username.trim() || 'Player'}
                </strong>
                <span>{normalizedAvatarUrl && hasAvatarError ? 'Image could not be loaded.' : 'Avatar preview'}</span>
              </div>
            </div>
            <label>
              Username
              <input maxLength={17} minLength={2} onChange={(event) => setUsername(event.target.value)} placeholder="Choose a display name" required value={username} />
            </label>
            <label>
              Avatar URL
              <input
                onChange={(event) => {
                  setAvatarUrl(event.target.value);
                  setHasAvatarError(false);
                }}
                placeholder="https://..."
                type="url"
                value={avatarUrl}
              />
            </label>
            {message && <p className={styles.message}>{message}</p>}
            <Button disabled={isSaving} icon={<Save />} type="submit">
              {isSaving ? 'Saving' : 'Save profile'}
            </Button>
          </form>
        )}
      </Card>
      {!isLoading && !error && cosmetics.legacy && (
        <Card eyebrow="Permanent path" title="Hunter Legacy">
          <div className={styles.legacyCard}>
            {profile?.legacy_path ? (
              <>
                <strong>{profile.legacy_path} path chosen</strong>
                <p>Your permanent legacy objectives now follow this specialization in Challenges.</p>
              </>
            ) : (
              <>
                <strong>Choose your specialization</strong>
                <p>Hunter Legacy unlocks unique daily and weekly objectives once you bind it to a path.</p>
                <div className={styles.legacyOptions}>
                  {SPECIALIZATION_PATHS.map((path) => (
                    <button
                      className={styles.legacyOption}
                      disabled={isChoosingLegacyPath}
                      key={path.id}
                      onClick={() => handleChooseLegacyPath(path.id)}
                      type="button"
                    >
                      <span>{path.id}</span>
                      <small>{path.description}</small>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>
      )}
      {!isLoading && !error && cosmetics.showcase !== 'none' && (
        <Card
          title={cosmetics.showcase === 'monument' ? 'Hall of Legends' : 'Rank Showcase'}
          eyebrow={cosmetics.showcase === 'monument' ? 'Legendary display' : 'Display pedestal'}
        >
          {isShowcaseLoading ? (
            <Loader className={styles.state} label="Loading showcase" size="md" />
          ) : (
            <div className={styles.showcase}>
              <div className={styles.showcaseStats}>
                <article>
                  <span>Total XP</span>
                  <strong>{(profile?.total_xp ?? 0).toLocaleString()}</strong>
                </article>
                <article>
                  <span>Current Rank</span>
                  <strong>{profile?.current_rank ?? 'E'}</strong>
                </article>
                {cosmetics.showcase === 'monument' ? (
                  <>
                    <article>
                      <span>Trial Clears</span>
                      <strong>{showcaseStats?.trialClears ?? 0}</strong>
                    </article>
                    <article>
                      <span>Boss Victories</span>
                      <strong>{(showcaseStats?.bossChallengeClears ?? 0) + (showcaseStats?.guildBossVictories ?? 0)}</strong>
                    </article>
                  </>
                ) : (
                  <>
                    <article>
                      <span>Achievements</span>
                      <strong>{showcaseStats?.achievementCount ?? 0}</strong>
                    </article>
                    <article>
                      <span>Legacy Clears</span>
                      <strong>{showcaseStats?.legacyChallengeClears ?? 0}</strong>
                    </article>
                  </>
                )}
                {cosmetics.relic && (
                  <article>
                    <span>Relic</span>
                    <strong>Founder&apos;s mark</strong>
                  </article>
                )}
              </div>
              <div className={styles.rankHistory}>
                <span>Rank History</span>
                <div className={styles.rankChips}>
                  {earnedRanks.map((rank) => (
                    <b key={rank.name}>{rank.name}</b>
                  ))}
                </div>
              </div>
              {cosmetics.showcase === 'monument' && (
                <div className={styles.legendarySummary}>
                  <article>
                    <span>Guild Bosses Defeated</span>
                    <strong>{showcaseStats?.guildBossVictories ?? 0}</strong>
                  </article>
                  <article>
                    <span>Boss Challenges Cleared</span>
                    <strong>{showcaseStats?.bossChallengeClears ?? 0}</strong>
                  </article>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
