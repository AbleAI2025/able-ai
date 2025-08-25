/* eslint-disable max-lines-per-function */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import Link from "next/link";

import GigOfferCard from "@/app/components/shared/GigOfferCard"; // Assuming shared location
import AcceptedGigCard from "@/app/components/shared/AcceptedGigCard"; // Import new component
import AiSuggestionBanner from "@/app/components/shared/AiSuggestionBanner";
import GigDetailsModal from "@/app/components/shared/GigDetailsModal";
import { Loader2, Inbox, Calendar } from "lucide-react";
import styles from "./OffersPage.module.css"; // Import styles
import Logo from "@/app/components/brand/Logo";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { getLastRoleUsed } from "@/lib/last-role-used";
import { useAiSuggestionBanner } from "@/hooks/useAiSuggestionBanner";
import ScreenHeaderWithBack from "@/app/components/layout/ScreenHeaderWithBack";
import { getWorkerOffers, WorkerGigOffer } from "@/actions/gigs/get-worker-offers";
import { acceptGigOffer } from "@/actions/gigs/accept-gig-offer";
import { declineGigOffer } from "@/actions/gigs/decline-gig-offer";

type GigOffer = WorkerGigOffer;

// Database function to fetch worker offers and accepted gigs
async function fetchWorkerData(
  userId: string,
  filters?: string[],
): Promise<{ offers: GigOffer[]; acceptedGigs: GigOffer[] }> {
  console.log(
    "Fetching worker data for workerId:",
    userId,
    "with filters:",
    filters
  );

  const result = await getWorkerOffers(userId);
  
  if (result.error) {
    throw new Error(result.error);
  }

  if (!result.data) {
    throw new Error('No data received from server');
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
  const uid = authUserId;

  // AI Suggestion Banner Hook
  const {
    suggestions: aiSuggestions,
    currentIndex,
    isLoading: isLoadingSuggestions,
    error: suggestionsError,
    dismissed: suggestionsDismissed,
    dismiss: dismissSuggestions,
    refresh: refreshSuggestions,
    goToNext,
    goToPrev,
  } = useAiSuggestionBanner({
    role: "worker",
    userId: uid || "", // Provide fallback for undefined uid
    // enabled: true, // Removed duplicate enabled property
    context: {
      // Example context for worker, replace with actual relevant data
      profileCompletion: 0.7,
      recentActivity: "applied for 2 gigs",
      platformTrends: [
        "high demand for photographers",
        "weekend shifts available",
      ],
    },
    enabled: !!uid, // Only enable if uid is available
  });

  // Fetch worker data (offers and accepted gigs)
  useEffect(() => {
    // Debug logging to see what's happening
    console.log("Debug - loadingAuth:", loadingAuth);
    console.log("Debug - user:", user);
    console.log("Debug - authUserId:", authUserId);
    console.log("Debug - pageUserId:", pageUserId);
    console.log("Debug - lastRoleUsed:", lastRoleUsed);
    console.log("Debug - user?.claims.role:", user?.claims?.role);
    console.log("Debug - uid variable:", uid);

    // Check if user is authorized to view this page
    if (!loadingAuth && user && authUserId === pageUserId) {
      console.log("Debug - User authorized, fetching worker data...");
      setIsLoadingData(true);
      fetchWorkerData(pageUserId)
        .then((data) => {
          console.log("Debug - offer received:", data);
          setOffers(data.offers);
          setAcceptedGigs(data.acceptedGigs);
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
      console.log("Debug - User not authorized for this page");
      setError("You are not authorized to view this page. Please sign in with the correct account.");
      setIsLoadingData(false);
      // Redirect to signin after a short delay
      setTimeout(() => {
        router.push(`/signin?redirect=${pathname}`);
      }, 2000);
    } else if (!loadingAuth && !user) {
      console.log("Debug - No user authenticated");
      setError("Please sign in to view this page.");
      setIsLoadingData(false);
      // Redirect to signin after a short delay
      setTimeout(() => {
        router.push(`/signin?redirect=${pathname}`);
      }, 2000);
    }
  }, [user, loadingAuth, authUserId, pageUserId, lastRoleUsed]);

  const handleAcceptOffer = async (offerId: string) => {
    if (!uid) {
      console.error("User not authenticated");
      return;
    }

    console.log("Debug - handleAcceptOffer called with:", { offerId, uid, authUserId, pageUserId });
    
    setProcessingOfferId(offerId);
    setProcessingAction("accept");
    console.log("Accepting offer:", offerId);
    
    try {
      console.log("Debug - About to call acceptGigOffer with:", { gigId: offerId, userId: uid });
      
      // Use the Firebase UID directly, not the page user ID
      const result = await acceptGigOffer({ gigId: offerId, userId: uid });
      
      console.log("Debug - acceptGigOffer result:", result);
      
      if (result.error) {
        console.error("Debug - Server returned error:", result.error);
        throw new Error(result.error);
      }

      // On success: remove from offers list and add to accepted gigs
      setOffers((prev) => prev.filter((o) => o.id !== offerId));
      
      // Find the accepted offer to add to accepted gigs
      const acceptedOffer = offers.find(o => o.id === offerId);
      if (acceptedOffer) {
        const acceptedGig = { ...acceptedOffer, status: 'ACCEPTED' };
        setAcceptedGigs((prev) => [...prev, acceptedGig]);
      }

      // Show success message (you can add toast here)
      console.log("Offer accepted successfully!");
      
      // Optionally navigate to the accepted gig details
      // router.push(`/user/${uid}/worker/gigs/${offerId}`);
      
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
    console.log("Declining offer:", offerId);
    
    try {
      // Call the declineGigOffer action to properly decline the offer
      const result = await declineGigOffer({ 
        gigId: offerId, 
        userId: uid
      });
      
      console.log("Debug - declineGigOffer result:", result);
      
      if (result.error) {
        console.error("Debug - Server returned error:", result.error);
        throw new Error(result.error);
      }

      // On success: remove from offers list
      setOffers((prev) => prev.filter((o) => o.id !== offerId));
      
      // Show success message (you can add toast here)
      console.log("Offer declined successfully!");
      
    } catch (err) {
      console.error("Error declining offer:", err);
      // Show error message (you can add toast here)
    } finally {
      setProcessingOfferId(null);
      setProcessingAction(null);
    }
  };

  const handleViewDetails = (offerId: string) => {
    const offer = offers.find(o => o.id === offerId);
    if (offer) {
      setSelectedGig(offer);
      router.push(`/user/${pageUserId}/worker/gigs/${offerId}`);
      // setIsModalOpen(true);
    }
  };
  const handleGoToHome = () => {
    router.push(`/user/${pageUserId}/worker`);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedGig(null);
  };

  const handleModalAccept = (gigId: string) => {
    // Find the offer and accept it
    const offer = offers.find(o => o.id === gigId);
    if (offer) {
      handleAcceptOffer(gigId);
      handleModalClose();
    }
  };

  const handleModalDecline = (gigId: string) => {
    // Find the offer and decline it
    const offer = offers.find(o => o.id === gigId);
    if (offer) {
      handleDeclineOffer(gigId);
      handleModalClose();
    }
  };



  return (
    <div className={styles.container}>
      <ScreenHeaderWithBack title="Gig Offers" onBackClick={() => router.back()} />
      {uid && (
        <AiSuggestionBanner
          suggestions={aiSuggestions}
          currentIndex={currentIndex}
          isLoading={isLoadingSuggestions}
          error={suggestionsError}
          dismissed={suggestionsDismissed} // Pass the dismissed state
          onDismiss={dismissSuggestions}
          onRefresh={refreshSuggestions}
          goToNext={goToNext}
          goToPrev={goToPrev}
          userId={uid}
        />
      )}
      <div className={styles.pageWrapper}>
        {offers.filter((o) => o.status !== "expired").length > 0 && (
          <div className={styles.pageHeader}>
            <h1 className={styles.sectionTitle}>Pending Gigs</h1>
            <button
              onClick={() => router.push(`/user/${pageUserId}/worker/calendar`)}
              className={styles.calendarNavButton}
              title="View Calendar"
          >
            <Calendar size={24} />
            <span>Calendar</span>
          </button>
        </div>
        )}
        {isLoadingData ? ( // Use renamed loading state
          <div className={styles.loadingContainer}>
            <div className={styles.loadingContent}>
              <Loader2 className={styles.loadingSpinner} size={32} />
              <p className={styles.loadingText}>Loading offers...</p>
            </div>
          </div> // Use styles
        ) : error ? (
          <div className={styles.emptyState}>{error}</div> // Use styles
        ) : offers.filter(
            (o) =>
              o.status !==
              "expired" /* && timeLeft !== "Expired" Re-check expiry with timeLeft state */
          ).length === 0 && acceptedGigs.length === 0 ? ( // Check both lists
          <div className={styles.emptyState}>
            {" "}
            {/* Use styles */}
            <Inbox
              size={48}
              style={{ marginBottom: "1rem", color: "#525252" }}
            />
            No new gig offers or upcoming accepted gigs available right now.
            Make sure your Gigfolio and availability are up to date!
          </div>
        ) : (
          <div className={styles.offerList}>
            {" "}
            {/* Use styles */}
            {/* Pending Offers Section */}
            {offers.filter((o) => o.status !== "expired").length > 0 && (
              <div className={styles.offersSection}>
                {" "}
                {/* New div for offers section */}
                {offers
                  .filter((o) => o.status !== "expired")
                  .map((offer) => (
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
                  ))}
              </div>
            )}
            {/* Accepted Upcoming Gigs Section */}
            {acceptedGigs.length > 0 && (
              <div className={styles.acceptedSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    Accepted Upcoming Gigs
                  </h2>{" "}
                  {/* Title for accepted */}
                  <Link href={`/user/${pageUserId}/worker/calendar`} passHref>
                    <Calendar size={24} color="#ffffff" />
                  </Link>
                </div>
                {acceptedGigs.map((gig) => (
                  <AcceptedGigCard // Use the new component
                    key={gig.id}
                    gig={gig} // Pass the gig data
                    onViewDetails={handleViewDetails} // Only view details for accepted
                    // Removed onAccept and onDecline as they are not needed here
                  />
                ))}
              </div>
            )}
          </div>
        )}
        <footer className={styles.footer}>
          {" "}
          {/* Use styles */}
          <Link href={`/user/${pageUserId}/worker`} passHref>
            {" "}
            {/* Use user?.uid */}
            <button
              className={styles.homeButton}
              aria-label="Go to Home"
              onClick={handleGoToHome}
            >
              {" "}
              {/* Use styles */}
              <Image src="/images/home.svg" alt="Home" width={40} height={40} />
            </button>
          </Link>
        </footer>
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
