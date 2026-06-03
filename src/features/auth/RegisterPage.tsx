import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
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
      <section className={styles.panel}>
        <p className={styles.kicker}>.Iterate</p>
        <h1>Create your account</h1>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Email
            <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </label>
          <label>
            Password
            <input autoComplete="new-password" minLength={6} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <Button disabled={isSubmitting} icon={<UserPlus />} type="submit">
            {isSubmitting ? 'Creating account' : 'Create account'}
          </Button>
        </form>
        <p className={styles.switch}>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}

