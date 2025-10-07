import React from "react";
import styles from "./SettingsPage.module.css";

export const DiscordSection: React.FC = () => {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Community Discord channel</h2>
      <p className={styles.description}>
        Connect with our community for support, updates, and discussions.
      </p>
      <a
        href="https://discord.com"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
      >
        Join Discord Community
      </a>
    </section>
  );
};