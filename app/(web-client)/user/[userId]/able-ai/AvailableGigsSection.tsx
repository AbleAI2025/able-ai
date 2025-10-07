"use client";

import React from 'react';
import { MapPin, Calendar, DollarSign } from 'lucide-react';
import styles from './AbleAIPage.module.css';
import { AvailableGigsSectionProps } from './types';

const AvailableGigsSection: React.FC<AvailableGigsSectionProps> = ({ loadingGigs, gigs, onGigClick }) => {
  return (
    <div className={styles.gigsSection}>
      <h2 className={styles.gigsSectionTitle}>Available Gigs:</h2>
      {loadingGigs ? (
        <div className={styles.gigsLoading}>Loading gigs...</div>
      ) : gigs.length > 0 ? (
        <div className={styles.gigsGrid}>
          {gigs.map((gig) => (
            <div
              key={gig.id}
              className={styles.gigCard}
              onClick={() => onGigClick(gig)}
            >
              <div className={styles.gigHeader}>
                <h3 className={styles.gigTitle}>{gig.role}</h3>
                <span className={styles.gigStatus}>{gig.status}</span>
              </div>
              <div className={styles.gigDetails}>
                <div className={styles.gigDetail}>
                  <MapPin size={14} />
                  <span>{gig.locationSnippet}</span>
                </div>
                <div className={styles.gigDetail}>
                  <DollarSign size={14} />
                  <span>£{gig.hourlyRate}/hour</span>
                </div>
                <div className={styles.gigDetail}>
                  <Calendar size={14} />
                  <span>{gig.dateString}</span>
                </div>
              </div>
              {gig.gigDescription && (
                <p className={styles.gigDescription}>{gig.gigDescription}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noGigs}>
          No gigs available at the moment
          <br />
          <small style={{ color: '#888' }}>
            (This means either no gigs in database or fetch failed)
          </small>
        </div>
      )}
    </div>
  );
};

export default AvailableGigsSection;