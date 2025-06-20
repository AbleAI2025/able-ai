"use client";

import React, { useState } from "react";
import styles from "./CancelOrAmendGigDetailsPage.module.css";
import { useAuth } from "@/context/AuthContext";
import { getLastRoleUsed } from "@/lib/last-role-used";
import Logo from "@/app/components/brand/Logo";
import UpdateGig from "@/app/components/gigs/UpdateGig";

// Mock data - replace with actual props or state
const gigDetailsData = {
  location: "The Green Tavern, Main Street, Springfield",
  date: "Saturday, 12th November 2023",
  time: "6:00 PM - 1:00 AM",
  payPerHour: "20",
  totalPay: "140",
  summary:
    "Add one more hour. Total gig value is now 140, with Able and payment provider fees of 14.",
};

export default function CancelOrAmendGigDetailsPage() {
  const { user } = useAuth();
  const [userMessage, setUserMessage] = useState("");
  const [isEditingDetails, setIsEditingDetails] = useState(false); // Add state for edit mode
  const [editedGigDetails, setEditedGigDetails] = useState(gigDetailsData); // State for edited details
  const lastRoleUsed = getLastRoleUsed()
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
    // TODO: Call API to submit amendment request
  };

  return (
    <div className={styles.viewContainer}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Cancel or Amend Gig Details</h1>
      </header>

      <main>
        {/* Instruction Block */}
        <section className={`${styles.card} ${styles.instructionBlock}`}>
          <div className={styles.instructionIconContainer}>
            <Logo width={60} height={60} />
          </div>
          <p className={styles.instructionText}>
            What changes would you like to make to the gig?{" "}
            Tell me or edit using the icon below
          </p>
        </section>

        {/* Text Input Block */}
        <section className={styles.botCard}>
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
        </section>

        {/* Updated Gig Details Block */}
        <UpdateGig
          gigDetailsData={gigDetailsData}
          editedGigDetails={editedGigDetails}
          handleEditDetails={handleEditDetails}
          setEditedGigDetails={setEditedGigDetails}
          isEditingDetails={isEditingDetails}
        />
      </main>

      {/* Action Button Area */}
      <button
        type="button"
        className={`${styles.submitButton} ${lastRoleUsed === "GIG_WORKER" ? styles.workerBtn : styles.buyerBtn}`}
        onClick={handleSubmit}
      >
        Submit for Confirmation
      </button>
    </div>
  );
}
