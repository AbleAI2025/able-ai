//LeavePageDialog.tsx
"use client";
import React from "react";
import { X } from "lucide-react";
import styles from "./LeavePageDialog.module.css";

interface LeavePageDialogProps {
  onClose: () => void;
  onConfirm: () => void;
}

const LeavePageDialog = ({ onClose, onConfirm }: LeavePageDialogProps) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h4>Leave Page</h4>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={16} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <p>
            Do you really want to leave this page? <br />
            If you do, your changes will be lost.
          </p>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button onClick={onConfirm} className={styles.saveButton}>
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeavePageDialog;
