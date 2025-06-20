"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
} from "lucide-react";
import styles from "./FeedbackPage.module.css";
import { useAuth } from "@/context/AuthContext";
import Feedback from "@/app/components/gigs/Feedback";

interface GigDataForBuyerFeedback {
  id: string;
  role: string;
  gigTitle: string;
  workerName: string;
  workerAvatarUrl?: string;
  workerId: string;
  date: string;
  hourlyRate: number;
  hoursWorked: number;
  totalPayment: number;
}

interface BuyerFeedbackFormData {
  publicComment: string;
  privateNotes: string;
  wouldHireAgain: "yes" | "no" | "maybe" | "";
}

async function fetchGigForBuyerFeedback(
  buyerUserId: string,
  gigId: string
): Promise<GigDataForBuyerFeedback | null> {
  console.log("Fetching gig for buyer feedback:", buyerUserId, gigId);
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (gigId === "gig123-accepted") {
    return {
      id: gigId,
      role: "Bartender",
      gigTitle: "Weekend Cocktail Service",
      workerName: "Benji Asamoah",
      workerAvatarUrl: "/images/benji.jpeg",
      workerId: "benji-asamoah-id",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      hourlyRate: 25,
      hoursWorked: 8,
      totalPayment: 200,
    };
  }
  return null;
}

