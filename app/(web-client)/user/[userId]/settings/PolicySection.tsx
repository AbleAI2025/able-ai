import React from "react";
import styles from "./SettingsPage.module.css";

export const PolicySection: React.FC = () => {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>User policy</h2>
      <label htmlFor="phone" className={styles.label}>
        Read here
      </label>
    </section>
  );
};