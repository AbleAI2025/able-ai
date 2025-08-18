import React from 'react';
import GigDetails, { GigReviewDetailsData } from '@/app/types/GigDetailsTypes';
import ConfirmAmendedGigDetailsDetails from './ConfirmAmendedGigDetailsDetails';
import ConfirmAmendedGigDetailsFooterActions from './ConfirmAmendedGigDetailsFooterActions';
import styles from './ConfirmAmendedGigDetailsPage.module.css';
import ScreenHeaderWithBack from '@/app/components/layout/ScreenHeaderWithBack';
import { useRouter } from 'next/navigation';

type NotificationMessage = {
  user: string;
  change: string;
  prompt: string;
};

type ConfirmAmendedGigDetailsViewProps = {
  gigDetails: GigDetails;
  gigDetailsData?: GigReviewDetailsData;
  isLoading: boolean;
  isLoadingConfirm: boolean;
  lastRoleUsed: string | null;
  notificationMessage: NotificationMessage;
  handleEditDetails: () => void;
  handleConfirm: () => void;
  handleSuggestNew: () => void;
  handleDecline: () => void;
  isEditingDetails?: boolean; // Optional prop to control edit mode
};

const ConfirmAmendedGigDetailsView: React.FC<ConfirmAmendedGigDetailsViewProps> = ({
  gigDetails,
  gigDetailsData,
  isLoading,
  isLoadingConfirm,
  lastRoleUsed,
  notificationMessage,
  handleEditDetails,
  handleConfirm,
  handleSuggestNew,
  handleDecline,
  isEditingDetails
}) => {
  const router = useRouter();
  return (
    <div className={styles.viewContainer}>
      <ScreenHeaderWithBack title="Confirm Amended" onBackClick={() => router.back()} />
      <section className={`${styles.card} ${styles.instructionBlock}`}>
        <p className={styles.instructionText}>
          {gigDetails.buyerName || "Unknown"} has changed the hourly rate to £22ph, the update details are below.
          Please accept to confirm these changes, edit to suggest new changes, or decline.
        </p>
      </section>
      <main className={styles.mainContent}>
        <ConfirmAmendedGigDetailsDetails
          gigDetailsData={gigDetailsData}
          isLoading={isLoading}
          handleEditDetails={handleEditDetails}
          isEditingDetails={isEditingDetails} // Assuming this is always false for confirmation view
        />
      </main>
      <ConfirmAmendedGigDetailsFooterActions
        lastRoleUsed={lastRoleUsed}
        isLoadingConfirm={isLoadingConfirm}
        handleConfirm={handleConfirm}
        handleSuggestNew={handleSuggestNew}
        handleDecline={handleDecline}
      />
    </div>
  );
};

export default ConfirmAmendedGigDetailsView; 