import React from 'react';
import styles from './PillBadge.module.css';

interface PillBadgeProps {
  id: string;
  text: string;
  variant?: 'dark' | 'neutral' | 'light' | 'blue';
  className?: string;
  handleSkillDetails: (name: string) => void; // Optional click handler for skill details
}

const PillBadge: React.FC<PillBadgeProps> = ({ id, text, variant = 'neutral', className = '', handleSkillDetails }) => {
  return (
    <button onClick={() => handleSkillDetails(id)} className={`${styles.badge} ${styles[variant]} ${className}`}>
      {text}
    </button>
  );
};

export default PillBadge; 