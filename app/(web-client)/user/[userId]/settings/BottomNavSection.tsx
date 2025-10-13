import React from "react";
import { LogOut, CircleMinus } from "lucide-react";
import styles from "./SettingsPage.module.css";

interface BottomNavSectionProps {
  handleLogout: () => void;
  setShowDeleteAccountModal: (show: boolean) => void;
}

export const BottomNavSection: React.FC<BottomNavSectionProps> = ({
  handleLogout,
  setShowDeleteAccountModal,
}) => {
  return (
    <section className={styles.bottomNavSection}>
      <div className={styles.bottomNav}>
        <button onClick={handleLogout} className={styles.bottomNavLink}>
          <LogOut size={18} /> Logout
        </button>
        <button
          onClick={() => setShowDeleteAccountModal(true)}
          className={`${styles.bottomNavLink} ${styles.dangerLink}`}
        >
          <CircleMinus size={18} /> Delete Account
        </button>
      </div>
    </section>
  );
};