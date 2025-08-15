import React from 'react';
import GigDetails, { GigReviewDetailsData } from '@/app/types/GigDetailsTypes';
import ConfirmAmendedGigDetailsHeader from './ConfirmAmendedGigDetailsHeader';
import ConfirmAmendedGigDetailsNotification from './ConfirmAmendedGigDetailsNotification';
import ConfirmAmendedGigDetailsChatButton from './ConfirmAmendedGigDetailsChatButton';
import ConfirmAmendedGigDetailsDetails from './ConfirmAmendedGigDetailsDetails';
import ConfirmAmendedGigDetailsFooterActions from './ConfirmAmendedGigDetailsFooterActions';
import styles from './ConfirmAmendedGigDetailsPage.module.css';

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
}) => {
  return (
    <div className={styles.viewContainer}>
      <ConfirmAmendedGigDetailsHeader />
      <main className={styles.mainContent}>
        <ConfirmAmendedGigDetailsNotification
          gigDetails={gigDetails}
          isLoading={isLoading}
          lastRoleUsed={lastRoleUsed}
          notificationMessage={notificationMessage}
        />
        <ConfirmAmendedGigDetailsChatButton />
        <ConfirmAmendedGigDetailsDetails
          gigDetailsData={gigDetailsData}
          isLoading={isLoading}
          handleEditDetails={handleEditDetails}
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