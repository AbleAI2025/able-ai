import React from "react";
import {
  ThumbsUp,
  ThumbsDown,
  Send,
  Paperclip,
} from "lucide-react";
import AwardDisplayBadge from "@/app/components/profile/AwardDisplayBadge";
import {
  GigDetails,
  WorkerFeedbackFormData,
} from "@/app/types/GigFeedbackTypes";
import styles from "@/app/(web-client)/user/[userId]/buyer/gigs/[gigId]/feedback/FeedbackPage.module.css";
import stylesFeed from "@/app/components/gigs/Feedback.module.css";

type WorkerFeedbackFieldsProps = {
  gigDetails: GigDetails;
  formData: WorkerFeedbackFormData;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onThumbsUp: () => void;
  onThumbsDown: () => void;
  onToggleTopCommunicator: () => void;
  onToggleTeamBuilder: () => void;
  submitting?: boolean;
};

const WorkerFeedbackFields: React.FC<WorkerFeedbackFieldsProps> = ({
  gigDetails,
  formData,
  onChange,
  onThumbsUp,
  onThumbsDown,
  onToggleTopCommunicator,
  onToggleTeamBuilder,
  submitting,
}) => (
  <div className={stylesFeed.workerFeedbackContainer}>
    {/* Step 1 */}
    <div className={styles.stepItem}>
      <div className={styles.stepIndicator}>
        <span className={styles.stepNumber}>1</span>
      </div>
      <div className={`${styles.stepContent} ${stylesFeed.textareaContainer}`}>
        <textarea
          id="feedbackText"
          name="feedbackText"
          className={stylesFeed.textarea}
          placeholder="Share your experience...Provide feedback to earn awards"
          value={formData.feedbackText}
          onChange={onChange}
          aria-label="Feedback text"
        />
      </div>
    </div>

    {/* Step 2 */}
    <div className={styles.stepItem}>
      <div className={styles.stepIndicator}>
        <span className={styles.stepNumber}>2</span>
      </div>
      <div className={`${styles.stepContent} ${stylesFeed.workAgainContainer}`}>
        <h3 className={stylesFeed.workAgainText}>
          Would you work with {gigDetails.workerName.split(" ")[0]} again?
        </h3>
        <div className={stylesFeed.thumbsContainer}>
          <button
            type="button"
            className={stylesFeed.thumbButton}
            onClick={onThumbsUp}
            aria-label="Would work again"
          >
            <ThumbsUp size={28} />
          </button>
          <button
            type="button"
            className={stylesFeed.thumbButton}
            onClick={onThumbsDown}
            aria-label="Would not work again"
          >
            <ThumbsDown size={28} />
          </button>
        </div>
      </div>
    </div>

    {/* Step 3 */}
    <div className={styles.stepItem}>
      <div className={styles.stepIndicator}>
        <span className={styles.stepNumber}>3</span>
      </div>
      <div className={`${styles.stepContent} ${stylesFeed.awardContainer}`}>
        <h3 className={stylesFeed.awardTitle}>
          Would you like to award{" "}
          <span className={stylesFeed.workerName}>
            {gigDetails.workerName.split(" ")[0]}
          </span>
          ?
        </h3>
        <div className={stylesFeed.badgeContainer}>
          <button
            type="button"
            className={stylesFeed.badgeButton}
            onClick={onToggleTopCommunicator}
            aria-label="Top communicator award"
          >
            <AwardDisplayBadge
              icon="topChef"
              title="Top communicator"
              role="buyer"
              type="COMMON"
            />
          </button>
          <button
            type="button"
            className={stylesFeed.badgeButton}
            onClick={onToggleTeamBuilder}
            aria-label="Team builder award"
          >
            <AwardDisplayBadge
              icon="topChef"
              title="Top communicator"
              role="buyer"
              type="COMMON"
            />
          </button>
        </div>
      </div>
    </div>

    {/* Step 4 */}
    <div className={styles.stepItem}>
      <div className={styles.stepIndicator}>
        <span className={styles.stepNumber}>4</span>
      </div>
      <div className={`${styles.stepContent} ${stylesFeed.expensesContainer}`}>
        <h3 className={stylesFeed.expensesTitle}>
          Log any expenses you incurred here
        </h3>
        <label className={stylesFeed.expensesInputContainer}>
          <Paperclip size={20} />
          <input
            type="file"
            className={stylesFeed.expensesInput}
            onChange={onChange}
            aria-label="Upload expenses"
          />
        </label>
        {formData.expensesFiles.length > 0 && (
          <div className={stylesFeed.expensesFilesList}>
            {formData.expensesFiles.map((file, index) => (
              <div key={index} className={stylesFeed.expensesFileItem}>
                {file.name}
              </div>
            ))}
          </div>
        )}
        <textarea
          id="expensesText"
          name="expensesText"
          className={stylesFeed.expensesTextarea}
          placeholder="Note & upload images of costs incurred for your taxes"
          value={formData.expensesText}
          onChange={onChange}
          aria-label="Expenses text"
        />
      </div>
    </div>

    {/* Step 5 */}
    <div className={styles.stepItem}>
      <div className={styles.stepIndicator}>
        <span className={styles.stepNumber}>5</span>
      </div>
      <div className={`${styles.stepContent} ${stylesFeed.submitContainer}`}>
        <button
          type="submit"
          className={stylesFeed.submitButton}
          disabled={submitting}
          aria-label="Submit for payment"
        >
          <Send size={16} /> Submit for payment
        </button>
      </div>
    </div>
  </div>
);

export default WorkerFeedbackFields;
