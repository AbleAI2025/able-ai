"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/app/context/UserContext";
import { useParams } from "next/navigation"; // Added useParams
import GigDetailsComponent from "@/app/components/gigs/GigDetails";
import type GigDetails from "@/app/types/GigDetailsTypes"; // Assuming you have this type defined


const stepLabels = [
  "Gig accepted",
  "Benji has started the gig",
  "Mark as complete, pay Benji",
  "Gigee Paid",
];

async function fetchBuyerGigDetails(userId: string, gigId: string): Promise<GigDetails | null> {
  console.log("Fetching gig details for worker:", userId, "gig:", gigId);
  // API call: GET /api/gigs/worker/${gigId} (ensure backend auth checks worker owns this gig)
  // Or: GET /api/gigs/${gigId} and then verify workerId matches on client
  await new Promise(resolve => setTimeout(resolve, 700));

  // Example Data (should match the actual GigDetails interface)
  if (gigId === "gig123-accepted") {
    return {
      id: "gig123-accepted", 
      role: "Lead Bartender", 
      gigTitle: "Corporate Mixer Event",
      buyerName: "Innovate Solutions Ltd.", buyerAvatarUrl: "/images/logo-placeholder.svg",
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // In 2 days
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).setHours(18,0,0,0).toString(),
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).setHours(23,0,0,0).toString(),
      location: "123 Business Rd, Tech Park, London, EC1A 1BB",
      hourlyRate: 25, estimatedEarnings: 125,
      specialInstructions: "Focus on high-quality cocktails. Dress code: smart black. Setup starts 30 mins prior. Contact person on site: Jane (07xxxxxxxxx).",
      status: "IN_PROGRESS", // Initially pending
      hiringManager: "Jane Smith",
      hiringManagerUsername: "@janesmith",
      isBuyerSubmittedFeedback: false,
      isWorkerSubmittedFeedback: true,
    };
  }
  if (gigId === "gig456-inprogress") {
     return {
      id: "gig456-inprogress", 
      role: "Event Server", 
      gigTitle: "Wedding Reception",
      buyerName: "Alice & Bob",
      date: new Date().toISOString(), // Today
      startTime: new Date(new Date().setHours(16, 0, 0, 0)).toISOString(),
      endTime: new Date(new Date().setHours(22, 0, 0, 0)).toISOString(),
      location: "The Manor House, Countryside Lane, GU21 5ZZ",
      hourlyRate: 18, estimatedEarnings: 108,
      specialInstructions: "Silver service required. Liaise with the event coordinator Sarah upon arrival.",
      status: "IN_PROGRESS", // Initially completed
      hiringManager: "Sarah Johnson",
      hiringManagerUsername: "@sarahjohnson",
      isBuyerSubmittedFeedback: false,
      isWorkerSubmittedFeedback: true,
    };
  }
  return null; // Or throw an error
}


