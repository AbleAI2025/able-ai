import React from 'react';
import Image from 'next/image';
import { Star, UserCircle } from 'lucide-react';
import PillBadge from '@/app/components/shared/PillBadge';
import styles from './SkillSpecificHeaderCard.module.css';

interface SkillSpecificHeaderCardProps {
  workerName: string;
  skillName: string;
  profileImageUrl?: string;
  isFavorited?: boolean;
  onFavoriteToggle?: () => void;
  hashtags?: string[];
}

const SkillSpecificHeaderCard: React.FC<SkillSpecificHeaderCardProps> = ({
  workerName,
  skillName,
  profileImageUrl,
  isFavorited = false,
  onFavoriteToggle,
  hashtags,
}) => {
  return (
    <div className={styles.headerCardContainer}>
      <div className={styles.headerContent}>
        <div className={styles.profileVisual}>
          {profileImageUrl ? (
            <Image src={profileImageUrl} alt={`${workerName}'s profile`} width={120} height={120} className={styles.profileImage} />
          ) : (
            <div className={`${styles.profileVisualPlaceholder}`}><UserCircle size={60} /></div>
          )}
          {/* TODO: Add play icon if video */}
        </div>
        <div className={styles.headerText}>
          <h1 className={styles.title}>
            {workerName}: {skillName}
          </h1>
          {onFavoriteToggle && (
            <button onClick={onFavoriteToggle} className={styles.favoriteButton} aria-label={isFavorited ? 'Unfavorite skill' : 'Favorite skill'}>
              <Star size={24} fill={isFavorited ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
      </div>
      {hashtags && hashtags.length > 0 && (
        <div className={styles.hashtagsContainer}>
          {hashtags.map((tag, index) => (
            <PillBadge id={index.toString()} key={index} text={tag} variant="blue" handleSkillDetails={() => console.log(`Skill details for: ${tag}`)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillSpecificHeaderCard; 