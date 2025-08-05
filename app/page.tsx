"use client";
import Image from "next/image";
import styles from "./page.module.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { createNotificationAction, getAllNotificationsAction } from "@/actions/notifications/notifications";
import { useFirebase } from "@/context/FirebaseContext";

export default function Home() {
  const { user, loading } = useAuth();
  const [isProjectInfoOpen, setIsProjectInfoOpen] = useState(false);
  const { authClient } = useFirebase();

  const handleSignOut = async () => {
    try {
      if (authClient) {
        await signOut(authClient);
      }
    } catch (error) {
      // Error is already logged in signOutUser, but can add more handling here if needed
      console.error("Error during sign out process on page:", error);
    }
  };

  useEffect(()=>{
    if(user?.token){
      async function fetchNotifications() {
        await getAllNotificationsAction(user?.token || "")
      }
      fetchNotifications()
    }
  },[user?.token])

  const toggleIsViewQA = async () => {
    try {
      const currentIsQA = user?.claims.role === "QA";
      const newIsQA = !currentIsQA;
      localStorage.setItem("isViewQA", String(newIsQA));
    } catch (error) {
      console.error("Error toggling isViewQA and refetching user:", error);
    }
  };
    const [form, setForm] = useState({
    userUid: "",
    topic: "",
    title: "",
    body: "",
    image: "",
    path: "",
  });

  const [response, setResponse] = useState<null | { success: boolean; message: string }>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await createNotificationAction({...form, status: "unread", type: "system"}, user?.token);

    console.log(res);
    
    const json = await res;
    setResponse({ success: json.success, message: json.success ? "Sended" : "Error sending message" });
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

        <details
          open={isProjectInfoOpen}
          onToggle={(e) =>
            setIsProjectInfoOpen((e.target as HTMLDetailsElement).open)
          }
        >
          <summary className={styles.summary}>Project Overview</summary>
          <div className={styles.projectInfo}>
            <h2>Able AI Platform</h2>
            <p>
              A Next.js application that connects gig workers with buyers,
              featuring:
            </p>
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
          {loading && <p>Loading user context...</p>}
          {/*error && <p>Error loading context: {error.message}</p>*/}
          {user && (
            <div>
              <p>User Email: {user.email}</p>
              <p>App Role: {user?.claims.role}</p>
              {/*
                <p>Last Role Used: {user.lastRoleUsed}</p>
                <p>Is Buyer Mode: {String(user.isBuyerMode)}</p>
                <p>Is Worker Mode: {String(user.isWorkerMode)}</p>
                <p>Is Authenticated: {String(user.isAuthenticated)}</p>
                <p>Is QA Mode: {String(user.isQA)}</p>
              */}
            </div>
          )}
          {/* User Actions moved into the same section */}
          {user && user?.claims ? (
            <div className={styles.userInfo_actions}>
              {" "}
              {/* Changed className for potential styling adjustments */}
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
              <Link href="/signin" className={styles.pageName}>
                /signin
              </Link>
              <span className={styles.badge} data-status="complete">
                Complete
              </span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/select-role" className={styles.pageName}>
                /select-role
              </Link>
              <span className={styles.badge} data-status="complete">
                Complete
              </span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/reset-password" className={styles.pageName}>
                /reset-password
              </Link>
              <span className={styles.badge} data-status="complete">
                Complete
              </span>
            </div>
            <div className={styles.pageItem}>
              <Link
                href="/user/test-user-id/onboarding"
                className={styles.pageName}
              >
                /user/[userId]/test-user-id/onboarding
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            <div className={styles.pageItem}>
              <Link
                href="/user/test-user-id/onboarding"
                className={styles.pageName}
              >
                /user/[userId]/test-user-id/onboarding
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            <div className={styles.pageItem}>
              <Link
                href="/user/test-user-id/notifications"
                className={styles.pageName}
              >
                /user/[userId]/notifications
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            {/* Note: Replace [userId] with an actual user ID for testing */}
            <div className={styles.pageItem}>
              <Link href="/user/test-user-id/buyer" className={styles.pageName}>
                /user/[userId]/buyer
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            <div className={styles.pageItem}>
              <Link
                href="/user/test-user-id/buyer/payments"
                className={styles.pageName}
              >
                /user/[userId]/buyer/payments
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            <div className={styles.pageItem}>
              <Link
                href="/user/test-user-id/buyer/payments/invoice"
                className={styles.pageName}
              >
                /user/[userId]/buyer/payments/invoice
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            {/* Note: Replace [userId] with an actual user ID for testing */}
            <div className={styles.pageItem}>
              <Link
                href="/user/test-user-id/worker"
                className={styles.pageName}
              >
                /user/[userId]/worker
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            <div className={styles.pageItem}>
              <Link
                href="/user/test-user-id/worker/earnings"
                className={styles.pageName}
              >
                /user/[userId]/worker/earnings
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            <div className={styles.pageItem}>
              <Link
                href="/user/test-user-id/settings"
                className={styles.pageName}
              >
                /user/[userId]/settings
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            <div className={styles.pageItem}>
              <Link
                href="/user/test-user-id/referral"
                className={styles.pageName}
              >
                /user/[userId]/referral
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            <div className={styles.pageItem}>
              <Link
                href="/user/test-user-id/worker/test-worker-id/recommendation"
                className={styles.pageName}
              >
                /user/[userId]/worker/[workerId]/recommendation
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            <div className={styles.pageItem}>
              <Link
                href="/worker/test-worker-id/recommendation"
                className={styles.pageName}
              >
                /worker/[workerId]/recommendation
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/legal/terms" className={styles.pageName}>
                /legal/terms
              </Link>
              <span className={styles.badge} data-status="complete">
                Complete
              </span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/legal/privacy" className={styles.pageName}>
                /legal/privacy
              </Link>
              <span className={styles.badge} data-status="complete">
                Complete
              </span>
            </div>
            {/* Add link to Worker Offers page here */}
            {user && ( // Only show if user is logged in
              <div className={styles.pageItem}>
                <Link
                  href={`/user/${user.uid}/worker/offers`}
                  className={styles.pageName}
                >
                  /user/[userId]/worker/offers
                </Link>
                <span className={styles.badge} data-status="in-progress">
                  In Progress
                </span>
              </div>
            )}
            <div className={styles.pageItem}>
              <span className={styles.pageName}>/buyer/dashboard</span>
              <span className={styles.badge} data-status="planned">
                Planned
              </span>
            </div>
            <div className={styles.pageItem}>
              <span className={styles.pageName}>/worker/dashboard</span>
              <span className={styles.badge} data-status="planned">
                Planned
              </span>
            </div>
            <div className={styles.pageItem}>
              <Link
                href="/user/test-user-id/worker/gigs/test-gig-id"
                className={styles.pageName}
              >
                /user/[userId]/worker/gigs/[gigId]
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            <div className={styles.pageItem}>
              <Link
                href="/user/test-user-id/worker/gigs/test-gig-id/feedback"
                className={styles.pageName}
              >
                /user/test-user-id/worker/gigs/test-gig-id/feedback
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            {/* Add link to Buyer - Feedback on Worker View here */}
            <div className={styles.pageItem}>
              <Link
                href="/user/test-user-id/buyer/gigs/gig789-buyer-awaiting/feedback"
                className={styles.pageName}
              >
                /user/[userId]/buyer/gigs/[gigId]/feedback
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            {/* Add link to Cancel or Amend Gig Details page here */}
            <div className={styles.pageItem}>
              <Link
                href="/gigs/test-gig-id/amend/test-amend-id"
                className={styles.pageName}
              >
                /gigs/[gigId]/amend/[amendId]
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            {/* Add link to Confirm amended Gig Details page here */}
            <div className={styles.pageItem}>
              <Link
                href="/gigs/test-gig-id/amends/test-amend-id/review"
                className={styles.pageName}
              >
                /gigs/[gigId]/amends/[amendId]/review
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            {/* Add link to Delegate Gig page here */}
            <div className={styles.pageItem}>
              <Link
                href="/gigs/test-gig-id/delegate"
                className={styles.pageName}
              >
                /gigs/[gigId]/delegate
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            {/* Worker Calendar (mock user) link moved here */}
            <div className={styles.pageItem}>
              <Link
                href="/user/mock-worker/worker/calendar"
                className={styles.pageName}
              >
                /user/mock-worker/worker/calendar
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            {/* Add links for new Worker Profile pages */}
            <div className={styles.pageItem}>
              <Link
                href="/worker/test-worker-id/profile"
                className={styles.pageName}
              >
                /worker/[workerId]/profile (Public)
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            <div className={styles.pageItem}>
              <Link
                href="/user/test-user-id/worker/profile"
                className={styles.pageName}
              >
                /user/[userId]/worker/profile (Owned)
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            <div className={styles.pageItem}>
              <Link href="/gigs/test-gig-id/chat" className={styles.pageName}>
                /gigs/[gigId]/chat
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            <div className={styles.pageItem}>
              <Link
                href="/gigs/test-gig-id/report-issue"
                className={styles.pageName}
                target="_blank"
                rel="noopener noreferrer"
              >
                /gigs/[gigId]/report-issue
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            <div className={styles.pageItem}>
              <Link
                href="/user/test-user-id/buyer/gigs/pastGig123/rehire"
                className={styles.pageName}
              >
                /user/[userId]/buyer/gigs/[gigId]/rehire
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            <div className={styles.pageItem}>
              <Link
                href="/user/test-user-id/buyer/profile"
                className={styles.pageName}
              >
                /user/[userId]/buyer/profile
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            {/* Add link to Able AI Chat page here */}
            <div className={styles.pageItem}>
              <Link
                href="/user/test-user-id/able-ai"
                className={styles.pageName}
              >
                /user/[userId]/able-ai
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
           
            {/* Add new Chat page entry */}
            <div className={styles.pageItem}>
              <Link
                href="/user/test-user-id/chat"
                className={styles.pageName}
              >
                /user/[userId]/chat (New)
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
            {/* Add Worker Chat page entry */}
            <div className={styles.pageItem}>
              <Link
                href="/user/test-user-id/worker/chat"
                className={styles.pageName}
              >
                /user/[userId]/worker/chat
              </Link>
              <span className={styles.badge} data-status="in-progress">
                In Progress
              </span>
            </div>
          </div>
        </section>

        {/* Button to set a default role in local storage for testing */}
        <section className={styles.userSection}>
          <h2>Testing Tools</h2>
          <button
            onClick={() => localStorage.setItem("currentActiveRole", "BUYER")}
            className={styles.primary}
          >
            Set Local Storage Role to BUYER
          </button>
          <button
            onClick={() => localStorage.setItem("currentActiveRole", "WORKER")}
            className={styles.primary}
          >
            Set Local Storage Role to WORKER
          </button>
          <button
            onClick={() => localStorage.removeItem("currentActiveRole")}
            className={styles.secondary}
          >
            Clear Local Storage Role
          </button>
          <button onClick={() => toggleIsViewQA()} className={styles.secondary}>
            Toggle isViewQA (currently {String(user?.claims.role === "QA")})
          </button>
        </section>
    <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-xl mt-8">
      <h1 className="text-2xl font-bold mb-4">Send notification</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="userUid" placeholder="userUid (opcional)" value={form.userUid} onChange={handleChange} className="w-full input input-bordered" />
        <input type="text" name="topic" placeholder="topic (opcional)" value={form.topic} onChange={handleChange} className="w-full input input-bordered" />
        <input type="text" name="title" placeholder="Título" required value={form.title} onChange={handleChange} className="w-full input input-bordered" />
        <textarea name="body" placeholder="Cuerpo" required value={form.body} onChange={handleChange} className="w-full textarea textarea-bordered" />
        <input type="text" name="image" placeholder="URL de Imagen" value={form.image} onChange={handleChange} className="w-full input input-bordered" />
        <input type="text" name="path" placeholder="Ruta de redirección (opcional)" value={form.path} onChange={handleChange} className="w-full input input-bordered" />

        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? "Sending..." : "Send Notification"}
        </button>
      </form>

      {response && (
        <div className={`mt-4 text-center font-semibold ${response.success ? "text-green-600" : "text-red-600"}`}>
          {response.message}
        </div>
      )}
    </div>
      </main>
    </div>
  );
}
