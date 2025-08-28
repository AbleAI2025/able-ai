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
  };
  onDelegate: (workerId: string) => void;
  isDelegating?: boolean; // For loading state on button
}

const WorkerDelegateItemCard: React.FC<WorkerDelegateItemProps> = ({
  worker,
  onDelegate,
  isDelegating,
}) => {
  return (
    <div className={styles.card}>
      {/* <Avatar src={worker.avatarUrl} alt={worker.name} size="medium" /> */}
      <Image
        src={worker.avatarUrl}
        alt={worker.name}
        width={48}
        height={48}
        className={styles.avatar}
      />
      <div className={styles.userInfo}>
        <span className={styles.name}>{worker.name}</span>
        <span className={styles.username}>@{worker.username}</span>
      </div>
      <button
        onClick={() => onDelegate(worker.id)}
        className={styles.delegateButton}
        disabled={isDelegating}
      >
        {isDelegating ? '...' : 'Delegate'}
      </button>
    </div>
  );
};
export default WorkerDelegateItemCard; 