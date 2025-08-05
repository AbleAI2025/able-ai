import React, { useState } from "react";
import Feedback from "./Feedback";
import { BuyerFeedbackFormData, GigDetails, WorkerFeedbackFormData } from "@/app/types/GigFeedbackTypes";

// Add user type for claims
interface User {
  uid: string;
  claims: { role: string };
}

type FeedbackContainerProps = {
  gigData: GigDetails | null;
  user: User | null;
  role: "GIG_WORKER" | "BUYER";
  mode: "worker" | "buyer";
  onSubmit: (formData: WorkerFeedbackFormData | BuyerFeedbackFormData) => void;
  loading?: boolean;
  error?: string | null;
  successMessage?: string | null;
};

const defaultWorkerForm: WorkerFeedbackFormData = {
  feedbackText: "",
  wouldWorkAgain: null,
  topCommunicator: false,
  teamBuilder: false,
  expensesText: "",
};

const defaultBuyerForm: BuyerFeedbackFormData = {
  publicComment: "",
  privateNotes: "",
  wouldHireAgain: "",
  topCommunicator: false,
  teamBuilder: false,
};

const FeedbackContainer: React.FC<FeedbackContainerProps> = ({
  gigData,
  user,
  role,
  mode,
  onSubmit,
  loading,
  error,
  successMessage,
}) => {
  const [formData, setFormData] = useState<WorkerFeedbackFormData | BuyerFeedbackFormData>(
    (mode === "worker" ? defaultWorkerForm : defaultBuyerForm)
  );
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, type, value } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setFormData((prev: WorkerFeedbackFormData | BuyerFeedbackFormData) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleThumbsUp = () => {
    setFormData((prev) => ({ ...prev, wouldWorkAgain: true }));
  };
  const handleThumbsDown = () => {
    setFormData((prev) => ({ ...prev, wouldWorkAgain: false }));
  };
  const handleToggleTopCommunicator = () => {
    setFormData((prev: WorkerFeedbackFormData | BuyerFeedbackFormData) => ({ ...prev, topCommunicator: !prev.topCommunicator }));
  };
  const handleToggleTeamBuilder = () => {
    setFormData((prev: WorkerFeedbackFormData | BuyerFeedbackFormData) => ({ ...prev, teamBuilder: !prev.teamBuilder }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-40">Loading...</div>;
  }
  if (error && (!gigData || !user || user?.claims.role !== role) && !successMessage) {
    return (
      <div className="flex flex-col items-center justify-center h-60">
        <h1 className="text-xl font-semibold mb-2">Feedback Error</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }
  if (!gigData && !successMessage && user && user?.claims.role === role) {
    return (
      <div className="flex flex-col items-center justify-center h-60">
        <h1 className="text-xl font-semibold mb-2">Feedback Not Available</h1>
        <p className="text-gray-600">Gig information not available for feedback.</p>
      </div>
    );
  }
  if (successMessage) {
    return (
      <div className="flex flex-col items-center justify-center h-60">
        <h1 className="text-xl font-semibold mb-2">Feedback Submitted</h1>
        <p className="text-green-600">{successMessage}</p>
      </div>
    );
  }

  return (
    <Feedback
      gigDetails={gigData!}
      role={role}
      mode={mode}
      formData={formData}
      onChange={handleChange}
      onThumbsUp={mode === "worker" ? handleThumbsUp : undefined}
      onThumbsDown={mode === "worker" ? handleThumbsDown : undefined}
      onToggleTopCommunicator={mode === "worker" ? handleToggleTopCommunicator : undefined}
      onToggleTeamBuilder={mode === "worker" ? handleToggleTeamBuilder : undefined}
      onSubmit={handleSubmit}
      loading={loading}
      submitting={submitting}
    />
  );
};

export default FeedbackContainer; 