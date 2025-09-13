"use client";

import React, { useState } from "react";
import styles from "./CancelOrAmendGigDetailsPage.module.css";
import { useAuth } from "@/context/AuthContext";
import { getLastRoleUsed } from "@/lib/last-role-used";
import UpdateGig from "@/app/components/gigs/UpdateGig";
import { useParams, usePathname, useRouter } from "next/navigation";
import { updateGigOfferStatus } from "@/actions/gigs/update-gig-offer-status";
import ScreenHeaderWithBack from "@/app/components/layout/ScreenHeaderWithBack";
import { GigReviewDetailsData } from "@/app/types";

// Mock data - replace with actual props or state
const gigDetailsData = {
  location: {
    formatted_address: "123 Main St, Cityville, Country"
  },
  date: "Saturday, 12th November 2023",
  time: "6:00 PM - 1:00 AM",
  payPerHour: "20",
  totalPay: "140",
  summary:
    "Add one more hour. Total gig value is now 140, with Able and payment provider fees of 14.",
} as GigReviewDetailsData;

export default function CancelOrAmendGigDetailsPage() {
  const router = useRouter();
  const path = usePathname();
  const params = useParams();
  const gigId = params.gigId as string;
  const { user } = useAuth();
  const [userMessage, setUserMessage] = useState("");
  const [isEditingDetails, setIsEditingDetails] = useState(false); // Add state for edit mode
  const [editedGigDetails, setEditedGigDetails] = useState(gigDetailsData); // State for edited details
  const [isLoading, setIsLoading] = useState(false);
  const lastRoleUsed = getLastRoleUsed();
  /*
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedGigDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };
  */

  const handleEditDetails = () => {
    // Logic for editing gig details - perhaps opens a modal or navigates
    console.log("Edit details clicked");
    setIsEditingDetails(!isEditingDetails); // Toggle edit mode
  };

  const handleSubmit = () => {
    // Logic for submitting the amendment/cancellation request
    console.log("Submit for Confirmation clicked. Message:", userMessage);
    console.log("Edited Gig Details:", editedGigDetails);
    localStorage.setItem(
      'amendedGig',
      JSON.stringify({ ...editedGigDetails, hourlyRate: editedGigDetails.payPerHour, estimatedEarnings: editedGigDetails.totalPay })
    );
    router.push(`${path}/review`);
    // TODO: Call API to submit amendment request
  };

  const handleCancelGig = async () => {
    if (!user?.uid || !gigId || !lastRoleUsed) return;

    setIsLoading(true);
    const role = lastRoleUsed.includes('BUYER') ? 'buyer' : 'worker';
    await updateGigOfferStatus({ gigId, role, userId: user?.uid, action: 'cancel' });
    setIsLoading(false)
  };

  return (
    <div className={styles.viewContainer}>
      {/* <header className={styles.header}>
        <h1 className={styles.headerTitle}>Cancel or Amend Gig Details</h1>
      </header> */}
      <ScreenHeaderWithBack title="Cancel or Amend" />

      <main className={styles.contentWrapper}>
        {/* Instruction Block */}
        <section className={`${styles.card} ${styles.instructionBlock}`}>
          <p className={styles.instructionText}>
            What changes would you like to make to the gig?{" "}
            Tell me or edit using the icon below.
          </p>
        </section>

        {/* Text Input Block */}
        {/* <section className={styles.botCard}>
          <label htmlFor="benjiMessage" className={styles.textInputBlockLabel}>
            {user?.displayName && user.displayName.toLocaleLowerCase() + ":"}
          </label>
          <textarea
            id="benjiMessage"
            name="benjiMessage"
            className={styles.textareaInput}
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            placeholder="e.g., Add one more hour to the gig or pay 22ph"
            rows={4}
          />
        </section> */}

        {/* Updated Gig Details Block */}
        <UpdateGig
          title="Gig Details"
          editedGigDetails={editedGigDetails}
          handleEditDetails={handleEditDetails}
          setEditedGigDetails={setEditedGigDetails}
          isEditingDetails={isEditingDetails}
        />
     {/* Action Button Area */}
      <div className={`${styles.actionBtnContainer}`}>
        <button
          type="button"
          className={`${styles.submitButton} ${lastRoleUsed === "GIG_WORKER" ? styles.workerBtn : styles.buyerBtn}`}
          onClick={handleSubmit}
        >
          Submit for Confirmation
        </button>
        
          {/* <div className={styles.cancelBtnText}>
            <span>
              Cancel GIG
            </span>
            (This might incur charges or penalties)
          </div> */}
        <button
          type="button"
          className={`${styles.cancelButton}`}
          onClick={handleCancelGig}
          disabled={isLoading}
        >
          Cancel Gig
          <p>This might incur charges or penalties</p>
        </button>
      </div>
      </main>

      
    </div>
  );
}
