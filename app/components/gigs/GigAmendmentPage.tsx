"use client";
import React from "react";
import styles from "./GigAmendmentPage.module.css";
import ScreenHeaderWithBack from "@/app/components/layout/ScreenHeaderWithBack";
import UpdateGig from "@/app/components/gigs/UpdateGig";
import {
  GigAmendmentActions,
  AmendmentReasonSection,
  AmendmentDummyChatbot,
} from "@/app/components/gigs/GigAmendmentSections";
import { useGigAmendment } from "@/app/hooks/useGigAmendment";
import LeavePageDialog from "@/app/hooks/LeavePageDialog";

export default function GigAmendmentPage() {
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
    handleSubmit,
    handleCancel,
    handleBackClick,
    showLeaveDialog,
    cancelLeave,
    confirmLeave,
  } = useGigAmendment();

  const config = {
    title: "Edit Gig Details",
    errorTitle: "Error",
    errorMessage: "Could not load gig details.",
    gigTitle: "Updated gig details:",
    isEditingDetails: true,
  };

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
        <ScreenHeaderWithBack title={config.errorTitle} />
        <div className={styles.error}>{config.errorMessage}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ScreenHeaderWithBack
        title={config.title}
        onBackClick={handleBackClick}
      />
      <main className={styles.contentWrapper}>
        <AmendmentDummyChatbot />
        <AmendmentReasonSection
          onReasonChange={setReason}
          reason={reason}
          workerId={gig.worker?.id}
        />
        <UpdateGig
          title={config.gigTitle}
          editedGigDetails={editedGigDetails}
          setEditedGigDetails={setEditedGigDetails}
        />
        <GigAmendmentActions
          handleSubmit={handleSubmit}
          handleCancel={handleCancel}
          isSubmitting={isSubmitting}
          isCancelling={isCancelling}
          existingAmendmentId={existingAmendmentId}
        />
        {showLeaveDialog && (
          <LeavePageDialog onClose={cancelLeave} onConfirm={confirmLeave} />
        )}
      </main>
    </div>
  );
}
