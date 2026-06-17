import { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import styles from './ConfirmModal.module.scss';

interface ConfirmModalProps {
  body: ReactNode;
  confirmLabel: string;
  isConfirming?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  variant?: 'danger' | 'secondary';
}

export function ConfirmModal({ body, confirmLabel, isConfirming = false, isOpen, onClose, onConfirm, title, variant = 'secondary' }: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className={styles.content}>
        <p>{body}</p>
        <div className={styles.actions}>
          <Button onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button disabled={isConfirming} onClick={onConfirm} variant={variant}>
            {isConfirming ? 'Working' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
