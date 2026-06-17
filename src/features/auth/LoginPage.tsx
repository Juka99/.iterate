import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LogIn, ShieldCheck, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { signInWithEmail } from './authService';
import styles from './AuthPage.module.scss';

export function LoginPage() {
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
      await signInWithEmail({ email, password });
      navigate('/');
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Unable to sign in.');
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
            <p className={styles.eyebrow}><Sparkles /> Your next chapter</p>
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
            <p className={styles.kicker}>Welcome back, hunter</p>
            <h1>Continue your journey</h1>
            <p>Your progress is waiting for you.</p>
          </header>
          <form className={styles.form} onSubmit={handleSubmit}>
            <label>
              <span>Email address</span>
              <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} />
            </label>
            <label>
              <span>Password</span>
              <input autoComplete="current-password" minLength={6} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required type="password" value={password} />
            </label>
            {error && <p className={styles.error}>{error}</p>}
            <Button disabled={isSubmitting} icon={<LogIn />} type="submit">
              {isSubmitting ? 'Signing in' : 'Enter Iterate'}
            </Button>
          </form>
          <p className={styles.switch}>
            New to Iterate? <Link to="/register">Create an account <ArrowRight /></Link>
          </p>
        </div>
      </section>
    </main>
  );
}
