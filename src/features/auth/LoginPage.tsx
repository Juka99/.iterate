import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
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
      <section className={styles.panel}>
        <p className={styles.kicker}>.Iterate</p>
        <h1>Welcome back</h1>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Email
            <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </label>
          <label>
            Password
            <input autoComplete="current-password" minLength={6} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <Button disabled={isSubmitting} icon={<LogIn />} type="submit">
            {isSubmitting ? 'Signing in' : 'Sign in'}
          </Button>
        </form>
        <p className={styles.switch}>
          New hunter? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}

