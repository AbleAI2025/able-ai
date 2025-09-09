import React from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { formatDate, formatTime, calculateDurationInHours, calculateTotalPay } from '@/utils/gig-utils';
import type GigDetails from '@/app/types/GigDetailsTypes';
import styles from './ViewAmendment.module.css';

interface ViewAmendmentProps {
  gig: GigDetails;
  editPath: string;
}

const ViewAmendment: React.FC<ViewAmendmentProps> = ({ gig, editPath }) => {
  const router = useRouter();
  
  const duration = calculateDurationInHours(gig.startTime, gig.endTime);
  const totalPay = calculateTotalPay(gig.hourlyRate, duration);

  return (
    <div className={styles.card}>
      <div className={styles.detailsHeader}>
        <h2 className={styles.detailsTitle}>Gig Details</h2>
        <Pencil 
          className={styles.editIcon} 
          onClick={() => router.push(editPath)} 
        />
      </div>
      <div className={styles.detailsList}>
        <div className={styles.detailItem}>
          <span className={styles.detailItemLabel}>Location:</span>
          <span className={styles.detailItemValue}>
            {gig.location}
          </span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailItemLabel}>Date:</span>
          <span className={styles.detailItemValue}>
            {formatDate(gig.date)}
          </span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailItemLabel}>Time:</span>
          <span className={styles.detailItemValue}>
            {formatTime(gig.startTime, gig.endTime)}
          </span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailItemLabel}>Pay per hour:</span>
          <span className={styles.detailItemValue}>
            £{gig.hourlyRate}
          </span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailItemLabel}>Total Pay:</span>
          <span className={styles.detailItemValue}>
            £{totalPay}
          </span>
        </div>
      </div>

      <p className={styles.detailsSummaryText}>
        {gig.sum}
      </p>
    </div>
  );
};

export default ViewAmendment;
