import React from 'react';
import styles from './ConfirmAmendedGigDetailsPage.module.css';

type Props = {
  lastRoleUsed: string | null;
  handleConfirm: () => void;
  handleSuggestNew: () => void;
  handleDecline: () => void;
};

const ConfirmAmendedGigDetailsFooterActions: React.FC<Props> = ({ lastRoleUsed, handleConfirm, handleSuggestNew, handleDecline }) => (
  <footer className={styles.actionsFooter}>
    <button
      type="button"
      className={`${styles.actionButton} ${lastRoleUsed === 'BUYER' ? styles.buyerColor : styles.workerColor}`}
      onClick={handleConfirm}
    >
      Confirm changes
    </button>
    <button
      type="button"
      className={`${styles.actionButton} ${styles.suggestButton}`}
      onClick={handleSuggestNew}
    >
      Suggest new changes
    </button>
    <button
      type="button"
      className={`${styles.actionButton} ${styles.declineButton}`}
      onClick={handleDecline}
    >
      Decline changes
    </button>
  </footer>
);

export default ConfirmAmendedGigDetailsFooterActions; 