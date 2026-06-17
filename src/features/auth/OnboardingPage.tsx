import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ImageOff, Sparkles, User } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { useAuthSession } from './hooks/useAuthSession';
import { updateProfile } from '@/features/profile/profileService';
import styles from './OnboardingPage.module.scss';

const MAX_USERNAME_LENGTH = 17;
const MIN_USERNAME_LENGTH = 2;

export function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthSession();
  const [avatarUrl, setAvatarUrl] = useState('');
  const [hasAvatarError, setHasAvatarError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [username, setUsername] = useState('');

  const normalizedAvatarUrl = avatarUrl.trim();
  const normalizedUsername = username.trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    if (
      normalizedUsername.length < MIN_USERNAME_LENGTH ||
      normalizedUsername.length > MAX_USERNAME_LENGTH
    ) {
      setMessage(`Username must be between ${MIN_USERNAME_LENGTH} and ${MAX_USERNAME_LENGTH} characters.`);
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const updatedProfile = await updateProfile(user.id, {
        avatar_url: normalizedAvatarUrl || null,
        onboarding_completed: true,
        username: normalizedUsername,
      });
      queryClient.setQueryData(['profile', user.id], updatedProfile);
      await queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      navigate('/', { replace: true });
    } catch (profileError) {
      setMessage(profileError instanceof Error ? profileError.message : 'Your hunter profile could not be created.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.intro}>
          <img alt="Iterate" className={styles.logo} src="/assets/iterate_logo.png" />
          <div>
            <p className={styles.eyebrow}><Sparkles /> One last step</p>
            <h1>Create your hunter identity</h1>
            <p>This is how other hunters will know you. You can change these details later from your profile.</p>
          </div>
          <span className={styles.step}>Hunter file · 01</span>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.preview}>
            <div className={styles.avatar}>
              {normalizedAvatarUrl && !hasAvatarError ? (
                <img alt="Avatar preview" onError={() => setHasAvatarError(true)} src={normalizedAvatarUrl} />
              ) : hasAvatarError ? (
                <ImageOff aria-label="Image could not be loaded" />
              ) : (
                <User aria-hidden="true" />
              )}
            </div>
            <div>
              <span>Hunter preview</span>
              <strong>{normalizedUsername || 'Your username'}</strong>
              <small>{hasAvatarError ? 'That image could not be loaded.' : normalizedAvatarUrl ? 'Avatar ready' : 'Avatar is optional'}</small>
            </div>
          </div>

          <label>
            <span>Username <b>Required</b></span>
            <input
              autoComplete="username"
              autoFocus
              maxLength={MAX_USERNAME_LENGTH}
              minLength={MIN_USERNAME_LENGTH}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Choose your hunter name"
              required
              value={username}
            />
            <small className={styles.hint}>{username.length}/{MAX_USERNAME_LENGTH} characters</small>
          </label>

          <label>
            <span>Avatar image URL <em>Optional</em></span>
            <input
              autoComplete="url"
              onChange={(event) => {
                setAvatarUrl(event.target.value);
                setHasAvatarError(false);
              }}
              placeholder="https://example.com/avatar.jpg"
              type="url"
              value={avatarUrl}
            />
            <small className={styles.hint}>Paste a direct link and we’ll preview it above.</small>
          </label>

          {message && <p className={styles.error}>{message}</p>}

          <Button disabled={isSaving} icon={<ArrowRight />} type="submit">
            {isSaving ? 'Creating your hunter' : 'Enter Iterate'}
          </Button>
        </form>
      </section>
    </main>
  );
}
