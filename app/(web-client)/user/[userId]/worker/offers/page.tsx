/* eslint-disable max-lines-per-function */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import Link from "next/link";

import GigOfferCard from "@/app/components/shared/GigOfferCard"; // Assuming shared location
import AcceptedGigCard from "@/app/components/shared/AcceptedGigCard"; // Import new component

import GigDetailsModal from "@/app/components/shared/GigDetailsModal";
import { Calendar, Loader2 } from "lucide-react";
import styles from "./OffersPage.module.css"; // Import styles
import { useAuth } from "@/context/AuthContext";
import { getLastRoleUsed } from "@/lib/last-role-used";

import ScreenHeaderWithBack from "@/app/components/layout/ScreenHeaderWithBack";
import {
  getWorkerOffers,
  WorkerGigOffer,
} from "@/actions/gigs/get-worker-offers";
import { acceptGigOffer } from "@/actions/gigs/accept-gig-offer";
import { declineGigOffer } from "@/actions/gigs/decline-gig-offer";

type GigOffer = WorkerGigOffer;

// Database function to fetch worker offers and accepted gigs
async function fetchWorkerData(
  userId: string,
  filters?: string[]
): Promise<{ offers: GigOffer[]; acceptedGigs: GigOffer[]; workerId: string }> {
  const result = await getWorkerOffers(userId);

  if (result.error) {
    throw new Error(result.error);
  }

  if (!result.data) {
    throw new Error("No data received from server");
  }

  return result.data;
}