export default function BuyerFeedbackPage() {
  const router = useRouter();
  const params = useParams();
  const pageUserId = params.userId as string;
  const gigId = params.gigId as string;

  const { user, loading: loadingAuth } = useAuth();
  const authUserId = user?.uid;

  const [gigData, setGigData] = useState<GigDataForBuyerFeedback | null>(null);
  const [isLoadingGig, setIsLoadingGig] = useState(true);

  const [formData, setFormData] = useState<BuyerFeedbackFormData>({
    publicComment: "",
    privateNotes: "",
    wouldHireAgain: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Fetch data only if user is loaded, authenticated, and authorized (or is QA)
    if (loadingAuth) return;

    const shouldFetch = (user?.claims.role === "QA" && gigId) || 
                        (user && authUserId === pageUserId && gigId);

    if (shouldFetch) {
      setIsLoadingGig(true);
      // Use authUserId which is confirmed to be user.uid if user is authenticated
      fetchGigForBuyerFeedback(authUserId!, gigId) // authUserId will be defined if isAuthenticated is true
        .then((data) => {
          if (data) {
            setGigData(data);
          } else {
            setError(
              "Gig not found, not ready for feedback, or feedback already submitted."
            );
          }
        })
        .catch((err) => {
          console.error(err);
          setError("Could not load gig information for feedback.");
        })
        .finally(() => setIsLoadingGig(false));
    }
  }, [user, loadingAuth, authUserId, pageUserId, gigId]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!formData.wouldHireAgain) {
      setError("Please select if you would hire this worker again.");
      return;
    }
    if (!gigData || !user?.uid) {
      setError("Gig information or user ID is missing.");
      return;
    }

    setIsSubmitting(true);
    const submissionData = {
      gigId,
      buyerId: user.uid,
      workerId: gigData.workerId,
      publicComment: formData.publicComment,
      privateNotes: formData.privateNotes,
      wouldHireAgain: formData.wouldHireAgain || null,
    };
    console.log("Submitting feedback for worker:", submissionData);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccessMessage(
        `Feedback for ${gigData.workerName} submitted successfully!`
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error submitting feedback:", err);
        setError(err.message || "Failed to submit feedback.");

      } else {
        console.error("Unknown error submitting feedback:", err);
        setError("Failed to submit feedback.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingAuth || isLoadingGig) {
    return <div className={styles.loadingContainer}><Loader2 className="animate-spin" size={32} /> Loading...</div>;
  }
  if (
    error &&
    (!gigData || !user || user?.claims.role !== "BUYER") &&
    !successMessage
  ) {
    return (
      <div className={styles.container}>
        <div className={styles.pageWrapper}>
          <header className={styles.header}>
            <button
              onClick={() => router.back()}
              className={styles.backButton}
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className={styles.pageTitle}>Feedback Error</h1>
          </header>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      </div>
    );
  }
  if (!gigData && !successMessage && user && user?.claims.role === "BUYER") {
    return (
      <div className={styles.container}>
        <div className={styles.pageWrapper}>
          <header className={styles.header}>
            <button
              onClick={() => router.back()}
              className={styles.backButton}
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className={styles.pageTitle}>Feedback Not Available</h1>
          </header>
          <p className={styles.emptyState}>
            Gig information not available for feedback.
          </p>
        </div>
      </div>
    );
  }

  return (
    // <div className={styles.container}>
    //   <div className={styles.pageWrapper}>
    //     <header className={styles.header}>
    //       <button
    //         onClick={() => router.back()}
    //         className={styles.backButton}
    //         aria-label="Go back"
    //       >
    //         <ArrowLeft size={24} />
    //       </button>
    //       <h1 className={styles.pageTitle}>Confirm Hours Worked & Feedback</h1>
    //     </header>

    //     {gigData && (
    //       <section className={`${styles.section} ${styles.gigSummarySection}`}>
    //         <div className={styles.gigSummaryCard}>
    //           {gigData.workerAvatarUrl ? (
    //             <Image
    //               src={gigData.workerAvatarUrl}
    //               alt={gigData.workerName}
    //               width={48}
    //               height={48}
    //               className={styles.workerAvatar}
    //             />
    //           ) : (
    //             <UserCircle
    //               size={48}
    //               className={styles.workerAvatar}
    //               style={{ color: "#525252" }}
    //             />
    //           )}
    //           <div className={styles.summaryTextContainer}>
    //             <p>
    //               <strong>Worker:</strong> {gigData.workerName}
    //             </p>
    //             <p>
    //               <strong>Role:</strong> {gigData.role} - {gigData.gigTitle}
    //             </p>
    //             <p>
    //               <strong>Date:</strong>{" "}
    //               {new Date(gigData.date).toLocaleDateString()}
    //             </p>
    //           </div>
    //         </div>
    //       </section>
    //     )}

    //     {gigData && (
    //       <section
    //         className={`${styles.section} ${styles.paymentSectionPlaceholder}`}
    //       >
    //         <h2 className={styles.sectionTitle}>
    //           <Info size={18} />
    //           Payment Details
    //         </h2>
    //         <div className={styles.paymentDetailsContent}>
    //           <p>
    //             <strong>Hourly Rate:</strong> ${gigData.hourlyRate.toFixed(2)}
    //           </p>
    //           <p>
    //             <strong>Hours Worked:</strong> {gigData.hoursWorked} hours
    //           </p>
    //           <p>
    //             <strong>Total Payment:</strong> $
    //             {gigData.totalPayment.toFixed(2)}
    //           </p>
    //         </div>
    //       </section>
    //     )}

    //     {successMessage && (
    //       <p className={styles.successMessage}>
    //         <CheckCircle size={20} /> {successMessage}
    //       </p>
    //     )}
    //     {error && !successMessage && (
    //       <p className={styles.errorMessage}>
    //         <XCircle size={20} /> {error}
    //       </p>
    //     )}

    //     {!successMessage && gigData && (
    //       <form onSubmit={handleSubmit} className={styles.feedbackForm}>
    //         <div className={styles.stepperContainer}>
    //           <div className={styles.stepItem}>
    //             <div className={styles.stepIndicator}>1</div>
    //             <div className={styles.stepContent}>
    //               <div className={styles.inputGroup}>
    //                 <label htmlFor="publicComment" className={styles.label}>
    //                   Public Comment (visible on{" "}
    //                   {gigData.workerName.split(" ")[0]}&apos;s profile):
    //                 </label>
    //                 <textarea
    //                   id="publicComment"
    //                   name="publicComment"
    //                   value={formData.publicComment}
    //                   onChange={handleChange}
    //                   rows={5}
    //                   placeholder="e.g., Punctual, professional, great skills..."
    //                   className={styles.input}
    //                 />
    //               </div>
    //             </div>
    //           </div>

    //           <div className={styles.stepItem}>
    //             <div className={styles.stepIndicator}>2</div>
    //             <div className={styles.stepContent}>
    //               <div className={styles.inputGroup}>
    //                 <label htmlFor="privateNotes" className={styles.label}>
    //                   Private Notes for Able AI (optional):
    //                 </label>
    //                 <textarea
    //                   id="privateNotes"
    //                   name="privateNotes"
    //                   value={formData.privateNotes}
    //                   onChange={handleChange}
    //                   rows={4}
    //                   placeholder="Any internal notes about this worker or gig?"
    //                   className={styles.input}
    //                 />
    //               </div>
    //             </div>
    //           </div>

    //           <div className={styles.stepItem}>
    //             <div className={styles.stepIndicator}>3</div>
    //             <div className={styles.stepContent}>
    //               <div className={styles.inputGroup}>
    //                 <label className={styles.label}>
    //                   Would you hire {gigData.workerName.split(" ")[0]} again?{" "}
    //                   <span style={{ color: "var(--primary-accent-color)" }}>
    //                     *
    //                   </span>
    //                 </label>
    //                 <div className={styles.hireAgainOptions}>
    //                   <input
    //                     type="radio"
    //                     id="hireYes"
    //                     name="wouldHireAgain"
    //                     value="yes"
    //                     checked={formData.wouldHireAgain === "yes"}
    //                     onChange={handleChange}
    //                   />
    //                   <label
    //                     htmlFor="hireYes"
    //                     className={`${styles.hireAgainOptionLabel} ${
    //                       formData.wouldHireAgain === "yes"
    //                         ? styles.hireAgainOptionLabelChecked
    //                         : ""
    //                     }`}
    //                   >
    //                     Yes, definitely!
    //                   </label>

    //                   <input
    //                     type="radio"
    //                     id="hireMaybe"
    //                     name="wouldHireAgain"
    //                     value="maybe"
    //                     checked={formData.wouldHireAgain === "maybe"}
    //                     onChange={handleChange}
    //                   />
    //                   <label
    //                     htmlFor="hireMaybe"
    //                     className={`${styles.hireAgainOptionLabel} ${
    //                       formData.wouldHireAgain === "maybe"
    //                         ? styles.hireAgainOptionLabelChecked
    //                         : ""
    //                     }`}
    //                   >
    //                     Maybe
    //                   </label>

    //                   <input
    //                     type="radio"
    //                     id="hireNo"
    //                     name="wouldHireAgain"
    //                     value="no"
    //                     checked={formData.wouldHireAgain === "no"}
    //                     onChange={handleChange}
    //                   />
    //                   <label
    //                     htmlFor="hireNo"
    //                     className={`${styles.hireAgainOptionLabel} ${
    //                       formData.wouldHireAgain === "no"
    //                         ? styles.hireAgainOptionLabelChecked
    //                         : ""
    //                     }`}
    //                   >
    //                     No
    //                   </label>
    //                 </div>
    //               </div>
    //             </div>
    //           </div>

    //           <div className={styles.stepItem}>
    //             <div className={styles.stepIndicator}>4</div>
    //             <div className={styles.stepContent}>
    //               <div className={styles.submitButtonContainer}>
    //                 <button
    //                   type="submit"
    //                   className={styles.submitButton}
    //                   disabled={isSubmitting || !formData.wouldHireAgain}
    //                 >
    //                   {isSubmitting ? (
    //                     <Loader2 className="animate-spin" size={20} />
    //                   ) : (
    //                     <Send size={18} />
    //                   )}
    //                   {isSubmitting ? "Submitting..." : "Submit Feedback"}
    //                 </button>
    //               </div>
    //             </div>
    //           </div>
    //         </div>
    //       </form>
    //     )}
    //   </div>
    // </div>
    <Feedback />
  );
}
