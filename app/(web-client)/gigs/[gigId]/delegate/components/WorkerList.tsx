import React from 'react';
import WorkerDelegateItemCard from '@/app/components/gigs/WorkerDelegateItemCard';
import { Worker } from '../types';
import styles from '../DelegateGigPage.module.css';

interface WorkerListProps {
  workers: Worker[];
  onDelegate: (workerId: string) => void;
  delegatingWorkerId: string | null;
}

export default function WorkerList({ workers, onDelegate, delegatingWorkerId }: WorkerListProps) {
  return (
    <div className={styles.workerList}>
      {workers.map(worker => (
        <WorkerDelegateItemCard
          key={worker.id}
          worker={worker}
          onDelegate={onDelegate}
          isDelegating={delegatingWorkerId === worker.id}
        />
      ))}
    </div>
  );
}