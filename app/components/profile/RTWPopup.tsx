"use client";

import styles from "./WorkerProfile.module.css";
import CancelButton from "../shared/CancelButton";

interface RTWPopupProps {
  onClose: () => void;
  userId: string;
}

export default function RTWPopup({ onClose, userId }: RTWPopupProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.title}>
          To adhere to UK law, we need to confirm you have the legal right
          to work.
        </div>
        <div className={styles.title}>Are you a</div>

        <div className={styles.buttons}>
          <button
            className={styles.button}
            onClick={onClose}
          >
            UK national
          </button>
          <span className={styles.orText}>Or</span>
          <button
            className={styles.button}
            onClick={() =>
              (window.location.href = `/user/${userId}/worker/rtw`)
            }
          >
            Non UK national
          </button>
        </div>

        <CancelButton handleCancel={onClose} />
      </div>
    </div>
  );
}