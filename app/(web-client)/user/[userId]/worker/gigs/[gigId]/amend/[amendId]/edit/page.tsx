"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useGigAmendContext } from "@/context/GigAmendContext";
import { createGigAmendment, findExistingGigAmendment, cancelGigAmendment, getGigAmendmentDetails } from "@/actions/gigs/manage-amendment";
import { initialGigState, formatGigDataForEditing } from "@/utils/gig-utils";
import type { GigReviewDetailsData } from '@/app/types/GigDetailsTypes';
import styles from "./CancelOrAmendGigDetailsPage.module.css";
import ScreenHeaderWithBack from "@/app/components/layout/ScreenHeaderWithBack";
import UpdateGig from "@/app/components/gigs/UpdateGig";
import { toast } from 'sonner';
import { GigAmendmentActions, AmendmentReasonSection, AmendmentDummyChatbot } from "@/app/components/gigs/GigAmendmentSections";

export default function EditGigPage() {
  const router = useRouter();
  const params = useParams();
  const gigId = params.gigId as string;
  const userId = params.userId as string;
  const amendId = params.amendId as string;

  const { user } = useAuth();
  const { gig, isLoading: isGigContextLoading } = useGigAmendContext();

  const [editedGigDetails, setEditedGigDetails] = useState<GigReviewDetailsData>(initialGigState);
  const [reason, setReason] = useState("");
  const [existingAmendmentId, setExistingAmendmentId] = useState<string | null>(null);

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const fetchAmendmentData = async () => {
      if (!user || !gigId || isGigContextLoading || !gig) return;

      try {
        setIsPageLoading(true);
        if (amendId === "new") {
          const formattedData = formatGigDataForEditing(gig);
          setEditedGigDetails(formattedData);
          const amendmentResult = await findExistingGigAmendment({ gigId, userId: user.uid });
          if (amendmentResult.amendId) {
            setExistingAmendmentId(amendmentResult.amendId);
          }
        } else {
          const amendmentResult = await getGigAmendmentDetails({ amendmentId: amendId });
          if (amendmentResult.amendment) {
            const { newValues, reason: amendmentReason, id } = amendmentResult.amendment;
            setEditedGigDetails(newValues as GigReviewDetailsData);
            setReason(amendmentReason || "");
            setExistingAmendmentId(id);
          } else {
            toast.error(amendmentResult.error || "Could not load amendment details.");
            router.back();
          }
        }
      } catch (error) {
        console.error("Failed to fetch page data:", error);
        toast.error("An unexpected error occurred while loading the page.");
      } finally {
        setIsPageLoading(false);
      }
    };
    fetchAmendmentData();
  }, [gig, isGigContextLoading, gigId, user, userId, amendId, router]);

  const handleSubmit = async () => {
    if (!user?.uid || !gigId || !reason.trim()) {
      toast.error("Please provide a reason for the changes.");
      return;
    }
    setIsSubmitting(true);
    const result = await createGigAmendment({ amendId, gigId, userId: user.uid, requestType: "GENERAL", newValues: editedGigDetails, reason: reason });
    setIsSubmitting(false);
    if (result.success && result.amendmentId) {
      toast.success("Amendment request updated");
      if (amendId === "new") {
        router.push(`/user/${userId}/worker/gigs/${gigId}/amend/${result.amendmentId}`);
      } else {
        router.back();
      }
    } else {
      toast.error(`Failed to submit amendment: ${result.error}`);
    }
  };

  const handleCancel = async () => {
    if (existingAmendmentId && user?.uid) {
      setIsCancelling(true);
      const result = await cancelGigAmendment({ amendmentId: existingAmendmentId, userId: user.uid });
      setIsCancelling(false);
      if (result.success) {
        toast.success("Your pending amendment has been withdrawn.");
        router.push(`/user/${userId}/worker/gigs/${gigId}`);
      } else {
        toast.error(`Could not withdraw amendment: ${result.error}`);
      }
    } else {
      router.back();
    }
  };

  if (isGigContextLoading || isPageLoading) {
    return <div className={styles.viewContainer}><div className={styles.loading}>Loading...</div></div>;
  }

  if (!gig) {
    return <div className={styles.viewContainer}><ScreenHeaderWithBack title="Error" onBackClick={() => router.back()} /><div className={styles.error}>Could not load gig details.</div></div>;
  }

  return (
    <div className={styles.viewContainer}>
      <ScreenHeaderWithBack title="Edit Gig Details" onBackClick={() => router.back()} />
      <main className={styles.contentWrapper}>
        <AmendmentDummyChatbot />
        <AmendmentReasonSection onReasonChange={setReason} reason={reason} workerId={gig.workerId} />
        <UpdateGig title="Updated gig details:" editedGigDetails={editedGigDetails} setEditedGigDetails={setEditedGigDetails} isEditingDetails={true} handleEditDetails={() => router.back()} />
        <GigAmendmentActions handleSubmit={handleSubmit} handleCancel={handleCancel} isSubmitting={isSubmitting} isCancelling={isCancelling} existingAmendmentId={existingAmendmentId} />
      </main>
    </div>
  );
}
