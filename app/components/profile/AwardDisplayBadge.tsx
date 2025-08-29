import React from 'react';
import styles from './AwardDisplayBadge.module.css';
import getIconFromAwardName, { BadgeId } from './GetBadgeIcon';

interface AwardDisplayBadgeProps {
  badgeId: BadgeId;
  badgeName: string,
  role: 'worker' | 'buyer',
}

const AwardDisplayBadge: React.FC<AwardDisplayBadgeProps> = ({ badgeId, badgeName, role }) => {
  const isCommonBadge = 
    badgeId === 'goldenVibes' || 
    badgeId === 'fairPlay' || 
    badgeId === 'heartMode';

  const isEarlyJoinerBadge = badgeId === 'alphaGigee' || badgeId === 'gigPioneer';

  const Icon = getIconFromAwardName(badgeId);

  const borderStyle = isCommonBadge || isEarlyJoinerBadge ? styles.commonBadge : (role === 'worker' ? styles.workerBadge : styles.buyerBadge);

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