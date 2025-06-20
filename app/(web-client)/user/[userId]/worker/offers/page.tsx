"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

import GigOfferCard from "@/app/components/shared/GigOfferCard"; // Assuming shared location
import AcceptedGigCard from "@/app/components/shared/AcceptedGigCard"; // Import new component
import AiSuggestionBanner from "@/app/components/shared/AiSuggestionBanner";
import { Loader2, Inbox, Calendar } from "lucide-react";
import styles from "./OffersPage.module.css"; // Import styles
import Logo from "@/app/components/brand/Logo";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { getLastRoleUsed } from "@/lib/last-role-used";
import { useAiSuggestionBanner } from "@/hooks/useAiSuggestionBanner";

interface GigOffer {
  id: string;
  role: string;
  buyerName: string;
  locationSnippet: string;
  dateString: string;
  timeString: string;
  hourlyRate: number;
  estimatedHours?: number;
  totalPay?: number;
  tipsExpected?: boolean;
  expiresAt?: string; // ISO string for countdown
  status?: "pending" | "expired" | "accepted" | string; // Added 'accepted' status
  fullDescriptionLink?: string; // For view details
}

// Mock function to fetch data - returns both offers and accepted gigs
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
  await new Promise((resolve) => setTimeout(resolve, 700));

  const mockOffers: GigOffer[] = [
    {
      id: "gig456-inprogress",
      role: "Bartender",
      buyerName: "Central Park Bar",
      locationSnippet: "Central Park, Beaumont Place",
      dateString: "14/07/25",
      timeString: "3:00 PM - 7:00 PM",
      hourlyRate: 20,
      totalPay: 80,
      tipsExpected: true,
      expiresAt: new Date(Date.now() + 1000 * 60 * 34).toISOString(),
      status: "pending",
      fullDescriptionLink: "/gigs/offer1-details",
    },
    {
      id: "offer2",
      role: "Waiter",
      buyerName: "Downtown Soho",
      locationSnippet: "Downtown, Soho",
      dateString: "15/07/25",
      timeString: "5:00 PM - 7:00 PM",
      hourlyRate: 15,
      totalPay: 30,
      expiresAt: new Date(Date.now() + 1000 * 87).toISOString(),
      status: "pending",
    },
    // Add more pending offers if needed
  ].sort((a, b) =>
    a.expiresAt && b.expiresAt
      ? new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
      : a.expiresAt
      ? -1
      : 1
  ); // Sort by soonest to expire

  const mockAcceptedGigs: GigOffer[] = [
    {
      id: "gig123-accepted",
      role: "Security Guard",
      buyerName: "Event X",
      locationSnippet: "Event Hall, City Center",
      dateString: "20/07/25",
      timeString: "8:00 PM - 11:00 PM",
      hourlyRate: 25,
      estimatedHours: 3,
      status: "accepted",
    },
    {
      id: "accepted2",
      role: "Usher",
      buyerName: "Concert Y",
      locationSnippet: "Arena, Suburb",
      dateString: "21/07/25",
      timeString: "7:00 PM - 10:00 PM",
      hourlyRate: 18,
      estimatedHours: 3,
      status: "accepted",
    },
    // Add more accepted gigs if needed
  ].sort(
    (a, b) =>
      new Date(a.dateString + " " + a.timeString.split(" - ")[0]).getTime() -
      new Date(b.dateString + " " + b.timeString.split(" - ")[0]).getTime()
  ); // Sort accepted by date/time

  return { offers: mockOffers, acceptedGigs: mockAcceptedGigs };
}

