"use client";
import React from 'react';
import styles from './AcceptedGigCard.module.css';
import { WorkerGigOffer } from '@/actions/gigs/get-worker-offers';

interface AcceptedGigCardProps {
  gig: WorkerGigOffer;
  onViewDetails: (id: string) => void;
}

const AcceptedGigCard = ({
  gig,
  onViewDetails,
}: AcceptedGigCardProps) => {

  return (
    <div className={styles.card} onClick={() => onViewDetails(gig.id)}>
      <h3 className={styles.role}>{gig.role}</h3>
      <div className={styles.gigDetails}>
          <p className={styles.gigDate}>
            {gig.dateString}
          </p>
      </div>
    </div>
  );
};

export default AcceptedGigCard; 