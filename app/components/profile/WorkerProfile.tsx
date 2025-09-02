"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- SHARED & HELPER COMPONENTS ---
import ContentCard from "@/app/components/shared/ContentCard";
import SkillsDisplayTable from "@/app/components/profile/SkillsDisplayTable";
import StatisticItemDisplay from "@/app/components/profile/StatisticItemDisplay";
import AwardDisplayBadge from "@/app/components/profile/AwardDisplayBadge";
import CheckboxDisplayItem from "@/app/components/profile/CheckboxDisplayItem";
import styles from "./WorkerProfile.module.css";

import {
  CalendarDays,
  BadgeCheck,
  ThumbsUp,
  MessageSquare,
} from "lucide-react";
import {
  getPrivateWorkerProfileAction,
  updateVideoUrlProfileAction,
} from "@/actions/user/gig-worker-profile";
import { firebaseApp } from "@/lib/firebase/clientApp";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

import PublicWorkerProfile, { Review } from "@/app/types/workerProfileTypes";
import { useAuth } from "@/context/AuthContext";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import ProfileMedia from "./ProfileMedia";

const WorkerProfile = ({
  workerProfile,
  isSelfView = false,
  handleAddSkill,
  handleSkillDetails, // Optional handler for skill details
  fetchUserProfile,
}: {
  workerProfile: PublicWorkerProfile;
  handleAddSkill?: () => void;
  handleSkillDetails: (id: string) => void; // Now optional
  fetchUserProfile: (token: string) => void;
  userId?: string;
  isSelfView: boolean;
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [workerLink, setWorkerLink] = useState<string | null>(null);
  const [showRtwPopup, setShowRtwPopup] = useState(false);

  // NEW: hold the latest passport verification (to display after return)
  const [passportResult, setPassportResult] = useState<any | null>(null);

  const handleVideoUpload = useCallback(
    async (file: Blob) => {
      if (!user) {
        console.error("Missing required parameters for video upload");
        setError("Failed to upload video. Please try again.");
        return;
      }
      if (!file || file.size === 0) {
        console.error("Invalid file for video upload");
        setError("Invalid video file. Please try again.");
        return;
      }
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        setError("Video file too large. Please use a file smaller than 50MB.");
        return;
      }

      try {
        const filePath = `workers/${user.uid}/introVideo/introduction-${encodeURI(
          user.email ?? user.uid
        )}.webm`;
        const fileStorageRef = storageRef(getStorage(firebaseApp), filePath);
        const uploadTask = uploadBytesResumable(fileStorageRef, file);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            // (optional) handle progress
          },
          (error) => {
            console.error("Upload failed:", error);
            setError("Video upload failed. Please try again.");
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref)
              .then((downloadURL) => {
                updateVideoUrlProfileAction(downloadURL, user.token);
                toast.success("Video upload successfully");
                getPrivateWorkerProfileAction(user.token);
              })
              .catch((error) => {
                console.error("Failed to get download URL:", error);
                setError("Failed to get video URL. Please try again.");
              });
          }
        );
      } catch (error) {
        console.error("Video upload error:", error);
        setError("Failed to upload video. Please try again.");
      }
    },
    [user]
  );

  useEffect(() => {
    if (workerProfile && workerProfile.id) {
      setWorkerLink(
        `${window.location.origin}/worker/${workerProfile.id}/profile`
      );
    }
  }, [workerProfile]);

  // -------------------------
  // UK NATIONAL: create session on backend, then redirect to hosted PassportReader
  // -------------------------
  async function startPassportCapture() {
    try {
      const res = await fetch("/api/passportreader/session", { method: "POST" });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error("Unexpected response from session API.");
      }

      if (!res.ok) {
        const msg = data?.message || data?.error || "Failed to start session.";
        alert(`Session error: ${msg}`);
        console.error("Passport session error:", data);
        return;
      }

      const token = data?.token ?? data?.raw?.token ?? null;
      const sessionId = String(data?.sessionId ?? data?.id ?? "");
      const host = (data?.raw?.host || data?.host || "https://passportreader.app").replace(/\/+$/, "");

      if (!token || !sessionId) {
        alert("Session created but token or sessionId missing. Check server logs.");
        console.error("Missing token/sessionId in response:", data);
        return;
      }

      try { sessionStorage.setItem("passportreader_session_id", sessionId); } catch {}

      const redirectBack = `${window.location.origin}${window.location.pathname}?done=1`;
      const openUrl = `${host}/open?token=${encodeURIComponent(token)}&redirect_url=${encodeURIComponent(redirectBack)}`;
      setShowRtwPopup(false);
      window.location.href = openUrl;
    } catch (e: any) {
      alert("Failed to start passport capture session.");
      console.error(e);
    }
  }

  // NEW: when user returns from PassportReader (?done=1), save to DB and show result
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("done") !== "1") return;

    (async () => {
      try {
        const sessionId = sessionStorage.getItem("passportreader_session_id");
        const uid = user?.uid;
        if (!sessionId || !uid) return;

        const res = await fetch("/api/rtw/save-passport", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: uid, sessionId }),
        });

        const json = await res.json();
        if (!res.ok) {
          console.error("save-passport failed:", json);
          // toast.error("Couldn’t save passport result"); // optional
          return;
        }

        setPassportResult(json.payload || null);
        // toast.success("Right to Work verified & saved"); // optional
      } catch (err) {
        console.error("post-return save error:", err);
      }
    })();
  }, [user?.uid]);

  return (
    <div className={styles.profilePageContainer}>
      {/* Top Section (Benji Image Style - Profile Image/Video, QR, Location) */}
      <ProfileMedia
        workerProfile={workerProfile}
        isSelfView={isSelfView}
        workerLink={workerLink}
        onVideoUpload={handleVideoUpload}
      />

      {/* User Info Bar (Benji Image Style - Name, Handle, Calendar) */}
      <div className={styles.userInfoBar}>
        <div className={styles.userInfoLeft}>
          <h1 className={styles.workerName} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {user?.displayName}
            {true && (
              <BadgeCheck size={22} className={styles.verifiedBadgeWorker} />
            )}
            {/* Right to Work Verification */}
            <span style={{ marginLeft: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: 14,
                  padding: 0,
                }}
                onClick={() => setShowRtwPopup(true)}
              >
                Verify your right to work
              </button>
            </span>
          </h1>

          {/* RTW Verification Popup */}
          {showRtwPopup && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.5)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  background: '#18181b',
                  color: '#fff',
                  borderRadius: 12,
                  padding: 32,
                  minWidth: 320,
                  boxShadow: '0 4px 32px rgba(0,0,0,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 24,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                  To adhere to UK law, we need to confirm you have the legal right to work.
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                  Are you a
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  {/* UK national → hosted PassportReader */}
                  <button
                    style={{
                      background: '#38bdf8',
                      color: '#18181b',
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 24px',
                      fontWeight: 600,
                      fontSize: 16,
                      cursor: 'pointer',
                    }}
                    onClick={startPassportCapture}
                  >
                    UK national
                  </button>

                  <span style={{ color: '#fff', fontWeight: 600 }}>Or</span>

                  {/* Non UK national → your RTW (share-code) page */}
                  <button
                    style={{
                      background: '#38bdf8',
                      color: '#18181b',
                      border: '1px solid #38bdf8',
                      borderRadius: 8,
                      padding: '10px 24px',
                      fontWeight: 600,
                      fontSize: 16,
                      cursor: 'pointer',
                    }}
                    onClick={() =>
                      (window.location.href =
                        `/user/${workerProfile.userId}/worker/rtw`)
                    }
                  >
                    Non UK national
                  </button>
                </div>
                <button
                  style={{
                    marginTop: 16,
                    background: 'none',
                    color: '#fff',
                    border: 'none',
                    fontSize: 14,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                  onClick={() => setShowRtwPopup(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Calendar link (unchanged) */}
        <div className={styles.workerInfo}>
          {true && (
            <Link
              href={workerProfile?.userId || ""}
              className={styles.viewCalendarLink}
              aria-label="View calendar"
            >
              <CalendarDays size={20} className={styles.calendarIcon} />
              <span>Availability calendar</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main content wrapper */}
      <div className={styles.mainContentWrapper}>
        {/* Statistics Section */}
        <ContentCard title="Statistics" className={styles.statisticsCard}>
          <div className={styles.statisticsItemsContainer}>
            {workerProfile?.responseRateInternal && (
              <StatisticItemDisplay
                stat={{
                  id: 1,
                  icon: ThumbsUp,
                  value: workerProfile.responseRateInternal,
                  label: "Would work with Benji again",
                  iconColor: "#0070f3",
                }}
              />
            )}
            {workerProfile?.averageRating && (
              <StatisticItemDisplay
                stat={{
                  id: 2,
                  icon: MessageSquare,
                  value: workerProfile.averageRating,
                  label: "Response rate",
                  iconColor: "#0070f3",
                }}
              />
            )}
          </div>
        </ContentCard>

        {/* Skills Section */}
        {
          <SkillsDisplayTable
            skills={workerProfile?.skills}
            isSelfView={isSelfView}
            handleAddSkill={handleAddSkill}
            handleSkillDetails={handleSkillDetails}
            fetchUserProfile={fetchUserProfile}
            token={user?.token || ""}
          />
        }

        {/* Awards & Feedback Section */}
        {workerProfile.awards && (
          <div className={styles.awardsFeedbackGrid}>
            {workerProfile.awards && workerProfile.awards.length > 0 && (
              <div>
                <h3 className={styles.contentTitle}>Awards:</h3>
                <div className={styles.awardsContainer}>
                  {workerProfile.awards.map((award) => (
                    <AwardDisplayBadge
                      key={award.id}
                      textLines={award.notes || ""}
                      color="#eab308"
                      border="3px solid #eab308"
                    />
                  ))}
                </div>
              </div>
            )}
            <div>
              <h3 className={styles.contentTitle}>Feedbacks:</h3>
              {workerProfile.reviews && workerProfile.reviews.length > 0 ? (
                workerProfile.reviews.map((review: Review) => (
                  <p key={review.id} className={styles.feedbackText}>
                    {review.comment}
                  </p>
                ))
              ) : (
                <p className={styles.feedbackText}>No feedback available.</p>
              )}
            </div>
          </div>
        )}

        {/* Qualifications Section */}
        {workerProfile.qualifications &&
          workerProfile.qualifications.length > 0 && (
            <div>
              <h3 className={styles.contentTitle}>Qualifications:</h3>
              <ul className={styles.listSimple}>
                {workerProfile.qualifications.map((q, index) => (
                  <li key={index}>
                    {q.title}: {q.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

        {/* Equipment Section */}
        {workerProfile.equipment && workerProfile.equipment.length > 0 && (
          <div>
            <h3 className={styles.contentTitle}>Equipment:</h3>
            <div className={styles.equipmentListContainer}>
              {workerProfile.equipment.map((item, index) => (
                <CheckboxDisplayItem key={index} label={item.name} />
              ))}
            </div>
          </div>
        )}

        {/* Bio Text */}
        {workerProfile.fullBio && (
          <ContentCard
            title={`About ${user?.displayName?.split(" ")[0] || "this user"}`}
          >
            <p className={styles.bioText}>{workerProfile.fullBio}</p>
          </ContentCard>
        )}

        {/* NEW: show passport verification result when available (keeps styling) */}
        {passportResult && (
          <ContentCard title="Right to Work (UK passport)">
            <div className={styles.bioText} style={{ lineHeight: 1.6 }}>
              <div><strong>Status:</strong> {passportResult?.outcome || "—"}</div>
              <div><strong>Name:</strong> {passportResult?.name?.forename || "—"} {passportResult?.name?.surname || ""}</div>
              <div><strong>DOB:</strong> {passportResult?.dob || "—"}</div>
              <div><strong>Passport No:</strong> {passportResult?.document_number || "—"}</div>
              <div><strong>Expiry:</strong> {passportResult?.expiry_iso || passportResult?.permission_expiry_date || "—"}</div>
              <div><strong>Nationality:</strong> {passportResult?.nationality || "—"}</div>
              <div><strong>Issuing country:</strong> {passportResult?.issuing_country || "—"}</div>
              <div><strong>Reference:</strong> {passportResult?.referenceNumber || "—"}</div>
            </div>
          </ContentCard>
        )}
      </div>{/* End Main Content Wrapper */}
    </div>
  );
};

export default WorkerProfile;