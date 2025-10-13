import React from 'react';
import styles from '../OnboardingAIPage.module.css';

/**
 * Typing indicator component with bouncing animation
 */
const TypingIndicator: React.FC = () => (
  <div className={styles.typingIndicator}>
    <span className={styles.typingDot}>●</span>
    <span className={styles.typingDot}>●</span>
    <span className={styles.typingDot}>●</span>
  </div>
);

TypingIndicator.displayName = 'TypingIndicator';

export default TypingIndicator;
