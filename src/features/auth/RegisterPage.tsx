import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Sparkles, Target, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { registerWithEmail } from './authService';
import styles from './AuthPage.module.scss';

export function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await registerWithEmail({ email, password });
      navigate('/');
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Unable to create account.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div aria-hidden="true" className={styles.ambientOrb} />
      <section className={styles.authShell}>
        <aside className={styles.brandPanel}>
          <img alt="Iterate" className={styles.logo} src="/assets/iterate_logo.png" />
          <div className={styles.brandCopy}>
            <p className={styles.eyebrow}><Sparkles /> Begin your ascent</p>
            <h2>Small steps.<br /><span>Legendary progress.</span></h2>
            <p>Turn your daily goals into quests, build momentum, and become the person you keep promising yourself you’ll be.</p>
          </div>
          <div className={styles.perks}>
            <span><Target /> Daily challenges</span>
            <span><ShieldCheck /> Progress that lasts</span>
          </div>
        </aside>

        <div className={styles.formPanel}>
          <header className={styles.formHeader}>
            <p className={styles.kicker}>Join the guild</p>
            <h1>Create your hunter</h1>
            <p>Your first quest starts right here.</p>
          </header>
          <form className={styles.form} onSubmit={handleSubmit}>
            <label>
              <span>Email address</span>
              <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} />
            </label>
            <label>
              <span>Password</span>
              <input autoComplete="new-password" minLength={6} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" required type="password" value={password} />
            </label>
            {error && <p className={styles.error}>{error}</p>}
            <Button disabled={isSubmitting} icon={<UserPlus />} type="submit">
              {isSubmitting ? 'Creating account' : 'Start my journey'}
            </Button>
          </form>
          <p className={styles.switch}>
            Already a hunter? <Link to="/login">Sign in <ArrowRight /></Link>
          </p>
        </div>
      </section>
    </main>
  );
}
