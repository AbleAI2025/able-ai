"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { Suggestion, SuggestedAction } from './AIChatContainer';
import { useAuth } from '@/context/AuthContext';
import { getWorkerOffers } from '@/actions/gigs/get-worker-offers';
import styles from './AbleAIPage.module.css';
import QAModeIndicator from './QAModeIndicator';
import DebugInfo from './DebugInfo';
import AvailableGigsSection from './AvailableGigsSection';
import FeedbackSection from './FeedbackSection';
import ChatInput from './ChatInput';
import GigDetailModal from './GigDetailModal';
import { WorkerGigOffer } from './types';

interface AIChatViewProps {
  suggestion: Suggestion | null;
  onActionClick: (action: SuggestedAction) => void;
}

const AIChatView: React.FC<AIChatViewProps> = ({ suggestion, onActionClick }) => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const pageUserId = (params as Record<string, string | string[]>)?.userId;
  const resolvedUserId = Array.isArray(pageUserId) ? pageUserId[0] : pageUserId;
  
  // State for gigs and modal
  const [gigs, setGigs] = useState<WorkerGigOffer[]>([]);
  const [loadingGigs, setLoadingGigs] = useState(true);
  const [selectedGig, setSelectedGig] = useState<WorkerGigOffer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch gigs from database
  useEffect(() => {
    const fetchGigs = async () => {
      if (!user?.uid) {
        console.log('No user UID available');
        return;
      }
      
      // Check QA mode
      const isViewQA = localStorage.getItem('isViewQA') === 'true';
      console.log('QA Mode enabled:', isViewQA);
      
      console.log('Fetching gigs for user:', user.uid);
      
      try {
        setLoadingGigs(true);
        const result = await getWorkerOffers(user.uid);
        
        console.log('getWorkerOffers result:', result);
        
        if (result.success && result.data) {
          // Get first 3 gigs (offers first, then accepted)
          const allGigs = [...result.data.offers, ...result.data.acceptedGigs];
          console.log('All gigs:', allGigs);
          setGigs(allGigs.slice(0, 3));
        } else {
          console.log('getWorkerOffers failed:', result.error);
        }
      } catch (error) {
        console.error('Error fetching gigs:', error);
      } finally {
        setLoadingGigs(false);
      }
    };

    fetchGigs();
  }, [user?.uid]);

  // Handle gig click
  const handleGigClick = (gig: WorkerGigOffer) => {
    setSelectedGig(gig);
    setIsModalOpen(true);
  };

  // Handle go to gig offers
  const handleGoToGigOffers = () => {
    if (resolvedUserId) {
      router.push(`/user/${resolvedUserId}/worker/offers`);
    }
    setIsModalOpen(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Chat with Able</h1>
        <div className={styles.aiAvatar}>
          <div className={styles.aiIcon}>🤖</div>
        </div>
      </div>

      <QAModeIndicator />

      <DebugInfo user={user} loadingGigs={loadingGigs} gigs={gigs} setGigs={setGigs} suggestion={suggestion} />

      <AvailableGigsSection loadingGigs={loadingGigs} gigs={gigs} onGigClick={handleGigClick} />

      <FeedbackSection />

      <ChatInput />

      <GigDetailModal isOpen={isModalOpen} gig={selectedGig} onClose={() => setIsModalOpen(false)} onGoToOffers={handleGoToGigOffers} />
    </div>
  );
};

export default AIChatView; 