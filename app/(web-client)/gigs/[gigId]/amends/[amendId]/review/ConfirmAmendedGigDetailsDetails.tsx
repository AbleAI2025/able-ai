import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import UpdateGig from '@/app/components/gigs/UpdateGig';
import styles from './ConfirmAmendedGigDetailsPage.module.css';
import { GigReviewDetailsData } from '@/app/types/GigDetailsTypes';

type Props = {
  gigDetailsData?: GigReviewDetailsData;
  isLoading: boolean;
  handleEditDetails: () => void;
};

const ConfirmAmendedGigDetailsDetails: React.FC<Props> = ({ gigDetailsData, isLoading, handleEditDetails }) => {
  const [editedGigDetails, setEditedGigDetails] = useState<GigReviewDetailsData>(
    gigDetailsData as GigReviewDetailsData
  );

  useEffect(() => {
    if (gigDetailsData) {
      setEditedGigDetails(gigDetailsData);
    }
  }, [gigDetailsData]);

  return (
    <>
      {!gigDetailsData && isLoading && (
        <div className={styles.loaderContainer}>
          <Loader2 />
        </div>
      )}
      {gigDetailsData && (
        <UpdateGig
          gigDetailsData={gigDetailsData}
          editedGigDetails={editedGigDetails}
          setEditedGigDetails={setEditedGigDetails}
          handleEditDetails={handleEditDetails}
          isOnConfirm={true}
        />
      )}
    </>
  );
};

export default ConfirmAmendedGigDetailsDetails; 