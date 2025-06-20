"use client";

import React from 'react';
import { AlertCircle, MessageSquare } from 'lucide-react';
import styles from './ConfirmAmendedGigDetailsPage.module.css';
import { getLastRoleUsed } from '@/lib/last-role-used';
import UpdateGig from '@/app/components/gigs/UpdateGig';
import Logo from '@/app/components/brand/Logo';

// Mock data for Buyer view
const buyerGigDetailsData = {
  location: 'The Green Tavern, Main Street, Springfield',
  date: 'Saturday, 12th November 2023',
  time: '6:00 PM - 1:00 AM',
  payPerHour: '£22',
  totalPay: '£169.40',
  summary: 'including Able and payment provider fees',
};

const buyerNotificationMessage = {
  user: "Benji",
  change: "the hourly rate to £22ph",
  prompt: "Please accept to confirm these changes, edit to suggest new changes, or decline"
};

// Mock data for Worker view
const workerGigDetailsData = {
  location: 'The Green Tavern, Main Street, Springfield',
  date: 'Saturday, 12th November 2023',
  time: '6:00 PM - 1:00 AM',
  payPerHour: '£20',
  totalPay: '£140',
  summary: 'including Able and payment provider fees',
};

const workerNotificationMessage = {
  user: "Sue",
  change: "added one hour to the gig",
  prompt: "Please accept to confirm these changes"
};

export default function ConfirmAmendedGigDetailsPage() {
  const lastRoleUsed = getLastRoleUsed()
  const [editedGigDetails, setEditedGigDetails] = React.useState(buyerGigDetailsData);

  // Determine which data and UI elements to use based on role
  const gigDetailsData = lastRoleUsed ? buyerGigDetailsData : workerGigDetailsData;
  const notificationMessage = lastRoleUsed ? buyerNotificationMessage : workerNotificationMessage;

  const handleEditDetails = () => {
    console.log("Edit details clicked");
    // Logic for suggesting new changes or editing
  };

  const handleConfirm = () => {
    console.log("Confirm changes clicked");
  };

  const handleSuggestNew = () => {
    console.log("Suggest new changes clicked");
    // This might be the same as handleEditDetails or a different flow
    handleEditDetails();
  };

  const handleDecline = () => {
    console.log("Decline changes clicked");
  };

  return (
    <div className={styles.viewContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <AlertCircle className={styles.headerIcon} strokeWidth={2} color='#ffffff'/>
          <h1 className={styles.headerTitle}>Confirm amended Gig Details</h1>
        </div>
      </header>

      <main className={styles.mainContent}>
        {/* Information/Notification Block */}
        <section className={`${styles.card} ${styles.notificationCard}`}>
          <div className={styles.notificationMain}>
            <Logo width={60} height={60} />
            <p className={styles.notificationText}>
              {notificationMessage.user} has {notificationMessage.change}, the update details are below. {notificationMessage.prompt}
            </p>
          </div>
          {lastRoleUsed == "BUYER" && (
            <MessageSquare className={styles.chatIcon} strokeWidth={1.5} onClick={() => console.log("Chat icon clicked")} />
          )}
        </section>
        <button className={styles.chatButton} onClick={() => console.log("Chat icon clicked")} >
          <MessageSquare fill='#ffffff' className={styles.chatIcon} strokeWidth={1.5} />
        </button>
        {/* Updated Gig Details Block */}
        {/* <section className={styles.card}>
          <div className={styles.detailsHeader}>
            <h2 className={styles.detailsTitle}>Updated gig details:</h2>
            {lastRoleUsed == "BUYER" && (
              <Edit3 className={styles.editIcon} onClick={handleEditDetails} />
            )}
          </div>
          <div className={styles.detailsList}>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}>Location:</span>
              <span className={styles.detailItemValue}>{gigDetailsData.location}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}>Date:</span>
              <span className={styles.detailItemValue}>{gigDetailsData.date}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}>Time:</span>
              <span className={styles.detailItemValue}>{gigDetailsData.time}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}>Pay per hour:</span>
              <span className={`${styles.detailItemValue} ${lastRoleUsed == "BUYER" ? styles.highlightedValue : ''}`}>
                {gigDetailsData.payPerHour}
              </span>
            </div>
            {lastRoleUsed == "BUYER" ? (
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Total cost:</span>
                <span className={styles.detailItemValue}>
                  <span className={styles.totalCostValue}>{buyerGigDetailsData.totalCostValue}</span>
                  <span className={styles.feesText}>{buyerGigDetailsData.feesText}</span>
                </span>
              </div>
            ) : (
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Total Pay:</span>
                <span className={styles.detailItemValue}>{workerGigDetailsData.totalPay}</span>
              </div>
            )}
          </div>
        </section> */}
        <UpdateGig
          gigDetailsData={gigDetailsData}
          editedGigDetails={gigDetailsData}
          handleEditDetails={handleEditDetails}
          setEditedGigDetails={setEditedGigDetails}
          isOnConfirm={true}
        />
      </main>

      <footer className={styles.actionsFooter}>
        <button
          type="button"
          className={`${styles.actionButton} ${lastRoleUsed == "BUYER" ? styles.confirmButton : styles.suggestButton /* Using suggestButton style for worker confirm */}`}
          onClick={handleConfirm}
        >
          Confirm changes
        </button>  
        <button
          type="button"
          className={`${styles.actionButton} ${styles.suggestButton}`}
          onClick={handleSuggestNew}
        >
          Suggest new changes
        </button>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.declineButton}`}
          onClick={handleDecline}
        >
          Decline changes
        </button>
        {lastRoleUsed == "BUYER" && (
          <>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.suggestButton}`}
              onClick={handleSuggestNew}
            >
              Suggest new changes
            </button>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.declineButton}`}
              onClick={handleDecline}
            >
              Decline changes
            </button>
          </>
        )}
      </footer>
    </div>
  );
} 