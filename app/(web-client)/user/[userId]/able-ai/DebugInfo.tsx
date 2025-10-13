"use client";

import React from 'react';
import { getWorkerOffers } from '@/actions/gigs/get-worker-offers';
import styles from './AbleAIPage.module.css';
import { DebugInfoProps } from './types';

const DebugInfo: React.FC<DebugInfoProps> = ({ user, loadingGigs, gigs, setGigs, suggestion }) => {
  return (
    <div style={{ background: '#333', padding: '1rem', marginBottom: '1rem', borderRadius: '8px' }}>
      <p style={{ color: '#fff', margin: 0 }}>Debug Info:</p>
      <p style={{ color: '#ccc', margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
        User UID: {user?.uid || 'None'}<br/>
        Loading Gigs: {loadingGigs ? 'Yes' : 'No'}<br/>
        Gigs Count: {gigs.length}<br/>
        Suggestion: {suggestion ? 'Present' : 'None'}
      </p>
      <button
        onClick={() => {
          console.log('Manual gig fetch triggered');
          if (user?.uid) {
            getWorkerOffers(user.uid).then(result => {
              console.log('Manual fetch result:', result);
              if (result.success && result.data) {
                const allGigs = [...result.data.offers, ...result.data.acceptedGigs];
                setGigs(allGigs.slice(0, 3));
              }
            })
            .catch(error => {
              console.error('Manual gig fetch failed:', error);
            });
          }
        }}
        style={{
          background: '#60a5fa',
          color: '#fff',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          cursor: 'pointer',
          marginTop: '0.5rem'
        }}
      >
        Test Fetch Gigs
      </button>
    </div>
  );
};

export default DebugInfo;