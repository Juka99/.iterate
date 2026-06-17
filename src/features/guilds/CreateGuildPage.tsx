import { FormEvent, useState } from 'react';
import { Gem } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCreateGuild } from './hooks/useGuildMutations';
import styles from './GuildPage.module.scss';

interface CreateGuildPageProps {
  userId: string;
}

export function CreateGuildPage({ userId }: CreateGuildPageProps) {
  const createGuild = useCreateGuild(userId);
  const [description, setDescription] = useState('');
  const [emblemUrl, setEmblemUrl] = useState('');
  const [name, setName] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createGuild.mutate({ description, emblemUrl, name });
  }

  return (
    <Card className={styles.guildFormCard} eyebrow="Found a hall" title="Create guild">
      <form className={styles.guildForm} onSubmit={handleSubmit}>
        <label>
          <span>Name</span>
          <input maxLength={48} onChange={(event) => setName(event.target.value)} required value={name} />
        </label>
        <label>
          <span>Description</span>
          <textarea maxLength={220} onChange={(event) => setDescription(event.target.value)} rows={4} value={description} />
        </label>
        <label>
          <span>Emblem URL</span>
          <input onChange={(event) => setEmblemUrl(event.target.value)} placeholder="Optional" type="url" value={emblemUrl} />
        </label>
        {createGuild.error && <p className={styles.error}>{createGuild.error instanceof Error ? createGuild.error.message : 'Could not create guild.'}</p>}
        <Button disabled={createGuild.isPending || !name.trim()} icon={<Gem />} type="submit">
          {createGuild.isPending ? 'Creating' : 'Create guild'}
        </Button>
      </form>
    </Card>
  );
}
