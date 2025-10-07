import React from "react";
import { AlertTriangle } from "lucide-react";
import styles from "./SettingsPage.module.css";

interface DeleteAccountModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  show,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!show) return null;

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
    >
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <AlertTriangle size={24} color="red" />
          <h3 className={styles.modalTitle}>Confirm Account Deletion</h3>
        </div>
        <p>
          Are you absolutely sure you want to delete your account? This
          action is permanent and cannot be undone. All your data, gigs,
          and profile information will be removed.
        </p>
        <div className={styles.modalActions}>
          <button
            onClick={onClose}
            className={`${styles.button} ${styles.secondary}`}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`${styles.button} ${styles.danger}`}
            disabled={isDeleting}
          >
            {isDeleting
              ? "Deleting..."
              : "Are you sure? This is irreversible"}
          </button>
        </div>
      </div>
    </div>
  );
};