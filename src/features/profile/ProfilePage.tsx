import { FormEvent, useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { useProfile } from './hooks/useProfile';
import { updateProfile } from './profileService';
import styles from './ProfilePage.module.scss';

export function ProfilePage() {
  const queryClient = useQueryClient();
  const { user } = useAuthSession();
  const { data: profile, error, isLoading } = useProfile(user?.id);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    setUsername(profile?.username ?? '');
    setAvatarUrl(profile?.avatar_url ?? '');
  }, [profile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await updateProfile(user.id, {
        avatar_url: avatarUrl || null,
        username: username || null,
      });
      await queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      setMessage('Profile saved.');
    } catch (profileError) {
      setMessage(profileError instanceof Error ? profileError.message : 'Profile could not be saved.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.heading}>
        <p>Identity</p>
        <h1>Profile</h1>
      </section>
      <Card title="Player details">
        {isLoading && <p className={styles.state}>Loading profile...</p>}
        {error && <p className={styles.error}>Profile could not be loaded.</p>}
        {!isLoading && !error && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <label>
              Username
              <input onChange={(event) => setUsername(event.target.value)} placeholder="Choose a display name" value={username} />
            </label>
            <label>
              Avatar URL
              <input onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://..." type="url" value={avatarUrl} />
            </label>
            {message && <p className={styles.message}>{message}</p>}
            <Button disabled={isSaving} icon={<Save />} type="submit">
              {isSaving ? 'Saving' : 'Save profile'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

