// StatisticItemDisplay.tsx
import React from 'react';
import styles from './StatisticItemDisplay.module.css';

interface Statistic {
  id: number;
  icon: React.ElementType;
  value: string | number;
  label: string;
  iconColor?: string;
}

interface StatisticItemDisplayProps {
  stat: Statistic;
}

const StatisticItemDisplay: React.FC<StatisticItemDisplayProps> = ({ stat }) => {
  const Icon = stat.icon;

  return (
    <div className={styles.statItem}>
      {Icon && (
        <Icon
          size={39}
          className={styles.statIcon}
          style={{ color: "white" }}
        />
      )}
      <div className={styles.statText}>
        <span className={styles.statValue}>{stat.value}</span>
        <span className={styles.statLabel}>{stat.label}</span>
      </div>
    </div>
  );
};

export default StatisticItemDisplay;
