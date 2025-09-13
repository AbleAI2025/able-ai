'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import styles from './AmendmentPage.module.css';
import ScreenHeaderWithBack from '@/app/components/layout/ScreenHeaderWithBack';
import { GigAmendmentActions, AmendmentReasonSection, AmendmentDummyChatbot } from "@/app/components/gigs/GigAmendmentSections";
import UpdateGig from "@/app/components/gigs/UpdateGig";
import { useGigAmendment } from '@/app/hooks/useGigAmendment';

export default function AmendGigPage() {
  const completePathName = usePathname();
  const {
    isLoading,
    isSubmitting,
    isCancelling,
    editedGigDetails,
    setEditedGigDetails,
    reason,
    setReason,
    existingAmendmentId,
    gig,
    router,
    handleSubmit,
    handleCancel,
  } = useGigAmendment();

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className={styles.container}>
        <ScreenHeaderWithBack title="Amend Gig" />
        <div className={styles.error}>Gig not found</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ScreenHeaderWithBack title="Cancel or Amend" />
      <main className={styles.contentWrapper}>
        <AmendmentDummyChatbot />
        <AmendmentReasonSection onReasonChange={setReason} reason={reason} workerId={gig.worker?.id} />
        <UpdateGig
          title="Updated gig details:"
          editedGigDetails={editedGigDetails}
          setEditedGigDetails={setEditedGigDetails}
          isEditingDetails={false}
          handleEditDetails={() => router.push(`${completePathName}/edit`)}
        />
        <GigAmendmentActions
          handleSubmit={handleSubmit}
          handleCancel={handleCancel}
          isSubmitting={isSubmitting}
          isCancelling={isCancelling}
          existingAmendmentId={existingAmendmentId}
        />
      </main>
    </div>
  );
}
