import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '../Button';
import styles from './Modal.module.scss';

interface ModalProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export function Modal({ children, isOpen, onClose, title }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.backdrop} role="presentation">
      <section aria-modal="true" className={styles.modal} role="dialog">
        <header className={styles.header}>
          <h2>{title}</h2>
          <Button aria-label="Close modal" icon={<X />} onClick={onClose} variant="ghost">
            Close
          </Button>
        </header>
        {children}
      </section>
    </div>
  );
}