export default function WorkerOffersPage() {
  const router = useRouter();
  const params = useParams();
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
    // Ensure user is authenticated, authorized for this page, and has necessary roles before fetching
    if (
      !loadingAuth &&
      user &&
      authUserId === pageUserId &&
      (lastRoleUsed === "GIG_WORKER" || user?.claims.role === "QA")
    ) {
      setIsLoadingData(true);
      fetchWorkerData(pageUserId)
        .then((data) => {
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
    } else if (
      !loadingAuth &&
      user &&
      authUserId === pageUserId &&
      !(user?.claims.role === "GIG_WORKER" || user?.claims.role === "QA")
    ) {
      // If user is auth'd for page, but no role, don't attempt fetch, auth useEffect handles redirect
      setIsLoadingData(false);
      setOffers([]);
      setAcceptedGigs([]);
      setError(
        "Access denied: You do not have the required role to view offers."
      ); // Optional: set an error message
    } else if (!loadingAuth && (!user || authUserId !== pageUserId)) {
      // If not authenticated or not authorized for this page, ensure loading is false and data is clear
      setIsLoadingData(false);
      setOffers([]);
      setAcceptedGigs([]);
      // Error message or redirect is handled by the primary auth useEffect
    }
  }, [user, loadingAuth, authUserId, pageUserId, lastRoleUsed]);

  const handleAcceptOffer = async (
    e: React.MouseEvent<HTMLButtonElement>,
    offerId: string
  ) => {
    e.stopPropagation();
    setProcessingOfferId(offerId);
    setProcessingAction("accept");
    console.log("Accepting offer:", offerId);
    // TODO: API call to POST /api/gigs/offers/{offerId}/accept
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API
      // On success from API:
      setOffers((prev) => prev.filter((o) => o.id !== offerId)); // Remove from list
      // Show success toast/message: "Offer accepted! Added to your calendar."
      // router.push(`/user/${authUserId}/worker/gigs/${acceptedGigId}`); // Navigate to accepted gig details
    } catch (err) {
      console.error("Error accepting offer:", err);
      // Show error toast/message
    } finally {
      setProcessingOfferId(null);
      setProcessingAction(null);
    }
  };

  const handleDeclineOffer = async (
    e: React.MouseEvent<HTMLButtonElement>,
    offerId: string
  ) => {
    e.stopPropagation();
    setProcessingOfferId(offerId);
    setProcessingAction("decline");
    console.log("Declining offer:", offerId);
    // TODO: API call to POST /api/gigs/offers/{offerId}/decline
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API
      // On success from API:
      setOffers((prev) => prev.filter((o) => o.id !== offerId)); // Remove from list
      // Show success toast/message: "Offer declined."
    } catch (err) {
      console.error("Error declining offer:", err);
      // Show error toast/message
    } finally {
      setProcessingOfferId(null);
      setProcessingAction(null);
    }
  };

  const handleViewDetails = (offerId: string) => {
    // const offer = offers.find(o => o.id === offerId);
    router.push(`/user/${pageUserId}/worker/gigs/${offerId}`); // Navigate to offer details page
    // if (offer?.fullDescriptionLink) {
    //   router.push(offer.fullDescriptionLink);
    // } else {
    //   alert("Full details view not available for this offer yet.");
    //   // Or open a modal with more info if data is present in offer object
    // }
  };
  const handleGoToHome = () => {
    router.push(`/user/${pageUserId}/worker`);
  };

  if (!user || (user?.uid && user.uid !== pageUserId)) {
    // Use isLoading and user?.uid
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className="animate-spin" size={32} /> Loading...
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {" "}
      {/* Use styles */}
      <div className={styles.pageWrapper}>
        {" "}
        {/* Use styles */}
        <div className={styles.infoBanner}>
          {" "}
          {/* Use styles */}
          <Logo width={70} height={70} />
          {/* <p>Accept these gigs within the time shown or we will offer them to someone else!</p> */}
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
        </div>
        <h1 className={styles.pageTitle}>Gig Offers</h1>
        {isLoadingData ? ( // Use renamed loading state
          <div className={styles.loadingContainer}>
            <Loader2 className="animate-spin" size={28} /> Loading offers...
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
                      onAccept={handleAcceptOffer}
                      onDecline={handleDeclineOffer}
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
                  <Calendar size={32} color="#ffffff" />
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
              <Image src="/images/home.svg" alt="Home" width={50} height={50} />
            </button>
          </Link>
        </footer>
      </div>
    </div>
  );
}
