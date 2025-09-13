/* eslint-disable max-lines-per-function */
import { Calendar, Check, Info } from "lucide-react";
import styles from "./GigDetails.module.css";
import { useRouter } from "next/navigation";
import GigActionButton from "../shared/GigActionButton";
import Link from "next/link";
import { useState } from "react";
import type GigDetails from "@/app/types/GigDetailsTypes";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { getLastRoleUsed } from "@/lib/last-role-used";
import { updateGigOfferStatus } from "@/actions/gigs/update-gig-offer-status";
import { deleteGig } from "@/actions/gigs/delete-gig";
import { toast } from "sonner";
import ScreenHeaderWithBack from "../layout/ScreenHeaderWithBack";
import GigStatusIndicator from "../shared/GigStatusIndicator";
import ProfileVideo from "../profile/WorkerProfileVideo";

const formatGigDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
const formatGigTime = (isoTime: string) =>
  new Date(isoTime).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
const calculateDuration = (startIso: string, endIso: string): string => {
  const startDate = new Date(startIso);
  const endDate = new Date(endIso);
  const diffMs = endDate.getTime() - startDate.getTime();
  if (diffMs <= 0) return "N/A";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  let durationStr = "";
  if (hours > 0) durationStr += `${hours} hour${hours > 1 ? "s" : ""}`;
  if (minutes > 0) durationStr += ` ${minutes} minute${minutes > 1 ? "s" : ""}`;
  return durationStr.trim() || "N/A";
};

interface GigDetailsProps {
  userId: string;
  role: "buyer" | "worker";
  gig: GigDetails;
  setGig: (gig: GigDetails) => void; // Function to update gig state
  isAvailableOffer?: boolean; // Whether this gig is an available offer for workers
  isCheckingOffer?: boolean; // Whether we're checking if this is an offer
}

export type GigAction =
  | "accept"
  | "start"
  | "complete"
  | "requestAmendment"
  | "reportIssue"
  | "delegate"
  | "awaiting"
  | "confirmed"
  | "requested"
  | "delete"
  | "decline"
  | "paid";

