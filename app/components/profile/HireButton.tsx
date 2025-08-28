import { useRouter } from 'next/navigation';
import styles from './HireButton.module.css';
import { useAuth } from '@/context/AuthContext';

const HireButton = ({workerName, workerId}: {workerName?: string | null, workerId?: string | null}) => {
    const router = useRouter();
    const { user: authUser } = useAuth();
    const handleHireWorker = () => {
    if (!workerName || !authUser?.uid) return; // Ensure authUser is available for booking
    router.push(`/user/${authUser.uid}/buyer/gigs/new/?workerId=${workerId}`);
  };

  return (
    <div className={styles.footerActionBar}>
        <button onClick={handleHireWorker} className={styles.primaryActionButton}>
            <span>£</span>Hire {workerName?.split(' ')[0]}
        </button>
    </div>
  )
}

export default HireButton