export default function WorkerOffersPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const pageUserId = params.userId as string;
  const lastRoleUsed = getLastRoleUsed();

  const { user, loading: loadingAuth } = useAuth();
  const authUserId = user?.uid;

  const [offers, setOffers] = useState<GigOffer[]>([]);
  const [acceptedGigs, setAcceptedGigs] = useState<GigOffer[]>([]); // New state for accepted gigs
  const [isLoadingData, setIsLoadingData] = useState(true); // Renamed loading state
  const [error, setError] = useState<string | null>(null);
  const [processingOfferId, setProcessingOfferId] = useState<string | null>(
    null
  );
  const [processingAction, setProcessingAction] = useState<
    "accept" | "decline" | null
  >(null);
  const [selectedGig, setSelectedGig] = useState<GigOffer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workerProfileId, setWorkerProfileId] = useState<string | null>(null);
  const uid = authUserId;

  // Fetch worker data (offers and accepted gigs)
  useEffect(() => {
    // Check if user is authorized to view this page
    if (!loadingAuth && user && authUserId === pageUserId) {
      setIsLoadingData(true);
      fetchWorkerData(pageUserId)
        .then((data) => {
          setOffers(data.offers);
          setAcceptedGigs(data.acceptedGigs);
          setWorkerProfileId(data.workerId);
          setError(null);
        })
        .catch((err) => {
          console.error("Error fetching worker data:", err);
          setError("Failed to load data. Please try again.");
          setOffers([]);
          setAcceptedGigs([]);
        })
        .finally(() => setIsLoadingData(false));
    } else if (!loadingAuth && user && authUserId !== pageUserId) {
      setError(
        "You are not authorized to view this page. Please sign in with the correct account."
      );
      setIsLoadingData(false);
      // Redirect to signin after a short delay
      setTimeout(() => {
        router.push(`/?redirect=${pathname}`);
      }, 2000);
    } else if (!loadingAuth && !user) {
      setError("Please sign in to view this page.");
      setIsLoadingData(false);
      // Redirect to signin after a short delay
      setTimeout(() => {
        router.push(`/?redirect=${pathname}`);
      }, 2000);
    }
  }, [user, loadingAuth, authUserId, pageUserId, lastRoleUsed]);

  const handleAcceptOffer = async (offerId: string) => {
    if (!uid) {
      console.error("User not authenticated");
      return;
    }

    setProcessingOfferId(offerId);
    setProcessingAction("accept");

    try {
      // Use the Firebase UID directly, not the page user ID
      const result = await acceptGigOffer({ gigId: offerId, userUid: uid });

      if (result.error) {
        console.error("Debug - Server returned error:", result.error);
        throw new Error(result.error);
      }

      // On success: remove from offers list and add to accepted gigs
      setOffers((prev) => prev.filter((o) => o.id !== offerId));

      // Find the accepted offer to add to accepted gigs
      const acceptedOffer = offers.find((o) => o.id === offerId);
      if (acceptedOffer) {
        const acceptedGig = { ...acceptedOffer, status: "ACCEPTED" };
        setAcceptedGigs((prev) => [...prev, acceptedGig]);
      }
    } catch (err) {
      console.error("Error accepting offer:", err);
      // Show error message (you can add toast here)
    } finally {
      setProcessingOfferId(null);
      setProcessingAction(null);
    }
  };

  const handleDeclineOffer = async (offerId: string) => {
    if (!uid) {
      console.error("User not authenticated");
      return;
    }

    setProcessingOfferId(offerId);
    setProcessingAction("decline");
    try {
      // Call the declineGigOffer action to properly decline the offer
      const result = await declineGigOffer({
        gigId: offerId,
        userUid: uid,
      });

      if (result.error) {
        console.error("Debug - Server returned error:", result.error);
        throw new Error(result.error);
      }

      // On success: remove from offers list
      setOffers((prev) => prev.filter((o) => o.id !== offerId));
    } catch (err) {
      console.error("Error declining offer:", err);
      // Show error message (you can add toast here)
    } finally {
      setProcessingOfferId(null);
      setProcessingAction(null);
    }
  };

  const handleViewDetails = (gigId: string) => {
    const gig =
      offers.find((o) => o.id === gigId) ||
      acceptedGigs.find((g) => g.id === gigId);
    if (gig && workerProfileId) {
      setSelectedGig(gig);
      router.push(`/user/${workerProfileId}/worker/gigs/${gigId}`);
    } else if (!workerProfileId) {
      console.error("Worker profile ID not available yet");
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedGig(null);
  };

  const handleModalAccept = (gigId: string) => {
    // Find the offer and accept it
    const offer = offers.find((o) => o.id === gigId);
    if (offer) {
      handleAcceptOffer(gigId);
      handleModalClose();
    }
  };

  const handleModalDecline = (gigId: string) => {
    // Find the offer and decline it
    const offer = offers.find((o) => o.id === gigId);
    if (offer) {
      handleDeclineOffer(gigId);
      handleModalClose();
    }
  };

  return (
    <div className={styles.container}>
      <ScreenHeaderWithBack title="Gig Offers" />

      <div className={styles.pageWrapper}>
        {isLoadingData ? (
          <div className={styles.loadingContainer}>
            <Loader2 className={styles.spinner} size={32} />
            <span>Loading your gigs...</span>
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* Pending Offers Section */}
            <div className={styles.offersSection}>
              <div className={styles.pageHeader}>
                <h1 className={styles.sectionTitle}>Pending Offers</h1>
                <button
                  onClick={() =>
                    router.push(`/user/${pageUserId}/worker/calendar`)
                  }
                  className={styles.calendarNavButton}
                  title="View Calendar"
                >
                  <Calendar size={24} />
                  <span>Calendar</span>
                </button>
              </div>

              {offers.length > 0 ? (
                offers.map((offer) => (
                  <GigOfferCard
                    key={offer.id}
                    offer={offer}
                    onAccept={(offerId: string) => handleAcceptOffer(offerId)}
                    onDecline={(offerId: string) => handleDeclineOffer(offerId)}
                    onViewDetails={handleViewDetails}
                    isProcessingAccept={
                      processingOfferId === offer.id &&
                      processingAction === "accept"
                    }
                    isProcessingDecline={
                      processingOfferId === offer.id &&
                      processingAction === "decline"
                    }
                  />
                ))
              ) : (
                <p className={styles.emptySectionMsg}>
                  No pending offers available right now.
                </p>
              )}
            </div>

            {/* Accepted Upcoming Gigs Section */}
            <div className={styles.acceptedSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Accepted Upcoming Gigs</h2>
                <Link href={`/user/${pageUserId}/worker/calendar`} passHref>
                  <Calendar size={24} color="#ffffff" />
                </Link>
              </div>
              {acceptedGigs.length > 0 ? (
                acceptedGigs.map((gig) => (
                  <AcceptedGigCard
                    key={gig.id}
                    gig={gig}
                    onViewDetails={handleViewDetails}
                  />
                ))
              ) : (
                <p className={styles.emptySectionMsg}>
                  You don’t have any upcoming accepted gigs yet.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Gig Details Modal */}
      <GigDetailsModal
        gig={selectedGig}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onAccept={handleModalAccept}
        onDecline={handleModalDecline}
        isProcessingAccept={processingAction === "accept"}
        isProcessingDecline={processingAction === "decline"}
      />
    </div>
  );
}
