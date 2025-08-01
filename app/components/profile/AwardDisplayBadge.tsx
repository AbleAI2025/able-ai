import React from 'react';
import styles from './AwardDisplayBadge.module.css';

interface AwardDisplayBadgeProps {
  icon?: React.ElementType;
  textLines: string;
  color?: string;
  border?: string;
}

const AwardDisplayBadge: React.FC<AwardDisplayBadgeProps> = ({ icon: Icon, textLines, color="#ffffff", border='none' }) => {
  return (
    <div className={styles.awardBadge} style={{ border: `${border}` }}>
      {
        Icon && <Icon size={28} className={styles.awardIcon} color= {color} strokeWidth = '3' />
      }
      <div className={styles.awardTextContainer}>
          <span className={styles.awardTextLine}>
            {textLines}
          </span>
      </div>
    </div>
  );
};

export default AwardDisplayBadge; 