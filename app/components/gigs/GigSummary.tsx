import React from "react";
import { GigDetails } from "@/app/types/GigFeedbackTypes";
import styles from "@/app/(web-client)/user/[userId]/buyer/gigs/[gigId]/feedback/FeedbackPage.module.css";
import stylesFeed from "@/app/components/gigs/Feedback.module.css";

type GigSummaryProps = {
  gigDetails: GigDetails;
  role: "GIG_WORKER" | "BUYER";
};

const GigSummary: React.FC<GigSummaryProps> = ({ gigDetails, role }) => (
  <div className={`${stylesFeed.gigSummaryCard}`}>
    <div className={styles.summaryTextContainer}>
      <p>
        <strong>{gigDetails?.role}</strong>
      </p>
      {gigDetails?.duration && <p className={stylesFeed.duration}>Duration: {gigDetails.duration}</p>}
      {gigDetails?.details && <p className="text-sm">{gigDetails.details}</p>}
    </div>
    {gigDetails?.earnings !== undefined && (
      <div className={stylesFeed.earnings}>
        <span className="font-medium">{role === "GIG_WORKER" ? "Earnings:" : "Payments:"}</span>
        <span className="font-bold">£{gigDetails.earnings.toFixed(2)}</span>
      </div>
    )}
  </div>
);

export default GigSummary; 