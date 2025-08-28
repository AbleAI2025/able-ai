import React, { useEffect, useState } from 'react';
import { getGigDetails } from '@/actions/gigs/get-gig-details';
import GigDetails, { GigReviewDetailsData } from '@/app/types/GigDetailsTypes';
import ConfirmAmendedGigDetailsView from './ConfirmAmendedGigDetailsView';
import { User } from 'firebase/auth';
import { formatTimeRange } from '@/utils/format-time';
import { handleGigAdjustment } from '@/app/actions/stripe/handle-gig-adjustment';
import { toast } from 'sonner';

export type ConfirmAmendedGigDetailsContainerProps = {
  gigId: string;
  amendId: string;
  user: User | null;
  lastRoleUsed: string | null;
};

const buyerNotificationMessage = {
  user: "Benji",
  change: "the hourly rate to £22ph",
  prompt: "Please accept to confirm these changes, edit to suggest new changes, or decline"
};

const workerNotificationMessage = {
  user: "Sue",
  change: "added one hour to the gig",
  prompt: "Please accept to confirm these changes"
};

const ConfirmAmendedGigDetailsContainer: React.FC<ConfirmAmendedGigDetailsContainerProps> = ({ gigId, amendId, user, lastRoleUsed }) => {
  const [gigDetails, setGigDetails] = useState<GigDetails | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingConfirm, setIsLoadingConfirm] = useState<boolean>(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  const notificationMessage = lastRoleUsed ? buyerNotificationMessage : workerNotificationMessage;

  const handleEditDetails = () => {
    setIsEditingDetails(!isEditingDetails);
  };

  const handleConfirm = async () => {
    // Logic for confirming changes
    if (!user || !gigDetails || isLoadingConfirm) return;

    setIsLoadingConfirm(true);
    await handleGigAdjustment({
      gigId,
      firebaseUid: user.uid,
      newFinalRate: gigDetails.hourlyRate,
      newFinalHours: gigDetails.estimatedEarnings,
      currency: 'usd'
    });
    setIsLoadingConfirm(false);
    toast.success('Suggested changes confirmed!');
  };

  const handleSuggestNew = () => {
    // No-op, editing not supported in this view
  };

  const handleDecline = () => {
    // Logic for declining changes
  };

  useEffect(() => {
    const fetchGigDetails = async () => {
      if (!user || !lastRoleUsed) return;

      const amendedGig = JSON.parse(localStorage.getItem('amendedGig') || '');

      setIsLoading(false);
      setGigDetails(amendedGig);
      setIsLoading(true);
      const role = lastRoleUsed.includes('BUYER') ? 'buyer' : 'worker';
      const res = await getGigDetails({ userId: user.uid, gigId, role, isViewQA: true });
      setIsLoading(false);
      if (!res.gig) return;
      setGigDetails({ ...amendedGig, status: res.gig.status });
    };
    fetchGigDetails();
  }, [user, lastRoleUsed, gigId]);

  // Derive display data from gigDetails
  const gigDetailsData: GigReviewDetailsData | undefined = gigDetails
    ? {
      date: gigDetails.date,
      location: gigDetails.location,
      summary: gigDetails.specialInstructions || '',
      payPerHour: `${gigDetails.hourlyRate}`,
      totalPay: `${gigDetails.estimatedEarnings}`,
      time: formatTimeRange(gigDetails.startTime || '', gigDetails.endTime || ''),
      status: gigDetails.status,
    }
    : undefined;

  if (!gigDetails) {
    return null; // or a loader if you want
  }

  return (
    <ConfirmAmendedGigDetailsView
      gigDetails={gigDetails}
      gigDetailsData={gigDetailsData}
      isLoading={isLoading}
      isLoadingConfirm={isLoadingConfirm}
      lastRoleUsed={lastRoleUsed}
      notificationMessage={notificationMessage}
      handleEditDetails={handleEditDetails}
      handleConfirm={handleConfirm}
      handleSuggestNew={handleSuggestNew}
      handleDecline={handleDecline}
      isEditingDetails={isEditingDetails}
    />
  );
};

export default ConfirmAmendedGigDetailsContainer; 