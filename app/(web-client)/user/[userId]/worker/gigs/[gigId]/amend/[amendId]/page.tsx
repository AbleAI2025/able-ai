'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useGigAmendContext } from '@/context/GigAmendContext';
import styles from './AmendGigPage.module.css';
import ScreenHeaderWithBack from '@/app/components/layout/ScreenHeaderWithBack';
import { GigAmendmentActions, AmendmentReasonSection, AmendmentDummyChatbot } from "@/app/components/gigs/GigAmendmentSections";
import { createGigAmendment, cancelGigAmendment, findExistingGigAmendment, getGigAmendmentDetails } from "@/actions/gigs/manage-amendment";
import { initialGigState, formatGigDataForEditing } from "@/utils/gig-utils";
import type { GigReviewDetailsData } from '@/app/types/GigDetailsTypes';
import UpdateGig from "@/app/components/gigs/UpdateGig";
import { toast } from 'sonner';

export default function AmendGigPage() {
  const params = useParams();
  const completePathName = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { gig, isLoading: isGigContextLoading } = useGigAmendContext();

  const gigId = params.gigId as string;
  const userId = params.userId as string;
  const amendId = params.amendId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [editedGigDetails, setEditedGigDetails] = useState<GigReviewDetailsData>(initialGigState);
  const [reason, setReason] = useState("");
  const [existingAmendmentId, setExistingAmendmentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const fetchAmendmentData = async () => {
      if (!user || !gigId || isGigContextLoading || !gig) return;

      try {
        setIsLoading(true);
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
            const { newValues, reason, id } = amendmentResult.amendment;
            setEditedGigDetails(newValues as GigReviewDetailsData);
            setReason(reason || "");
            setExistingAmendmentId(id);
          } else {
            toast.error(amendmentResult.error || "Could not load amendment details.");
            router.back();
          }
        }
      } catch (error) {
        console.error('Error fetching amendment data:', error);
        toast.error("An unexpected error occurred while loading amendment details.");
      } finally {
        setIsLoading(false);
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
      toast.success("Submitted amendment request");
      if (amendId === "new") {
        router.push(`/user/${userId}/worker/gigs/${gigId}/amend/${result.amendmentId}`);
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

  if (isGigContextLoading || isLoading) {
    return <div className={styles.container}><div className={styles.loading}>Loading...</div></div>;
  }

  if (!gig) {
    return <div className={styles.container}><ScreenHeaderWithBack title="Amend Gig" onBackClick={() => router.back()} /><div className={styles.error}>Gig not found</div></div>;
  }

  return (
    <div className={styles.container}>
      <ScreenHeaderWithBack title="Cancel or Amend" onBackClick={() => router.back()} />
      <main className={styles.contentWrapper}>
        <AmendmentDummyChatbot />
        <AmendmentReasonSection onReasonChange={setReason} reason={reason} workerId={gig.workerId} />
        <UpdateGig title="Updated gig details:" editedGigDetails={editedGigDetails} setEditedGigDetails={setEditedGigDetails} isEditingDetails={false} handleEditDetails={() => router.push(`${completePathName}/edit`)} />
        <GigAmendmentActions handleSubmit={handleSubmit} handleCancel={handleCancel} isSubmitting={isSubmitting} isCancelling={isCancelling} existingAmendmentId={existingAmendmentId} />
      </main>
    </div>
  );
}
