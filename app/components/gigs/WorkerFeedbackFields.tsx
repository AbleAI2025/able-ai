import React from "react";
import { ThumbsUp, ThumbsDown, Trophy, Star, Send, Paperclip } from "lucide-react";
import AwardDisplayBadge from "@/app/components/profile/AwardDisplayBadge";
import { GigDetails, WorkerFeedbackFormData } from "@/app/types/GigFeedbackTypes";
import styles from "@/app/(web-client)/user/[userId]/buyer/gigs/[gigId]/feedback/FeedbackPage.module.css";
import stylesFeed from "@/app/components/gigs/Feedback.module.css";

type WorkerFeedbackFieldsProps = {
  gigDetails: GigDetails;
  formData: WorkerFeedbackFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
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
  <>
    <div className={stylesFeed.textareaContainer}>
      <textarea
        id="feedbackText"
        name="feedbackText"
        className={stylesFeed.textareaContainer}
        placeholder="Share your experience...Provide feedback to earn awards"
        value={formData.feedbackText}
        onChange={onChange}
        aria-label="Feedback text"
      />
    </div>
    <div className="mb-4">
      <h3 className="font-medium mb-1">
        Would you work with <span className="font-semibold">{gigDetails.workerName.split(" ")[0]}</span> again?
      </h3>
      <div className="flex gap-4">
        <button
          type="button"
          className={`border rounded-full p-2 ${formData.wouldWorkAgain === true ? "bg-green-200" : ""}`}
          onClick={onThumbsUp}
          aria-label="Would work again"
          tabIndex={0}
        >
          <ThumbsUp size={28} />
        </button>
        <button
          type="button"
          className={`border rounded-full p-2 ${formData.wouldWorkAgain === false ? "bg-red-200" : ""}`}
          onClick={onThumbsDown}
          aria-label="Would not work again"
          tabIndex={0}
        >
          <ThumbsDown size={28} />
        </button>
      </div>
    </div>
    <div className="mb-4">
      <h3 className="font-medium mb-1">Would you like to award <span className="font-semibold">{gigDetails.workerName.split(" ")[0]}</span>?</h3>
      <div className="flex gap-4">
        <button
          type="button"
          className={`border rounded p-2 ${formData.topCommunicator ? "bg-blue-200" : ""}`}
          onClick={onToggleTopCommunicator}
          aria-label="Top communicator award"
          tabIndex={0}
        >
          <AwardDisplayBadge icon={Trophy} textLines="Top communicator" />
        </button>
        <button
          type="button"
          className={`border rounded p-2 ${formData.teamBuilder ? "bg-blue-200" : ""}`}
          onClick={onToggleTeamBuilder}
          aria-label="Team builder award"
          tabIndex={0}
        >
          <AwardDisplayBadge icon={Star} textLines="Team builder" />
        </button>
      </div>
    </div>
    <div className="mb-4">
      <h3 className="font-medium mb-1 flex items-center gap-2">
        Log any expenses you incurred here <Paperclip size={20} />
      </h3>
      <textarea
        id="expensesText"
        name="expensesText"
        className="w-full border rounded p-2 min-h-[60px]"
        placeholder="Note & upload images of costs incurred for your taxes"
        value={formData.expensesText}
        onChange={onChange}
        aria-label="Expenses text"
      />
    </div>
    <div className="flex justify-end gap-2 mt-6">
      <button
        type="submit"
        className={stylesFeed.submitButton}
        disabled={submitting}
        aria-label="Submit for payment"
      >
        <Send size={16} /> Submit for payment
      </button>
    </div>
  </>
);

export default WorkerFeedbackFields; 