const GigDetailsComponent = ({
  userId,
  role,
  gig,
  setGig,
}: GigDetailsProps) => {
  const router = useRouter();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { user } = useAuth();
  const lastRoleUsed = getLastRoleUsed();

  // Get worker name from gig data if available, otherwise use a placeholder
  const getWorkerName = () => {
    // If this is a worker viewing their own gig, use their name
    if (lastRoleUsed === "GIG_WORKER" && role === "worker") {
      return user?.displayName?.split(" ")[0] || "Worker";
    }
    // If there's a worker assigned to the gig, use their name
    if (gig.workerName) {
      return gig.workerName.split(" ")[0];
    }
    // Fallback for when no worker is assigned yet
    return "Worker";
  };

  const workerName = getWorkerName();

  // Get worker stats with fallbacks
  const getWorkerStats = () => {
    return {
      gigs: gig.workerGigs || 0,
      experience: gig.workerExperience || 0,
      isStar: gig.isWorkerStar || false,
    };
  };

  const workerStats = getWorkerStats();

  const gigDuration = calculateDuration(gig.startTime, gig.endTime);
  const buyer = gig.buyerName.split(" ")[0];

  const getButtonLabel = (action: string) => {
    const status = gig.status;

    switch (action) {
      case "accept":
        if (status === "PENDING") {
          return lastRoleUsed === "GIG_WORKER"
            ? "Accept Gig"
            : "Offer Sent - awaiting acceptance";
        }
        return "Gig Accepted";

      case "start":
        if (status === "PENDING" || status === "ACCEPTED") {
          return lastRoleUsed === "GIG_WORKER"
            ? "Mark as you started the gig"
            : "Mark as started";
        }
        return lastRoleUsed === "GIG_WORKER"
          ? "Gig Started"
          : `${workerName} has started the gig`;
      case "complete":
        if (
          status === "PENDING" ||
          status === "ACCEPTED" ||
          status === "IN_PROGRESS"
        ) {
          return lastRoleUsed === "GIG_WORKER"
            ? "Mark as complete"
            : `Mark as complete, pay ${workerName}`;
        } else {
          // If the gig is completed, show the appropriate message
          if (gig.isWorkerSubmittedFeedback && !gig.isBuyerSubmittedFeedback) {
            return lastRoleUsed === "GIG_WORKER"
              ? "Gig Completed"
              : `🕒Confirm, pay and review ${workerName}`;
          } else if (
            gig.isBuyerSubmittedFeedback &&
            !gig.isWorkerSubmittedFeedback
          ) {
            return lastRoleUsed === "GIG_WORKER"
              ? "Buyer confirmed & paid: leave feedback"
              : `${workerName} has completed the gig`;
          } else {
            return lastRoleUsed === "GIG_WORKER"
              ? "Gig Completed"
              : `${workerName} has completed the gig`;
          }
        }
      case "awaiting":
        if (lastRoleUsed === "GIG_WORKER") {
          return !gig.isBuyerSubmittedFeedback ? (
            `Waiting for ${buyer} to confirm and pay`
          ) : (
            <span className={styles.awaitingText}>
              <Check color="#000000" /> {buyer} Paid £{gig.estimatedEarnings}
            </span>
          );
        }
        return gig.isBuyerSubmittedFeedback ? (
          <span className={styles.awaitingText}>
            <Check color="#000000" /> Paid £{gig.estimatedEarnings}
          </span>
        ) : (
          "Pay"
        );
      default:
        return "";
    }
  };

  const handleGigAction = async (action: GigAction) => {
    setIsActionLoading(true);
    try {
      if (!gig) throw new Error("gig data is required");

      switch (action) {
        case "accept":
          if (lastRoleUsed === "GIG_WORKER") {
            setGig({ ...gig, status: "ACCEPTED" });
            await updateGigOfferStatus({
              gigId: gig.id,
              userId,
              role,
              action: "accept",
            });
            toast.success("Gig accepted successfully!");
          }
          break;

        case "start":
          setGig({ ...gig, status: "IN_PROGRESS" });
          await updateGigOfferStatus({
            gigId: gig.id,
            userId,
            role,
            action: "start",
          });
          toast.success("Gig started successfully!");
          break;

        case "complete":
          setGig({ ...gig, status: "COMPLETED" });
          await updateGigOfferStatus({
            gigId: gig.id,
            userId,
            role,
            action: "complete",
          });
          toast.success("Gig completed successfully!");
          router.push(
            lastRoleUsed === "GIG_WORKER"
              ? `/user/${user?.uid}/worker/gigs/${gig.id}/feedback`
              : `/user/${user?.uid}/buyer/gigs/${gig.id}/feedback`
          );
          break;

        case "confirmed":
          setGig({ ...gig, status: "CONFIRMED" });
          toast.success("Gig confirmed successfully!");
          break;

        case "requestAmendment":
          router.push(`/user/${userId}/worker/gigs/${gig.id}/amend/new`);
          break;

        case "reportIssue":
          router.push(`/gigs/${gig.id}/report-issue`);
          break;

        case "delegate":
          router.push(`/gigs/${gig.id}/delegate`);
          break;

        case "delete":
          await deleteGig({ gigId: gig.id, userId });
          toast.success("Gig deleted successfully!");
          router.push(`/user/${user?.uid}/buyer`);
          break;

        case "paid":
          toast.success("Payment confirmed!");
          // extra logic goes here
          break;

        default:
          console.warn(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error("Error performing gig action:", error);
      toast.error("Failed to perform action. Please try again.");
    } finally {
      setIsActionLoading(false);
    }
  };

  /**
 // Handler for negotiating gig details
   const handleNegotiateGig = () => {
    if (!user?.uid || !gig.id) return;

    // Navigate to the amend page - need to get the current user's profile ID
    const currentUserId = userId; // This should be the worker's profile ID from props
    router.push(`/user/${currentUserId}/worker/gigs/${gig.id}/amend`);
  
    };
    

  // Handler for reporting an issue
  const handleReportIssue = () => {
    if (!user?.uid || !gig.id) return;

    // Navigate to the report issue page
    const currentUserId = userId; // This should be the worker's profile ID from props
    router.push(`/user/${currentUserId}/worker/gigs/${gig.id}/report-issue`);
  };

  // Handler for delegating gig
  const handleDelegateGig = () => {
    if (!user?.uid || !gig.id) return;

    // Navigate to the delegate gig page
    const currentUserId = userId; // This should be the worker's profile ID from props
    router.push(`/user/${currentUserId}/worker/gigs/${gig.id}/delegate`);
  };

  // Handler for viewing terms of agreement
  const handleViewTerms = () => {
    // Navigate to the existing terms page
    router.push("/legal/terms");
  };

 */


  return (
    <div className={styles.container}>
      <ScreenHeaderWithBack
        title={`${gig.role} Gig`}
      />

      {/* Core Gig Info Section - Adapted to new structure */}
      <main className={styles.gigDetailsMain}>
        <section className={styles.gigDetailsSection}>
          <div className={styles.gigDetailsHeader}>
            <h2 className={styles.sectionTitle}>Gig Details</h2>
            <Calendar size={26} color="#ffffff" />
          </div>
          <div className={styles.gigDetailsRow}>
            <span className={styles.label}>Location:</span>
            <span className={styles.detailValue}>
              {gig?.location?.formatted_address}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${gig?.location?.lat},${gig?.location?.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginLeft: "0.5rem" }}
              >
                (View Map)
              </a>
            </span>
          </div>
          <div className={styles.gigDetailsRow}>
            <span className={styles.label}>Date:</span>
            <span className={styles.detailValue}>
              {formatGigDate(gig.date)}
            </span>
          </div>
          <div className={styles.gigDetailsRow}>
            <span className={styles.label}>Time:</span>
            <span className={styles.detailValue}>
              {formatGigTime(gig.startTime)} - {formatGigTime(gig.endTime)} (
              {gigDuration})
            </span>
          </div>
          <div className={styles.gigDetailsRow}>
            <span className={styles.label}>Pay per hour:</span>
            <span className={styles.detailValue}>
              £{gig.hourlyRate.toFixed(2)}/hr
            </span>
          </div>
          <div className={styles.gigDetailsRow}>
            <span className={styles.label}>Total pay:</span>
            <span className={styles.detailValue}>
              £{gig.estimatedEarnings.toFixed(2)} + tips
            </span>
          </div>
          {/* Hiring Manager Info - Placeholder as it's not in current GigDetails interface */}

          {lastRoleUsed === "GIG_WORKER" && (
            <div className={styles.gigDetailsRow}>
              <span className={styles.label}>Hiring manager:</span>
              <span className={styles.detailValue}>
                {gig.hiringManager} <br /> {gig.hiringManagerUsername}
              </span>
            </div>
          )}
        </section>

        {lastRoleUsed === "GIG_WORKER" && (
          <section
            className={`${styles.gigDetailsSection} ${styles.workerSection}`}
          >
            <ProfileVideo
              isSelfView={false}
              onVideoUpload={() => {}}
              videoUrl={gig.workerViderUrl}
            />
            <div className={styles.workerDetailsContainer}>
              <div className={styles.workerDetails}>
                <span className={styles.workerName}>
                  {gig.worker?.fullName || "Worker"}
                </span>
                {workerStats?.gigs && workerStats?.experience
                  ? `${workerStats.gigs} Able gigs, ${workerStats.experience} years experience`
                  : gig?.workerFullBio}
              </div>
              {workerStats.isStar && (
                <Image
                  src="/images/star.svg"
                  alt="Star"
                  width={56}
                  height={50}
                />
              )}
            </div>
          </section>
        )}

        {/* Negotiation Button - Kept from new structure */}
        {/* Added a check to only show if gig is accepted */}
        {(gig.status === "PENDING" ||
          gig.status === "IN_PROGRESS" ||
          gig.status === "ACCEPTED") && (
          <button
            className={styles.negotiationButton}
            onClick={() => handleGigAction("requestAmendment")}
          >
            Negotiate, cancel or change gig details
          </button>
        )}

        {/* Special Instructions Section */}
        {gig.specialInstructions && (
          <section className={styles.instructionsSection}>
            <h2 className={styles.specialInstTitle}>
              <Info size={18} />
              Special Instructions
            </h2>
            <p className={styles.specialInstructions}>
              {gig.specialInstructions}
            </p>
          </section>
        )}

        {/* Primary Actions Section - Adapted to new structure */}
        <section className={styles.actionSection}>
          <GigActionButton
            label={getButtonLabel("accept")}
            handleGigAction={() => handleGigAction("accept")}
            isActive={gig.status === "PENDING"}
            isDisabled={lastRoleUsed === "BUYER" || gig.status !== "PENDING"}
          />

          {/* 2. Start Gig */}
          <GigActionButton
            label={getButtonLabel("start")}
            handleGigAction={() => handleGigAction("start")}
            isActive={gig.status === "ACCEPTED"}
            isDisabled={gig.status !== "ACCEPTED"}
          />

          {/* 3. Complete Gig */}
          <GigActionButton
            label={getButtonLabel("complete")}
            handleGigAction={() => handleGigAction("complete")}
            isActive={
              (gig.status === "IN_PROGRESS" ||
                gig.status === "COMPLETED" ||
                gig.status === "CONFIRMED" ||
                gig.status === "AWAITING_BUYER_CONFIRMATION") &&
              ((lastRoleUsed === "GIG_WORKER" &&
                !gig.isWorkerSubmittedFeedback) ||
                (lastRoleUsed === "BUYER" && !gig.isBuyerSubmittedFeedback))
            }
            isDisabled={
              (lastRoleUsed === "GIG_WORKER" &&
                gig.isWorkerSubmittedFeedback) ||
              (lastRoleUsed === "BUYER" && gig.isBuyerSubmittedFeedback)
            }
          />

          {/* 4. Awaiting Buyer Confirmation */}

          <GigStatusIndicator
            label={getButtonLabel("awaiting")}
            isActive={
              (lastRoleUsed === "GIG_WORKER" &&
                gig.isWorkerSubmittedFeedback) ||
              (lastRoleUsed === "BUYER" && gig.isBuyerSubmittedFeedback)
            }
            isDisabled={true}
          />
        </section>

        {/* Secondary Actions Section - Adapted to new structure */}
        <section className={`${styles.secondaryActionsSection}`}>
          {" "}
          {/* Using secondaryActionsSection class */}
          <Link
            href="/terms-of-service"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondaryActionButton}
          >
            Terms of agreement
          </Link>
          <button
            onClick={() => handleGigAction("reportIssue")}
            className={styles.secondaryActionButton}
            disabled={isActionLoading}
          >
            Report an Issue
          </button>
          <button
            onClick={() => handleGigAction("delegate")}
            className={styles.secondaryActionButton}
            disabled={isActionLoading}
          >
            Delegate gig
          </button>
        </section>
      </main>
    </div>
  );
};

export default GigDetailsComponent;
