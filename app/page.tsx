"use client";
import Image from "next/image";
import { Toaster } from 'sonner'
import styles from "./page.module.css";
import { useEffect, useState } from "react";
import { auth } from "./lib/firebase/clientApp";
import Link from "next/link";
import { useFirebaseAuth } from "./hooks/useFirebaseAuth";

export default function Home() {
  const { user, signOut } = useFirebaseAuth();
  const [isProjectInfoOpen, setIsProjectInfoOpen] = useState(false);
  const [isViewQA, setIsViewQAState] = useState<boolean>(false); // State to track isViewQA

  // Effect to read initial isViewQA value from localStorage
  useEffect(() => {
    try {
      const storedValue = localStorage.getItem('isViewQA');
      setIsViewQAState(storedValue === 'true');
    } catch (error) {
      console.error('Error reading isViewQA from localStorage:', error);
    }
  }, []); 

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

const toggleIsViewQA = () => {
  try {
    const newValue = !isViewQA;
    localStorage.setItem('isViewQA', String(newValue));
    setIsViewQAState(newValue); // Update component state
  } catch (error) {
    console.error('Error toggling isViewQA in localStorage:', error);
    // Optionally, provide user feedback
  }
};
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/images/ableai.png"
          alt="Next JS Logo"
          width={180}
          height={180}
          priority
        />

        <details open={isProjectInfoOpen} onToggle={(e) => setIsProjectInfoOpen((e.target as HTMLDetailsElement).open)}>
          <summary className={styles.summary}>Project Overview</summary>
          <div className={styles.projectInfo}>
            <h2>Able AI Platform</h2>
            <p>A Next.js application that connects gig workers with buyers, featuring:</p>
            <ul>
              <li>Firebase Authentication</li>
              <li>Role-based access control</li>
              <li>Real-time updates with Firestore</li>
              <li>PostgreSQL database for secure data storage</li>
            </ul>
          </div>
        </details>

        <section className={styles.userSection}>
          <h2>User Status</h2>
          {user ? (
            <div className={styles.userInfo}>
              <p>Logged in as: {user.email}</p>
              <div className={styles.userActions}>
                <Link href="/select-role" className={styles.primary}>
                  Select Role
                </Link>
                <button onClick={handleSignOut} className={styles.secondary}>
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.userActions}>
              <Link href="/signin" className={styles.primary}>
                Sign In
              </Link>
            </div>
          )}
        </section>

        <section className={styles.pagesSection}>
        <h2>Pages Under Development</h2>
          <div className={styles.pagesList}>
            <div className={styles.pageItem}>
              <Link href="/signin" className={styles.pageName}>/signin</Link>
              <span className={styles.badge} data-status="complete">Complete</span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/select-role" className={styles.pageName}>/select-role</Link>
              <span className={styles.badge} data-status="complete">Complete</span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/reset-password" className={styles.pageName}>/reset-password</Link>
              <span className={styles.badge} data-status="complete">Complete</span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/user/test-user-id/onboarding" className={styles.pageName}>/user/[userId]/test-user-id/onboarding</Link>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/user/test-user-id/onboarding" className={styles.pageName}>/user/[userId]/test-user-id/onboarding</Link>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/user/test-user-id/notifications" className={styles.pageName}>/user/[userId]/notifications</Link>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            {/* Note: Replace [userId] with an actual user ID for testing */}
            <div className={styles.pageItem}>
              <Link href="/user/test-user-id/buyer" className={styles.pageName}>/user/[userId]/buyer</Link>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/user/test-user-id/buyer/payments" className={styles.pageName}>/user/[userId]/buyer/payments</Link>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/user/test-user-id/buyer/payments/invoice" className={styles.pageName}>/user/[userId]/buyer/payments/invoice</Link>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            {/* Note: Replace [userId] with an actual user ID for testing */}
            <div className={styles.pageItem}>
              <Link href="/user/test-user-id/worker" className={styles.pageName}>/user/[userId]/worker</Link>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/user/test-user-id/worker/earnings" className={styles.pageName}>/user/[userId]/worker/earnings</Link>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/user/test-user-id/settings" className={styles.pageName}>/user/[userId]/settings</Link>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/user/test-user-id/referral" className={styles.pageName}>/user/[userId]/referral</Link>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/user/test-user-id/worker/test-worker-id/recommendation" className={styles.pageName}>/user/[userId]/worker/[workerId]/recommendation</Link>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/worker/test-worker-id/recommendation" className={styles.pageName}>/worker/[workerId]/recommendation</Link>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/legal/terms" className={styles.pageName}>/legal/terms</Link>
              <span className={styles.badge} data-status="complete">Complete</span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/legal/privacy" className={styles.pageName}>/legal/privacy</Link>
              <span className={styles.badge} data-status="complete">Complete</span>
            </div>
            {/* Add link to Worker Offers page here */}
            {user && ( // Only show if user is logged in
                <div className={styles.pageItem}>
                  <Link href={`/user/${user.uid}/worker/offers`} className={styles.pageName}>/user/[userId]/worker/offers</Link>
                  <span className={styles.badge} data-status="in-progress">In Progress</span>
                </div>
            )}
            <div className={styles.pageItem}>
              <span className={styles.pageName}>/buyer/dashboard</span>
              <span className={styles.badge} data-status="planned">Planned</span>
            </div>
            <div className={styles.pageItem}>
              <span className={styles.pageName}>/worker/dashboard</span>
              <span className={styles.badge} data-status="planned">Planned</span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/user/test-user-id/worker/gigs/test-gig-id" className={styles.pageName}>/user/[userId]/worker/gigs/[gigId]</Link>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/user/test-user-id/worker/gigs/test-gig-id/feedback" className={styles.pageName}>/user/test-user-id/worker/gigs/test-gig-id/feedback</Link>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            {/* Add link to Buyer - Feedback on Worker View here */}
            <div className={styles.pageItem}>
              <Link href="/user/test-user-id/buyer/gigs/gig789-buyer-awaiting/feedback" className={styles.pageName}>/user/[userId]/buyer/gigs/[gigId]/feedback</Link>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            {/* Add link to Cancel or Amend Gig Details page here */}
            <div className={styles.pageItem}>
              <Link href="/gigs/test-gig-id/amend/test-amend-id" className={styles.pageName}>/gigs/[gigId]/amend/[amendId]</Link>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            {/* Add link to Confirm amended Gig Details page here */}
            <div className={styles.pageItem}>
              <Link href="/gigs/test-gig-id/amends/test-amend-id/review" className={styles.pageName}>/gigs/[gigId]/amends/[amendId]/review</Link>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            {/* Add link to Delegate Gig page here */}
            <div className={styles.pageItem}>
              <Link href="/gigs/test-gig-id/delegate" className={styles.pageName}>/gigs/[gigId]/delegate</Link>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            {/* Worker Calendar (mock user) link moved here */}
            <div className={styles.pageItem}>
              <Link href="/user/mock-worker/worker/calendar" className={styles.pageName}>/user/mock-worker/worker/calendar</Link>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            {/* Add links for new Worker Profile pages */}
            <div className={styles.pageItem}>
              <Link href="/worker/test-worker-id/profile" className={styles.pageName}>/worker/[workerId]/profile (Public)</Link>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/user/test-user-id/worker/profile" className={styles.pageName}>/user/[userId]/worker/profile (Owned)</Link>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/gigs/test-gig-id/chat" className={styles.pageName}>/gigs/[gigId]/chat</Link>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/gigs/test-gig-id/report-issue" className={styles.pageName} target="_blank" rel="noopener noreferrer">
                /gigs/[gigId]/report-issue
              </Link>
              <span className={styles.badge} data-status="in-progress">In Progress</span>
            </div>
          </div>
        </section>

        {/* Button to set a default role in local storage for testing */}
        <section className={styles.userSection}>
          <h2>Testing Tools</h2>
          <button onClick={() => localStorage.setItem('currentActiveRole', 'BUYER')} className={styles.primary}>
            Set Local Storage Role to BUYER
          </button>
           <button onClick={() => localStorage.setItem('currentActiveRole', 'WORKER')} className={styles.primary}>
            Set Local Storage Role to WORKER
          </button>
           <button onClick={() => localStorage.removeItem('currentActiveRole')} className={styles.secondary}>
            Clear Local Storage Role
          </button>
          <button onClick={() => toggleIsViewQA()} className={styles.secondary}>
            Toggle isViewQA (currently {String(isViewQA)})
          </button>
        </section>
      </main>
      <Toaster />
    </div>
  );
}
