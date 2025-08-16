"use client";

import React from "react";
import styles from "./ClearAvailabilityAlert.module.css";

interface ClearAvailabilityAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ClearAvailabilityAlert: React.FC<ClearAvailabilityAlertProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.alertDialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.alertHeader}>
          <h3>Clear availability?</h3>
        </div>
        <div className={styles.alertContent}>
          <p>This action cannot be undone.</p>
        </div>
        <div className={styles.alertActions}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.clearButton} onClick={onConfirm}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClearAvailabilityAlert;
