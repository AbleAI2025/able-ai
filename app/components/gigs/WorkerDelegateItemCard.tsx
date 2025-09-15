import React from 'react';
import Image from 'next/image'; // Or your Avatar component
import styles from './WorkerDelegateItemCard.module.css';
// import Avatar from '@/app/components/shared/Avatar';

interface WorkerDelegateItemProps {
  worker: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string;
    primarySkill: string;
    experienceYears: number;
    hourlyRate: number;
    bio: string;
    location: string;
    distance: number;
    skillMatchScore: number;
    availabilityScore: number;
    overallScore: number;
    skills: Array<{
      name: string;
      experienceYears: number;
      agreedRate: number;
    }>;
    isAvailable: boolean;
    lastActive?: string;
  };
  onDelegate: (workerId: string) => void;
  isDelegating?: boolean; // For loading state on button
}

const WorkerDelegateItemCard: React.FC<WorkerDelegateItemProps> = ({
  worker,
  onDelegate,
  isDelegating,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return '#10b981'; // Green
    if (score >= 0.6) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Poor';
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <Image
          src={worker.avatarUrl}
          alt={worker.name}
          width={48}
          height={48}
          className={styles.avatar}
        />
        <div className={styles.headerInfo}>
          <div className={styles.nameRow}>
            <span className={styles.name}>{worker.name}</span>
            <span className={styles.username}>@{worker.username}</span>
            {worker.isAvailable && (
              <span className={styles.availableBadge}>Available</span>
            )}
          </div>
          
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.skillRow}>
          <span className={styles.skill}>{worker.primarySkill}</span>
          <span className={styles.experience}>{worker.experienceYears} years exp</span>
        </div>
        
        <div className={styles.rateRow}>
          <span className={styles.rate}>£{worker.hourlyRate}/hour</span>
          <span className={styles.location}>{worker.location}</span>
        </div>

        {worker.skills.length > 1 && (
          <div className={styles.skillsList}>
            <span className={styles.skillsLabel}>Other skills:</span>
            <div className={styles.skillTags}>
              {worker.skills.slice(0, 3).map((skill, index) => (
                <span key={index} className={styles.skillTag}>
                  {skill.name}
                </span>
              ))}
              {worker.skills.length > 3 && (
                <span className={styles.skillTag}>+{worker.skills.length - 3} more</span>
              )}
            </div>
          </div>
        )}

        {worker.bio && (
          <p className={styles.bio}>{worker.bio}</p>
        )}

        {worker.lastActive && (
          <div className={styles.lastActive}>
            Last active: {new Date(worker.lastActive).toLocaleDateString()}
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        <button
          onClick={() => onDelegate(worker.id)}
          className={styles.delegateButton}
          disabled={isDelegating}
        >
          {isDelegating ? 'Delegating...' : 'Delegate'}
        </button>
      </div>
    </div>
  );
};
export default WorkerDelegateItemCard; 