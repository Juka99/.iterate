import { Toaster } from 'sonner';
import styles from './AppToaster.module.scss';

export function AppToaster() {
  return (
    <Toaster
      closeButton
      duration={3600}
      position="top-center"
      richColors
      toastOptions={{ className: styles.toast }}
    />
  );
}
