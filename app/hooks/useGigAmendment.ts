// src/hooks/useGigAmendment.ts
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useGigAmendContext } from '@/context/GigAmendContext';
import { createGigAmendment, cancelGigAmendment, findExistingGigAmendment, getGigAmendmentDetails } from "@/actions/gigs/manage-amendment";
import { initialGigState, formatGigDataForEditing } from "@/utils/gig-utils";
import type { GigReviewDetailsData } from '@/app/types/GigDetailsTypes';
import { toast } from 'sonner';

export function useGigAmendment() {
  const params = useParams();
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
      // Guard clause to ensure all required data is available
      if (!user || !gigId || isGigContextLoading || !gig) return;

      try {
        setIsLoading(true);
        if (amendId === "new") {
          // Creating a new amendment
          const formattedData = formatGigDataForEditing(gig);
          setEditedGigDetails(formattedData);
          const amendmentResult = await findExistingGigAmendment({ gigId, userId: user.uid });
          if (amendmentResult.amendId) {
            setExistingAmendmentId(amendmentResult.amendId);
          }
        } else {
          // Loading an existing amendment
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
    const result = await createGigAmendment({ amendId, gigId, userId: user.uid, requestType: "GENERAL", newValues: editedGigDetails, reason });
    setIsSubmitting(false);
    
    if (result.success && result.amendmentId) {
      toast.success(amendId === "new" ? "Submitted amendment request" : "Amendment request updated");
      if (amendId === "new") {
        // For a new amendment, always redirect to the new amendment's page
        router.push(`/user/${userId}/worker/gigs/${gigId}/amend/${result.amendmentId}`);
      } else {
        // When updating an existing one, just go back to the previous page
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
      // If there's no amendment to cancel, just go back
      router.back();
    }
  };

  return {
    isLoading: isLoading || isGigContextLoading,
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
  };
}
