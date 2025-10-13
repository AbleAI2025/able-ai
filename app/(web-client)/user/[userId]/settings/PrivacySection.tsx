import React from "react";
import SwitchControl from "@/app/components/shared/SwitchControl";
import styles from "./SettingsPage.module.css";

interface PrivacySectionProps {
  profileVisibility: boolean;
  handleToggleProfileVisibility: () => void;
}

export const PrivacySection: React.FC<PrivacySectionProps> = ({
  profileVisibility,
  handleToggleProfileVisibility,
}) => {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Privacy Settings</h2>
      <SwitchControl
        id="profileVisibility"
        label="Profile Visibility (Public/Private for search)"
        checked={profileVisibility}
        onCheckedChange={() => handleToggleProfileVisibility()}
      />
    </section>
  );
};