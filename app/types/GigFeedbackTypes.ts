
export interface GigDetails {
  id: string;
  role: string;
  workerName: string;
  workerAvatarUrl?: string;
  workerId: string;
  date: string;
  hourlyRate: number;
  hoursWorked: number;
  totalPayment: number;
  duration?: string;
  details?: string;
  earnings?: number;
}

export interface WorkerFeedbackFormData {
  feedbackText: string;
  wouldWorkAgain: boolean | null;
  topCommunicator?: boolean;
  teamBuilder: boolean;
  expensesText: string;
}

export interface BuyerFeedbackFormData {
  publicComment: string;
  privateNotes: string;
  wouldHireAgain: "yes" | "no" | "maybe" | "";
  teamBuilder: boolean;
  topCommunicator?: boolean;
}

export type FeedbackProps = {
  gigDetails: GigDetails;
  role: "GIG_WORKER" | "BUYER";
  mode: "worker" | "buyer";
  formData: WorkerFeedbackFormData | BuyerFeedbackFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
  onToggleTopCommunicator?: () => void;
  onToggleTeamBuilder?: () => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  submitting?: boolean;
};
