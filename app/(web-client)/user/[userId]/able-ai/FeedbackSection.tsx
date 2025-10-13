"use client";

import React from 'react';
import styles from './AbleAIPage.module.css';

const FeedbackSection: React.FC = () => {
  return (
    <div className={styles.feedbackSection}>
      <p className={styles.feedbackText}>Was this helpful?</p>
      <div className={styles.feedbackButtons}>
        <button className={styles.helpfulButton}>Helpful</button>
        <button className={styles.notHelpfulButton}>Not helpful</button>
      </div>
    </div>
  );
};

export default FeedbackSection;