export default function BuyerGigDetailsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const pageUserId = params.userId as string;

  const { user, loading: loadingAuth, updateUserContext } = useUser(); 
  const authUserId = user?.uid;

  const gigId = params.gigId as string;
  const [isLoadingGig, setIsLoadingGig] = useState(false);
  const [gig, setGig] = useState<GigDetails | null>(null);

  useEffect(() => {
    if (loadingAuth) {
      return; // Wait for user context to load
    }

    // if (!user?.isAuthenticated) {
    //   router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
    //   return;
    // }

    // if (!authUserId) {
    //   console.error("User is authenticated but UID is missing. Redirecting to signin.");
    //   router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
    //   return;
    // }

    // // Authorization check: Ensure the authenticated user is accessing their own data
    // if (authUserId !== pageUserId) {
    //   console.warn(`Authorization Mismatch: Authenticated user ${authUserId} attempting to access page for ${pageUserId}. Redirecting.`);
    //   router.push("/signin?error=unauthorized");
    //   return;
    // }

    // Role check and context update
    if (user?.canBeBuyer || user?.isQA) { // Assuming QA users might also access buyer pages
      updateUserContext({
        lastRoleUsed: "BUYER",
        lastViewVisited: pathname,
      }).catch(err => {
        console.error("Failed to update user context with last visit/role:", err);
        // Non-critical error
      });
    } else {
      console.warn(`Role Mismatch: User ${authUserId} is not a Buyer or QA. Redirecting.`);
      // router.push("/select-role");
    }
  }, [user, loadingAuth, authUserId, pageUserId, router, pathname, updateUserContext]);

  useEffect(() => {
    if (loadingAuth) return; // Wait for auth state to be clear

    const shouldFetch = (user?.isQA && pageUserId && gigId) || 
                        (user?.isAuthenticated && authUserId === pageUserId && gigId);

    if (shouldFetch) {
      setIsLoadingGig(true);
      fetchBuyerGigDetails(pageUserId, gigId) // pageUserId is correct here (worker's ID from URL)
        .then(data => {
          if (data) {
            setGig(data);
            setIsLoadingGig(false);
            console.log("Gig details fetched successfully:", data);
          }
        })

    }
  }, [loadingAuth, user, authUserId, pageUserId, gigId, setIsLoadingGig]);

  if (isLoadingGig || !gig) {
    return <div>Loading gig details...</div>;
  }

  
  return (
    // <div className={styles.container}>
    //   {/* Header */}
    //   <header className={styles.header}>
    //     <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    //       <Logo width={50} height={50} />
    //       <h1 className={styles.pageTitle}>{gig.title}</h1>
    //     </div>
    //     <button className={styles.chatButton} aria-label="Chat">
    //       <MessageSquare size={40} className={styles.icon} fill="#ffffff"/>
    //     </button>
    //   </header>

    //   {/* Gig Details Card */}
    //   <section className={styles.gigDetailsSection}>
    //     <div className={styles.gigDetailsHeader}>
    //        <h2 className={styles.sectionTitle}>Gig Details</h2>
    //        <Calendar size={26} color='#ffffff'/>
    //     </div>
    //     <div className={styles.gigDetailsRow}>
    //       <span className={styles.label}>Location:</span>
    //       <span className={styles.detailValue}>{gig.location}</span>
    //     </div>
    //     <div className={styles.gigDetailsRow}>
    //       <span className={styles.label}>Date:</span>
    //       <span className={styles.detailValue}>
    //         {new Date(gig.date).toLocaleDateString(undefined, {
    //           weekday: "long",
    //           year: "numeric",
    //           month: "long",
    //           day: "numeric",
    //         })}
    //       </span>
    //     </div>
    //     <div className={styles.gigDetailsRow}>
    //       <span className={styles.label}>Time:</span>
    //       <span className={styles.detailValue}>
    //         {gig.startTime} PM - {gig.endTime} AM
    //       </span>
    //     </div>
    //     <div className={styles.gigDetailsRow}>
    //       <span className={styles.label}>Pay per hour:</span>
    //       <span className={styles.detailValue}>£{gig.hourlyRate}</span>
    //     </div>
    //     <div className={styles.gigDetailsRow}>
    //       <span className={styles.label}>Total cost:</span>
    //       <span className={styles.detailValue}>
    //         incl Able fees +VAT and Stripe fees:{" "}
    //         <b>£{gig.totalCost.toFixed(2)}</b>
    //       </span>
    //     </div>
    //   </section>

    //   {/* Worker Card */}
    //   <section
    //     className={`${styles.gigDetailsSection} ${pageStyles.workerSection}`}
    //   >
    //     <Image
    //       src={worker.avatarUrl}
    //       className={pageStyles.workerAvatar}
    //       alt={worker.name}
    //       width={56}
    //       height={56}
    //     />
    //     <div className={pageStyles.workerDetailsContainer}>
    //       <div className={pageStyles.workerDetails}>
    //         <span className={pageStyles.workerName}>
    //           {worker.name}
    //         </span>
    //          {worker.gigs} Able gigs, {worker.experience} years experience
    //       </div>
    //       {worker.isStar && <Image src="/images/star.svg" alt="Star" width={56} height={50} />}
    //     </div>
    //   </section>

    //   {/* Special Instructions */}
    //   <section className={styles.instructionsSection}>
    //     <h2 className={styles.sectionTitle}>
    //       <Info size={18} />
    //       Special Instructions
    //     </h2>
    //     <p className={styles.specialInstructions}>{gig.specialInstructions}</p>
    //   </section>

    //   {/* Stepper/Status */}
    //   <section style={{ margin: "24px 0" }}>
    //     <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
    //       {stepLabels.map((label, idx) => (
    //         <li
    //           key={label}
    //           style={{
    //             background: gig.status === idx + 1 ? "#5dade2" : "#23272b",
    //             color: gig.status === idx + 1 ? "#fff" : "#c2c2c2",
    //             borderRadius: 24,
    //             padding: "12px 0",
    //             marginBottom: 8,
    //             textAlign: "center",
    //             fontWeight: 600,
    //             fontSize: 16,
    //             border:
    //               gig.status === idx + 1
    //                 ? "2px solid #5dade2"
    //                 : "1px solid #23272b",
    //             transition: "all 0.2s",
    //           }}
    //         >
    //           <span style={{ marginRight: 8, fontWeight: 700 }}>{idx + 1}</span>{" "}
    //           {label}
    //         </li>
    //       ))}
    //     </ol>
    //   </section>

    //   {/* Action Buttons */}
    //   <section className={styles.actionSection}>
    //     <button className={styles.negotiationButton} disabled>
    //       Cancel, amend gig timing or add tips
    //     </button>
    //     <div className={styles.secondaryActionsSection}>
    //       <Link
    //         href="/terms-of-service"
    //         target="_blank"
    //         rel="noopener noreferrer"
    //         className={styles.secondaryActionButton}
    //       >
    //         <FileText size={16} style={{ marginRight: "8px" }} />
    //         Terms of Agreement
    //       </Link>
    //       <button className={styles.secondaryActionButton}>
    //         <AlertCircle size={16} style={{ marginRight: "8px" }} />
    //         Report an issue
    //       </button>
    //     </div>
    //   </section>
    // </div>
    <GigDetailsComponent gig={gig} setGig={setGig} />
  );
}
