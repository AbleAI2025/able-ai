"use client";

import Link from "next/link";
import { BadgeCheck, Edit2, CalendarDays } from "lucide-react";
import styles from "./WorkerProfile.module.css";
import PublicWorkerProfile from "@/app/types/workerProfileTypes";

interface UserInfoBarProps {
  workerProfile: PublicWorkerProfile;
  isSelfView: boolean;
  onEditName: () => void;
  onEditSocial: () => void;
}

export default function UserInfoBar({
  workerProfile,
  isSelfView,
  onEditName,
  onEditSocial,
}: UserInfoBarProps) {
  return (
    <div className={styles.userInfoBar}>
      <div className={styles.userInfo}>
        <h1 className={styles.workerName}>
          <span>{workerProfile.user?.fullName ?? ""}</span>
          {isSelfView && (
            <button
              className={styles.editButton}
              type="button"
              aria-label="Edit name"
              onClick={onEditName}
            >
              <Edit2 size={16} color="#ffffff" className={styles.icon} />
            </button>
          )}
        </h1>
        {workerProfile?.user?.rtwStatus === "ACCEPTED" ? (
          <div className={styles.verifiedBadgeContainer}>
            <BadgeCheck size={25} className={styles.verifiedBadgeWorker} />
            <span className={styles.verifiedText}>
              Right to work verified
            </span>
          </div>
        ) : isSelfView ? (
          <button
            type="button"
            className={styles.verifyRTWButton}
            onClick={() => {}} // TODO: handle RTW
          >
            Verify your right to work
          </button>
        ) : (
          <span className={styles.verifiedText}>
            Right to work not verified
          </span>
        )}
      </div>
      <h3 className={styles.workerName}>
        <span>
          {workerProfile?.socialLink
            ? workerProfile.socialLink
            : isSelfView
            ? "Add social link"
            : "Social link not provided"}
        </span>
        {isSelfView && (
          <button
            className={styles.editButton}
            type="button"
            aria-label="Edit social link"
            onClick={onEditSocial}
          >
            <Edit2 size={14} color="#ffffff" className={styles.icon} />
          </button>
        )}
      </h3>

      <div className={styles.workerInfo}>
        {true && (
          <Link
            href={
              isSelfView
                ? "calendar"
                : `/user/${workerProfile.userId}/worker/${workerProfile.id}/availability`
            }
            className={`${styles.viewCalendarLink} ${styles.rightMargin}`}
            aria-label="View calendar"
          >
            <CalendarDays size={28} className={styles.calendarIcon} />
            <span>
              {isSelfView ? "View calendar" : "Availability calendar"}
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}