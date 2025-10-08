"use client";

import { BadgeIcon } from "./GetBadgeIcon";
import AwardDisplayBadge from "./AwardDisplayBadge";
import styles from "./WorkerProfile.module.css";
import PublicWorkerProfile, { Review } from "@/app/types/workerProfileTypes";

interface AwardsFeedbackSectionProps {
  workerProfile: PublicWorkerProfile;
}

export default function AwardsFeedbackSection({ workerProfile }: AwardsFeedbackSectionProps) {
  return (
    <div className={styles.awardsFeedbackGrid}>
      {workerProfile.awards && workerProfile.awards.length > 0 && (
        <div>
          <h3 className={styles.contentTitle}>Awards:</h3>
          <div className={styles.awardsContainer}>
            {workerProfile.awards.map((award) => (
              <AwardDisplayBadge
                icon={award.icon as BadgeIcon}
                key={award.id}
                title={award.name}
                role="worker"
                type={award.type}
              />
            ))}
          </div>
        </div>
      )}
      <div>
        <h3 className={styles.contentTitle}>Feedback</h3>
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
  );
}