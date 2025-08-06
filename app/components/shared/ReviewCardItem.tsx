import React from 'react';
import styles from './ReviewCardItem.module.css';

interface ReviewCardItemProps {
  reviewerName: string;
  date: string;
  comment?: string | null;
  // rating?: number; // Add if rating is included later
}

const ReviewCardItem: React.FC<ReviewCardItemProps> = ({
  reviewerName,
  date,
  comment,
}) => {
  return (
    <div className={styles.reviewCard}>
      <div className={styles.header}>
        <span className={styles.reviewerName}>{reviewerName} -</span>
        <span className={styles.date}>{date}</span>
      </div>
      <p className={styles.comment}>&quot;{comment}&quot;</p>
    </div>
  );
};

export default ReviewCardItem; 