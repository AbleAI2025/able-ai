import React from "react";
import styles from "./SettingsPage.module.css";

export const PolicySection: React.FC = () => {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>User policy</h2>
      <p className={styles.description}>
        Review our terms of service, privacy policy, and community guidelines.
      </p>
      <a
        href="/legal/terms"
        className={styles.link}
      >
        View Policies
      </a>
    </section>
  );
};