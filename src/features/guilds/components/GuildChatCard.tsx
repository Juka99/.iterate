import { FormEvent, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import type { GuildMemberWithProfile } from '../guildTypes';
import { GuildRoleBadge } from './GuildRoleBadge';
import { useGuildMessages, useSendGuildMessage } from '../hooks/useGuildMessages';
import styles from '../GuildPage.module.scss';

interface GuildChatCardProps {
  guildId: string;
  members: GuildMemberWithProfile[];
  userId: string;
}

function formatMessageTime(createdAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(createdAt));
}

export function GuildChatCard({ guildId, members, userId }: GuildChatCardProps) {
  const { data: messages = [], error, isLoading } = useGuildMessages(guildId);
  const sendMessage = useSendGuildMessage();
  const [body, setBody] = useState('');
  const memberByUserId = new Map(members.map((member) => [member.user_id, member]));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextBody = body.trim();

    if (!nextBody) {
      return;
    }

    sendMessage.mutate(
      { body: nextBody, guildId, userId },
      {
        onSuccess: () => setBody(''),
      },
    );
  }

  return (
    <Card className={styles.chatCard} eyebrow="Guild chat" title="Hall whispers">
      <div className={styles.chatMessages}>
        {isLoading && <Loader className={styles.emptyText} label="Listening at the guild hall" size="sm" />}
        {error && <p className={styles.error}>Guild chat could not be loaded.</p>}
        {!isLoading && !error && messages.length === 0 && <p className={styles.emptyText}>No messages yet. Open the hall with a short note.</p>}
        {messages.map((message) => {
          const isOwnMessage = message.user_id === userId;
          const senderMember = memberByUserId.get(message.user_id);

          return (
            <article className={isOwnMessage ? styles.ownMessage : ''} key={message.id}>
              <div>
                <span>{message.profile?.username || `Hunter ${message.user_id.slice(0, 6)}`}</span>
                {senderMember && <GuildRoleBadge role={senderMember.role} />}
                <small>{formatMessageTime(message.created_at)}</small>
              </div>
              <p>{message.body}</p>
            </article>
          );
        })}
      </div>
      <form className={styles.chatForm} onSubmit={handleSubmit}>
        <label>
          <span>Message</span>
          <input
            maxLength={500}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Share a quick guild update..."
            value={body}
          />
        </label>
        <Button disabled={sendMessage.isPending || !body.trim()} icon={<Send />} type="submit" variant="secondary">
          {sendMessage.isPending ? 'Sending' : 'Send'}
        </Button>
      </form>
      {sendMessage.error && <p className={styles.error}>{sendMessage.error instanceof Error ? sendMessage.error.message : 'Message could not be sent.'}</p>}
    </Card>
  );
}
