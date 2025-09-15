"use client";
import React from "react";
import { usePathname } from 'next/navigation';
import styles from "./GigAmendmentPage.module.css";
import ScreenHeaderWithBack from "@/app/components/layout/ScreenHeaderWithBack";
import UpdateGig from "@/app/components/gigs/UpdateGig";
import { GigAmendmentActions, AmendmentReasonSection, AmendmentDummyChatbot } from "@/app/components/gigs/GigAmendmentSections";
import { useGigAmendment } from "@/app/hooks/useGigAmendment";

interface GigAmendmentPageProps {
  mode: 'edit' | 'amend';
}

export default function GigAmendmentPage({ mode }: GigAmendmentPageProps) {
  const pathname = usePathname();
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
    handleBackClick
  } = useGigAmendment();

  const config = {
    edit: {
      title: "Edit Gig Details",
      errorTitle: "Error",
      errorMessage: "Could not load gig details.",
      gigTitle: "Updated gig details:",
      isEditingDetails: true,
      handleEditDetails: () => router.back(),
    },
    amend: {
      title: "Cancel or Amend",
      errorTitle: "Amend Gig",
      errorMessage: "Gig not found",
      gigTitle: "Updated gig details:",
      isEditingDetails: false,
      handleEditDetails: () => router.push(`${pathname}/edit`),
    }
  };

  const currentConfig = config[mode];

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
        <ScreenHeaderWithBack title={currentConfig.errorTitle} />
        <div className={styles.error}>{currentConfig.errorMessage}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ScreenHeaderWithBack title={currentConfig.title}  onBackClick={handleBackClick}/>
      <main className={styles.contentWrapper}>
        <AmendmentDummyChatbot />
        <AmendmentReasonSection 
          onReasonChange={setReason} 
          reason={reason} 
          workerId={gig.worker?.id} 
        />
        <UpdateGig
          title={currentConfig.gigTitle}
          editedGigDetails={editedGigDetails}
          setEditedGigDetails={setEditedGigDetails}
          isEditingDetails={currentConfig.isEditingDetails}
          handleEditDetails={currentConfig.handleEditDetails}
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
