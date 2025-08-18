"use client";

import { useState, useEffect } from "react";
import styles from "./PhoneNumberModal.module.css";
import { Info } from "lucide-react";

export default function PhoneNumberModal({ userPhone }: { userPhone?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!userPhone) {
      setIsOpen(true);
    }
  }, [userPhone]);

  if (!isOpen) return null;

  const handleNavigation = () => {
    const profileInfoSection = document.getElementById("profile-information") as HTMLInputElement;
    if (profileInfoSection) {
      profileInfoSection.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => profileInfoSection.focus(), 500);
    }
    setIsOpen(false);
  };

  return (
    <div className={styles.modal}>
        <div className={styles.titleContainer}>
          <Info color="#0f0f0f" />
          <h2 className={styles.title}>Phone Number Required</h2>
        </div>
        <p className={styles.text}>
            Please add your phone number so we can send you SMS notifications.
        </p>

        <div className={styles.buttonRow}>
            <button
            onClick={handleNavigation}
            className={`${styles.button} ${styles.closeBtn}`}
            >
            Got it
            </button>
        </div>
      
    </div>
  );
}
