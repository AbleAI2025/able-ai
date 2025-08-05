// File: app/lib/drizzle/schema/enums.ts

import { pgEnum } from "drizzle-orm/pg-core";

// User-related Enums
export const userAppRoleEnum = pgEnum("user_app_role_enum", [
  "USER", // Default general user
  "SUPER_ADMIN",
  "ADMIN",
  "QA",
]);

export const activeRoleContextEnum = pgEnum("active_role_context_enum", [
  "BUYER",
  "GIG_WORKER",
]);

export const rtwKycStatusEnum = pgEnum("rtw_kyc_status_enum", [
  "NOT_SUBMITTED",
  "PENDING",
  "VERIFIED",
  "REJECTED",
]);

// Gig-related Enums
export const gigStatusEnum = pgEnum("gig_status_enum", [
  "PENDING_WORKER_ACCEPTANCE", // Gig posted by buyer, awaiting worker
  "PAYMENT_HELD_PENDING_ACCEPTANCE",
  "ACCEPTED", // Worker has accepted
  "DECLINED_BY_WORKER", // Worker explicitly declined
  "IN_PROGRESS", // Worker has started
  "PENDING_COMPLETION_WORKER", // Worker marked as complete
  "PENDING_COMPLETION_BUYER", // Buyer marked as complete
  "COMPLETED", // Both parties (or admin) marked as complete
  "AWAITING_PAYMENT", // Completion confirmed, payment step pending
  "PAID", // Payment successfully processed
  "CANCELLED_BY_BUYER",
  "CANCELLED_BY_WORKER",
  "CANCELLED_BY_ADMIN",
  "DISPUTED",
]);

export const cancellationPartyEnum = pgEnum("cancellation_party_enum", [
  "BUYER",
  "WORKER",
  "ADMIN",
  "SYSTEM", // e.g., if an offer expires
]);

// Payment-related Enums
export const paymentStatusEnum = pgEnum("payment_status_enum", [
  "PENDING", // Payment initiated, awaiting action from user (e.g. Stripe checkout)
  "PROCESSING", // Payment submitted to Stripe, awaiting confirmation
  "COMPLETED", // Payment successful
  "FAILED", // Payment failed
  "REFUNDED", // Payment was refunded
  "REQUIRES_ACTION", // Stripe requires further action from the user
]);

// Interaction-related Enums
export const badgeTypeEnum = pgEnum("badge_type_enum", [
  "SKILL", // e.g., "Mixology Master"
  "VALUE", // e.g., "Always Punctual", "Great Communicator"
  "PLATFORM_ACHIEVEMENT", // e.g., "Founding Freelancer", "Top Buyer"
]);

export const reviewTypeEnum = pgEnum("review_type_enum", [
  "INTERNAL_PLATFORM", // Review left by a user on the platform for another user
  "EXTERNAL_REQUESTED", // Recommendation requested from an external contact
]);

export const moderationStatusEnum = pgEnum("moderation_status_enum", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "AUTO_FLAGGED",
]);

// Vector Embedding Enums (Optional, if you want to type entityType)
export const vectorEntityTypeEnum = pgEnum("vector_entity_type_enum", [
  "WORKER_PROFILE_BIO",
  "WORKER_SKILL_DESCRIPTION",
  "GIG_REQUIREMENT_DESCRIPTION",
  "USER_REVIEW_TEXT",
]);

export const stripeAccountStatusEnum = pgEnum("stripe_account_status_enum", [
  "connected",
  "pending_verification",
  "incomplete",
  "restricted",
  "disabled",
]);
