import React from "react";
import styles from "./SettingsPage.module.css";

export const DiscordSection: React.FC = () => {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Community Discord channel</h2>
      <label htmlFor="phone" className={styles.label}>
        Join here
      </label>
    </section>
  );
};