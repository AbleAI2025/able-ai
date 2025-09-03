import React from 'react';
import styles from './AwardDisplayBadge.module.css';
import getIconFromAwardId, { BadgeIcon } from './GetBadgeIcon';

interface AwardDisplayBadgeProps {
  icon: BadgeIcon;
  title: string,
  role: 'worker' | 'buyer',
  type: "COMMON" | "EARLY_JOINER" | "OTHER"
  
}

const AwardDisplayBadge: React.FC<AwardDisplayBadgeProps> = ({ 
  icon, 
  title, 
  role, 
  type 
}) => {

  const Icon = getIconFromAwardId(icon);

  const borderStyle = type === 'COMMON' || type === 'EARLY_JOINER' ? 
                      styles.commonBadge : (
                      role === 'worker' ? styles.workerBadge : styles.buyerBadge
                    );

  return (
    <div 
      className={
        `${styles.awardBadge} ${borderStyle}`
      }
    >
      {
        Icon
      }
      <div className={styles.awardTextContainer}>
          <span className={styles.awardTextLine}>
            {title}
          </span>
      </div>
    </div>
  );
};

export default AwardDisplayBadge; 