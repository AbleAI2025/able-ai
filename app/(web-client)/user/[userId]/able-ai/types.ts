import type { Suggestion } from './AIChatContainer';

export type WorkerGigOffer = {
  id: string;
  role: string;
  buyerName: string;
  locationSnippet: string;
  dateString: string;
  timeString: string;
  hourlyRate: number;
  estimatedHours?: number;
  totalPay?: number;
  tipsExpected?: boolean;
  expiresAt?: string;
  status: string;
  fullDescriptionLink?: string;
  gigDescription?: string;
  notesForWorker?: string;
};

export interface DebugInfoProps {
  user: any;
  loadingGigs: boolean;
  gigs: WorkerGigOffer[];
  setGigs: React.Dispatch<React.SetStateAction<WorkerGigOffer[]>>;
  suggestion: Suggestion | null;
}

export interface AvailableGigsSectionProps {
  loadingGigs: boolean;
  gigs: WorkerGigOffer[];
  onGigClick: (gig: WorkerGigOffer) => void;
}

export interface GigDetailModalProps {
  isOpen: boolean;
  gig: WorkerGigOffer | null;
  onClose: () => void;
  onGoToOffers: () => void;
}