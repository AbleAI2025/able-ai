
export enum InternalGigStatusEnum {
  PENDING_WORKER_ACCEPTANCE = "PENDING_WORKER_ACCEPTANCE",
  PAYMENT_HELD_PENDING_ACCEPTANCE = "PAYMENT_HELD_PENDING_ACCEPTANCE",
  ACCEPTED = "ACCEPTED",
  DECLINED_BY_WORKER = "DECLINED_BY_WORKER",
  IN_PROGRESS = "IN_PROGRESS",
  PENDING_COMPLETION_WORKER = "PENDING_COMPLETION_WORKER",
  PENDING_COMPLETION_BUYER = "PENDING_COMPLETION_BUYER",
  COMPLETED = "COMPLETED",
  AWAITING_PAYMENT = "AWAITING_PAYMENT",
  PAID = "PAID",
  CANCELLED_BY_BUYER = "CANCELLED_BY_BUYER",
  CANCELLED_BY_WORKER = "CANCELLED_BY_WORKER",
  CANCELLED_BY_ADMIN = "CANCELLED_BY_ADMIN",
  DISPUTED = "DISPUTED",
}

export type InternalGigStatusEnumType = `${InternalGigStatusEnum}`

export enum GigStatusEnum {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  AWAITING_BUYER_CONFIRMATION = 'AWAITING_BUYER_CONFIRMATION',
  COMPLETED = 'COMPLETED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  REQUESTED = 'REQUESTED',
  REQUESTED_AMENDMENT = 'REQUESTED_AMENDMENT'
}

export type GigStatusEnumType = `${GigStatusEnum}`

export default interface GigDetails {
  id: string;
  role: string; // e.g., Bartender
  gigTitle: string; // e.g., "at The Grand Cafe" or full title if preferred
  buyerName: string;
  buyerAvatarUrl?: string;
  date: string; // ISO
  startTime: string; // ISO
  endTime: string; // ISO
  duration: string; // e.g., "5 hours" - can be calculated
  location: string;
  hourlyRate: number;
  estimatedEarnings: number;
  specialInstructions?: string;
  status: GigStatusEnumType;
  statusInternal: InternalGigStatusEnumType;
  hiringManager?: string; // Optional, if available
  hiringManagerUsername?: string; // Optional, if available
  isWorkerSubmittedFeedback?: boolean; // Indicates if worker has submitted feedback
  isBuyerSubmittedFeedback?: boolean; // Indicates if buyer has submitted feedback
  // Worker-related properties
  workerName?: string; // Name of the assigned worker
  workerAvatarUrl?: string; // Avatar URL of the assigned worker
  workerGigs?: number; // Number of gigs the worker has completed
  workerExperience?: number; // Years of experience of the worker
  isWorkerStar?: boolean; // Whether the worker is a star worker
}

export interface GigReviewDetailsData {
	location: string;
	date: string;
	time: string;
	payPerHour: string;
	totalPay: string;
	summary: string; // Optional summary field
	status?: GigStatusEnumType; // Optional summary field
}
