"use client";

import React from "react";
import styles from "../AmendmentPage.module.css";
import ScreenHeaderWithBack from "@/app/components/layout/ScreenHeaderWithBack";
import UpdateGig from "@/app/components/gigs/UpdateGig";
import { GigAmendmentActions, AmendmentReasonSection, AmendmentDummyChatbot } from "@/app/components/gigs/GigAmendmentSections";
import { useGigAmendment } from "@/app/hooks/useGigAmendment";

export default function EditGigPage() {
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
        <ScreenHeaderWithBack title="Error" />
        <div className={styles.error}>Could not load gig details.</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ScreenHeaderWithBack title="Edit Gig Details" />
      <main className={styles.contentWrapper}>
        <AmendmentDummyChatbot />
        <AmendmentReasonSection onReasonChange={setReason} reason={reason} workerId={gig.worker?.id} />
        <UpdateGig
          title="Updated gig details:"
          editedGigDetails={editedGigDetails}
          setEditedGigDetails={setEditedGigDetails}
          isEditingDetails={true}
          handleEditDetails={() => router.back()}
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
