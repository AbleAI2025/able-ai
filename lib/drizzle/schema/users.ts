// File: app/lib/drizzle/schema/users.ts

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  jsonb,
  decimal,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm"; // Import sql for default values like CURRENT_TIMESTAMP

// Import enums
import {
  userAppRoleEnum,
  activeRoleContextEnum,
  rtwKycStatusEnum,
  stripeAccountStatusEnum,
} from "./enums"; // Assuming enums.ts is in the same directory

// --- USERS TABLE ---
export const UsersTable = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`), // Standard way for UUID generation
  firebaseUid: varchar("firebase_uid", { length: 128 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }), // Optional

  // Role Management
  appRole: userAppRoleEnum("app_role").default("USER").notNull(),
  isGigWorker: boolean("is_gig_worker").default(false).notNull(),
  isBuyer: boolean("is_buyer").default(false).notNull(),
  lastRoleUsed: activeRoleContextEnum("last_role_used"), // Stores 'BUYER' or 'GIG_WORKER'

  // User Preferences / State
  // Storing these as separate fields based on your earlier preference.
  // Alternatively, could be jsonb: last_views_json: jsonb('last_views_json').$type<{ buyer?: string; worker?: string }>()
  lastViewVisitedBuyer: text("last_view_visited_buyer"),
  lastViewVisitedWorker: text("last_view_visited_worker"),

  // Stripe IDs
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(), // For Buyers
  stripeConnectAccountId: varchar("stripe_connect_account_id", {
    length: 255,
  }).unique(), // For Workers
  canReceivePayouts: boolean("can_receive_payouts").default(false).notNull(),
  stripeAccountStatus: stripeAccountStatusEnum("stripe_account_status"),

  // KYC/RTW Status
  rtwStatus: rtwKycStatusEnum("rtw_status").default("NOT_SUBMITTED"),
  rtwDocumentUrl: text("rtw_document_url"), // Secure reference, not direct PII
  kycStatus: rtwKycStatusEnum("kyc_status").default("NOT_SUBMITTED"),
  kycDocumentUrl: text("kyc_document_url"), // Secure reference

  // Admin Flags
  isBanned: boolean("is_banned").default(false).notNull(),
  isDisabled: boolean("is_disabled").default(false).notNull(),

  // Privacy Settings
  profileVisibility: boolean("profile_visibility").default(false).notNull(),

  // Timestamps
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  // Note for `updatedAt`: To auto-update, either handle in your application logic on every update
  // or create a database trigger. Drizzle's .$onUpdate() is for client-side hook on DML, not a DB schema feature.
  // For now, we assume application logic will update it.
});

// --- GIG WORKER PROFILES TABLE ---
export const GigWorkerProfilesTable = pgTable("gig_worker_profiles", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => UsersTable.id, { onDelete: "cascade" }) // If user is deleted, their specific profiles are too
    .unique(), // A user can only have one gig worker profile
  fullBio: text("full_bio"),
  privateNotes: text("private_notes"), // Notes by the worker for themselves
  responseRateInternal: decimal("response_rate_internal", {
    // Calculated by backend
    precision: 5,
    scale: 2, // e.g., 0.95 for 95%
  }),
  availabilityJson: jsonb("availability_json"), // Stores complex availability rules
  semanticProfileJson: jsonb("semantic_profile_json"), // For AI matching data
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// --- BUYER PROFILES TABLE ---
export const BuyerProfilesTable = pgTable("buyer_profiles", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => UsersTable.id, { onDelete: "cascade" })
    .unique(), // A user can only have one buyer profile
  fullCompanyName: varchar("full_company_name", { length: 255 }),
  vatNumber: varchar("vat_number", { length: 50 }),
  businessRegistrationNumber: varchar("business_registration_number", {
    length: 100,
  }),
  billingAddressJson: jsonb("billing_address_json"), // Store structured address as JSON
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// --- TEAM MEMBERS TABLE (for Buyers) ---
export const TeamMembersTable = pgTable("team_members", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  buyerProfileId: uuid("buyer_profile_id") // The BuyerProfile this team member belongs to
    .notNull()
    .references(() => BuyerProfilesTable.id, { onDelete: "cascade" }),
  memberUserId: uuid("member_user_id") // If the team member is also a platform user
    .references(() => UsersTable.id, { onDelete: "set null" }), // If platform user is deleted, keep team member record but unlink
  name: varchar("name", { length: 255 }), // Name of the team member (could be from UsersTable or entered if not a platform user)
  email: varchar("email", { length: 255 }), // Email for notifications or if not a platform user
  roleInTeam: varchar("role_in_team", { length: 100 }), // e.g., "Hiring Manager", "Accountant"
  permissionsJson: jsonb("permissions_json"), // Granular permissions within the buyer's team context
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// --- PASSWORD RECOVERY REQUESTS TABLE ---
export const PasswordRecoveryRequestsTable = pgTable(
  "password_recovery_requests",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 255 }).unique().notNull(), // Store a HASH of the token, not the token itself
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    isUsed: boolean("is_used").default(false).notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }
);

// --- TODO: Define relations for these tables in relations.ts or schema/index.ts ---
// For example:
// export const usersRelations = relations(UsersTable, ({ one, many }) => ({
//   gigWorkerProfile: one(GigWorkerProfilesTable, { fields: [UsersTable.id], references: [GigWorkerProfilesTable.userId] }),
//   buyerProfile: one(BuyerProfilesTable, { fields: [UsersTable.id], references: [BuyerProfilesTable.userId] }),
//   teamMemberships: many(TeamMembersTable, { relationName: "UserAsTeamMember" }), // where usersTable.id is TeamMembersTable.memberUserId
//   passwordRecoveryRequests: many(PasswordRecoveryRequestsTable),
// }));
// ... and so on for other tables.
