"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import styles from "./Feedback.module.css";
import {
  ThumbsUp,
  ThumbsDown,
  Trophy,
  Star,
  Send,
  Paperclip,
} from "lucide-react";
import AwardDisplayBadge from "@/app/components/profile/AwardDisplayBadge";
import { useAuth } from "@/context/AuthContext";
import { getLastRoleUsed, setLastRoleUsed } from "@/lib/last-role-used";


interface GigDetails {
  id: string;
  role: string;
  workerName: string;
  workerAvatarUrl: string;
  workerId: string;
  date: string; // ISO string
  hourlyRate: number;
  hoursWorked: number;
  totalPayment: number;
  duration: string;
  details: string;
  earnings: number;
}

interface FormData {
  feedbackText: string;
  wouldWorkAgain: boolean | null;
  topCommunicator: boolean;
  teamBuilder: boolean;
  expensesText: string;
}

const MockGigDetails: GigDetails = {
  id: "gig123",
  role: "Bartender",
  workerName: "Benji Asamoah",
  workerAvatarUrl: "/images/benji.jpeg",
  workerId: "benji-asamoah-id",
  date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  hourlyRate: 25,
  hoursWorked: 8,
  totalPayment: 200,
  duration: "4 hours",
  details: "Completed gig on Monday, 9:00 am. Location: Central Train station",
  earnings: 80.0,
};

export default function Feedback() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const pageUserId = params.userId as string;
  const gigId = params.gigId as string;
  const lastRoleUsed = getLastRoleUsed()

  const { user, loading: loadingAuth } = useAuth();
  const authUserId = user?.uid;

  const [formData, setFormData] = useState<FormData>({
    feedbackText: "",
    wouldWorkAgain: null,
    topCommunicator: false,
    teamBuilder: false,
    expensesText: "",
  });

  useEffect(() => {
    if (loadingAuth) return;

    if (!user) {
      router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!authUserId) {
      console.error("User is authenticated but UID is missing. Redirecting to signin.");
      router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (authUserId !== pageUserId) {
      router.push('/signin?error=unauthorized');
      return;
    }

    if (!(lastRoleUsed === "GIG_WORKER" || user.claims.role === "QA")) {
      router.push('/select-role');
      return;
    }

    setLastRoleUsed("GIG_WORKER");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.claims.role, loadingAuth, authUserId, pageUserId, router, pathname, lastRoleUsed]);

  const handleThumbsUp = () =>
    setFormData({ ...formData, wouldWorkAgain: true });
  const handleThumbsDown = () =>
    setFormData({ ...formData, wouldWorkAgain: false });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    console.log("Submitting feedback:", formData);
    router.push(`/user/${pageUserId}/worker/gigs/${gigId}/earnings`);
  };
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, type, value } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // if (loading) {
  //     return <div className={styles.loadingContainer}>Loading...</div>;
  // }

  return (
    <div className={styles.container}>
      <div className={styles.pageWrapper}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Confirm Hours Worked & <span>Feedback</span>
          </h2>
          <div className={styles.gigSummaryCard}>
            <p>
              <strong>{MockGigDetails?.role}</strong>
            </p>
            <p className={styles.duration}>Duration: {MockGigDetails?.duration}</p>
            <p>{MockGigDetails?.details}</p>
          </div>
          <div className={styles.earnings}>
            <span>Earnings:</span>
            <span>£{MockGigDetails?.earnings.toFixed(2)}</span>
          </div>
        </section>

        <form onSubmit={handleSubmit}>
          <section className={styles.section}>
            <div className={styles.textareaContainer}>
              <textarea
                id="feedbackText"
                name="feedbackText"
                className={styles.feedbackTextarea}
                placeholder="Share your experience...Provide feedback to earn awards"
                value={formData.feedbackText}
                onChange={handleChange}
              />
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.workAgainContainer}>
              {/* <div className={styles.actionNumber}>2</div> */}
              <h3 className={styles.workAgainText}>
                Would you work with <span>{lastRoleUsed === "GIG_WORKER" ? MockGigDetails?.workerName.split(" ")[0] : "this buyer"}</span> again?
              </h3>
              <div className={styles.thumbsContainer}>
                <button
                  className={`${styles.thumbButton} ${
                    formData.wouldWorkAgain === true ? styles.selected : ""
                  }`}
                  onClick={handleThumbsUp}
                >
                  <ThumbsUp size={31} color="#272100" />
                </button>
                <button
                  className={`${styles.thumbButton} ${
                    formData.wouldWorkAgain === false ? styles.selected : ""
                  }`}
                  onClick={handleThumbsDown}
                >
                  <ThumbsDown size={31} color="#272100" />
                </button>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.actionButtonWithNumber}>
              {/* <div className={styles.actionNumber}>3</div> */}
              <h3 className={styles.awardTitle}>
                Would you like to award <span>{lastRoleUsed === "GIG_WORKER" ? MockGigDetails?.workerName.split(" ")[0] : "the buyer"}</span>?
              </h3>
              <div className={styles.badgeContainer}>
                <button
                  className={`${styles.badgeButton} ${
                    formData.topCommunicator ? styles.selected : ""
                  }`}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      topCommunicator: !formData.topCommunicator,
                    })
                  }
                >
                  <AwardDisplayBadge icon={Trophy} textLines="Top communicator"/>
                </button>
                <button
                  className={`${styles.badgeButton} ${
                    formData.teamBuilder ? styles.selected : ""
                  }`}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      teamBuilder: !formData.teamBuilder,
                    })
                  }
                >
                  <AwardDisplayBadge icon={Star} textLines="Team builder"/>
                </button>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.actionButtonWithNumber}>
              {/* <div className={styles.actionNumber}>4</div> */}

              <div className={styles.expensesContainer}>
                <h3 className={styles.expensesTitle}>
                  Log any expenses you incurred here
                </h3>
                <Paperclip size={24} color="#ffffff" />
              </div>
              <textarea
                id="expensesText"
                name="expensesText"
                className={styles.expensesInput}
                placeholder="Note & upload images of costs incurred for your taxes"
                value={formData.expensesText}
                onChange={handleChange}
              />
            </div>
          </section>

          {lastRoleUsed === "GIG_WORKER" && (
            <section className={styles.buttonWrapper}>
              <button className={styles.negotiationButton}>
                Amend gig timing or add tips
              </button>
            </section>
          )}

          <section className={styles.buttonWrapper}>
            {/* <div className={styles.actionButtonWithNumber}> */}
            {lastRoleUsed === "GIG_WORKER" ? (   
                <button className={styles.submitButton} type="submit">
                  <Send size={14} /> Submit for payment
                </button>
            ) : (
                <button type="button" className={styles.releaseButton}>
                  End gig, release payment
              </button>
            )}
            {/* </div> */}
          </section>
        </form>
      </div>
    </div>
  );
}
