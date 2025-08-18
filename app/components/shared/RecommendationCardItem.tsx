import React from 'react';
import styles from './RecommendationCardItem.module.css';

interface RecommendationCardItemProps {
  recommenderName: string;
  date?: string | null;
  comment?: string | null;
}

const RecommendationCardItem: React.FC<RecommendationCardItemProps> = ({
  recommenderName,
  date,
  comment,
}) => {
  return (
    <div className={styles.recommendationCard}>
      <div className={styles.header}>
        <span className={styles.recommenderName}>{recommenderName} -</span>
        <span className={styles.date}>{date}</span>
      </div>
      <p className={styles.comment}>&quot;{comment}&quot;</p>
    </div>
  );
};

export default RecommendationCardItem; 