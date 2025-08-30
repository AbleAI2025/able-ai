import React from 'react';
import styles from './AwardDisplayBadge.module.css';
import getIconFromAwardId, { BadgeId } from './GetBadgeIcon';

interface AwardDisplayBadgeProps {
  badgeId: BadgeId;
  badgeName: string,
  role: 'worker' | 'buyer',
  type: 'common' | 'earlyJoiner' | 'other',
}

const AwardDisplayBadge: React.FC<AwardDisplayBadgeProps> = ({ 
  badgeId, 
  badgeName, 
  role, 
  type 
}) => {

  const Icon = getIconFromAwardId(badgeId);

  const borderStyle = type === 'common' || type === 'earlyJoiner' ? 
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
            {badgeName}
          </span>
      </div>
    </div>
  );
};

export default AwardDisplayBadge; 