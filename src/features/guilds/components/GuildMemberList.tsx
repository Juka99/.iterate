import { useState } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Card } from '@/components/ui/Card';
import type { GuildMemberWithProfile } from '../guildTypes';
import { GuildMemberCard } from './GuildMemberCard';
import { useDemoteGuildMember, usePromoteGuildMember, useRemoveGuildMember } from '../hooks/useGuildMutations';
import styles from '../GuildPage.module.scss';

interface GuildMemberListProps {
  currentUserId: string;
  isGuildMaster: boolean;
  members: GuildMemberWithProfile[];
}

type PendingMemberAction = 'demote' | 'promote' | 'remove';

function getMemberName(member: GuildMemberWithProfile) {
  return member.profile?.username || `Hunter ${member.user_id.slice(0, 6)}`;
}

export function GuildMemberList({ currentUserId, isGuildMaster, members }: GuildMemberListProps) {
  const promoteMember = usePromoteGuildMember(currentUserId);
  const demoteMember = useDemoteGuildMember(currentUserId);
  const removeMember = useRemoveGuildMember(currentUserId);
  const [pendingAction, setPendingAction] = useState<PendingMemberAction | null>(null);
  const [selectedMember, setSelectedMember] = useState<GuildMemberWithProfile | null>(null);
  const isConfirming = promoteMember.isPending || demoteMember.isPending || removeMember.isPending;

  function openAction(action: PendingMemberAction, member: GuildMemberWithProfile) {
    setPendingAction(action);
    setSelectedMember(member);
  }

  function closeAction() {
    if (isConfirming) {
      return;
    }

    setPendingAction(null);
    setSelectedMember(null);
  }

  function handleConfirmAction() {
    if (!selectedMember || !pendingAction) {
      return;
    }

    const mutation = pendingAction === 'promote' ? promoteMember : pendingAction === 'demote' ? demoteMember : removeMember;
    mutation.mutate(selectedMember, {
      onSuccess: () => {
        setPendingAction(null);
        setSelectedMember(null);
      },
    });
  }

  const selectedMemberName = selectedMember ? getMemberName(selectedMember) : 'this member';
  const modalTitle = pendingAction === 'promote' ? 'Promote member' : pendingAction === 'demote' ? 'Demote member' : 'Kick member';
  const modalBody =
    pendingAction === 'promote'
      ? `Promote ${selectedMemberName} to Captain? They will be able to start guild bosses and projects.`
      : pendingAction === 'demote'
        ? `Demote ${selectedMemberName} to Hunter? They will no longer be able to start guild bosses or projects.`
      : `Kick ${selectedMemberName} from the guild? They will lose access to this guild hall.`;
  const mutationError = promoteMember.error ?? demoteMember.error ?? removeMember.error;

  return (
    <>
      <Card className={styles.membersCard} eyebrow="Activity board" title="Guild members">
        <div className={styles.memberList}>
          {members.map((member) => (
            <GuildMemberCard
              canManage={isGuildMaster && member.user_id !== currentUserId}
              key={member.id}
              member={member}
              onRequestDemote={(nextMember) => openAction('demote', nextMember)}
              onRequestPromote={(nextMember) => openAction('promote', nextMember)}
              onRequestRemove={(nextMember) => openAction('remove', nextMember)}
            />
          ))}
        </div>
        {mutationError && <p className={styles.error}>{mutationError instanceof Error ? mutationError.message : 'Guild member action failed.'}</p>}
      </Card>
      <ConfirmModal
        body={modalBody}
        confirmLabel={pendingAction === 'promote' ? 'Promote' : pendingAction === 'demote' ? 'Demote' : 'Kick'}
        isConfirming={isConfirming}
        isOpen={Boolean(pendingAction && selectedMember)}
        onClose={closeAction}
        onConfirm={handleConfirmAction}
        title={modalTitle}
        variant={pendingAction === 'remove' ? 'danger' : 'secondary'}
      />
    </>
  );
}
