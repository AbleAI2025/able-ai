import React from 'react';
import { Worker } from '../types';
import styles from '../DelegateGigPage.module.css';

interface ResultsSummaryProps {
  workers: Worker[];
}

export default function ResultsSummary({ workers }: ResultsSummaryProps) {
  return (
    <div className={styles.resultsSummary}>
      Found {workers.length} worker{workers.length !== 1 ? 's' : ''} matching your criteria
    </div>
  );
}