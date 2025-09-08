"use client";

import React from "react";
import styles from "./SkillsDisplayTable.module.css";
import CancelButton from "../shared/CancelButton";

interface DeleteSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  skillName?: string;
  loading?: boolean;
}

const DeleteSkillModal: React.FC<DeleteSkillModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  skillName,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>Confirm Deletion</h3>
        <p>
          Are you sure you want to delete the skill{" "}
          <strong>{skillName}</strong>?
        </p>

        <div className={styles.modalButtons}>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={styles.deleteButton}
          >
            {loading ? "Deleting..." : "Yes, delete"}
          </button>
          <CancelButton handleCancel={onClose} />
        </div>
      </div>
    </div>
  );
};

export default DeleteSkillModal;
