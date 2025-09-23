
export interface GigDetails {
  id: string;
  role?: string;
  workerName?: string;
  workerAvatarUrl?: string | null;
  workerId?: string;
  date: string;
  completedAt?: string | null;
  location?: string | null;
  hourlyRate?: string | number | null;
  hoursWorked?: string | number | null;
  totalPayment?: string | number | null;
  duration?: string | number | null;
  details?: string | number | null;
  earnings?: string | number | null;
}

export interface WorkerFeedbackFormData {
  feedbackText: string;
  wouldWorkAgain: boolean | null;
  topCommunicator?: boolean;
  teamBuilder: boolean;
  expensesText: string;
  expensesFiles: File[];
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
  handleBack: () => void;
};
