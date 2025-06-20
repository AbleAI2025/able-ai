// File: app/lib/drizzle/schema/admin.ts

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  serial, // For auto-incrementing integer PK for AdminLogs
  date,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Import enums (if any are specific to admin or already defined)
// No new enums seem immediately necessary for these two tables based on previous plan.

// Import related tables for foreign keys
import { UsersTable } from "./users"; // For adminUserId and lastUpdatedByUserId

// --- ADMIN LOGS TABLE ---
// Tracks actions performed by administrators in the admin panel
export const AdminLogsTable = pgTable("admin_logs", {
  id: serial("id").primaryKey(), // Using serial auto-incrementing integer for simplicity
  adminUserId: uuid("admin_user_id") // The User ID of the admin who performed the action
    .notNull()
    .references(() => UsersTable.id, { onDelete: "restrict" }), // Keep log even if admin user is somehow deleted (restrict is safer) or SET NULL
  action: varchar("action", { length: 255 }).notNull(), // e.g., "BANNED_USER", "APPROVED_GIG_MODERATION", "UPDATED_AI_PROMPT"
  targetEntityType: varchar("target_entity_type", { length: 100 }), // e.g., "USER", "GIG", "REVIEW", "AI_PROMPT"
  targetEntityId: varchar("target_entity_id", { length: 255 }), // Typically the UUID of the affected entity
  detailsJson: jsonb("details_json"), // Optional: Stores details like old/new values for an update, reason, etc.
  // e.g., { oldValue: { status: 'PENDING' }, newValue: { status: 'APPROVED' }, reason: 'User request' }
  ipAddress: varchar("ip_address", { length: 45 }), // Optional: IP address of the admin at the time of action

  timestamp: timestamp("timestamp", { mode: "date", withTimezone: true }) // Renamed from createdAt for clarity as it's the event time
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// --- AI PROMPTS TABLE ---
// Stores AI prompts that can be managed by administrators
export const AiPromptsTable = pgTable("ai_prompts", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  promptKey: varchar("prompt_key", { length: 100 }).unique().notNull(), // A unique key to identify the prompt, e.g., "WORKER_ONBOARDING_GREETING"
  promptText: text("prompt_text").notNull(), // The actual text of the prompt
  description: text("description"), // Optional: A brief description of where/how this prompt is used
  version: integer("version").default(1).notNull(), // For tracking changes to a prompt
  isActive: boolean("is_active").default(true).notNull(), // To enable/disable prompts without deleting

  // Who last updated this prompt
  lastUpdatedByUserId: uuid("last_updated_by_user_id").references(
    () => UsersTable.id,
    { onDelete: "set null" }
  ), // If updating admin is deleted, keep prompt but nullify updater

  // Timestamps
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(), // Application logic should update this field
});

/**
 * System Flags Table
 * Stores system-wide configuration settings.
 */
export const systemFlags = pgTable('system_flags', {
  flag_key: varchar('flag_key', { length: 255 }).notNull().unique(), // Unique key for the flag (e.g., 'chat_retention_months')
  flag_value: jsonb('flag_value').notNull(), // Store configuration value (e.g., { value: 3 } or { limit: 100 })
  description: text('description'), // Explanation of the flag
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

/**
 * User AI Usage Table
 * Tracks user interactions with AI for rate limiting and analytics.
 */
export const userAiUsage = pgTable('user_ai_usage', {
  id: uuid('id').default(sql`gen_random_uuid()`).notNull().primaryKey(),
  userId: uuid('user_id').notNull().references(() => UsersTable.id, { onDelete: 'cascade' }), // Link to the users table
  date: date('date').notNull(), // The date of the usage tracking
  aiMessageCount: integer('ai_message_count').default(0).notNull(), // Number of AI messages for this user on this date
  lastInteractionTimestamp: timestamp('last_interaction_timestamp', { withTimezone: true }), // Timestamp of the most recent interaction
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

/**
 * Escalated Issues Table
 * Records issues escalated from AI chat for human admin support.
 */
export const escalatedIssues = pgTable('escalated_issues', {
  id: uuid('id').default(sql`gen_random_uuid()`).notNull().primaryKey(),
  userId: uuid('user_id').notNull().references(() => UsersTable.id, { onDelete: 'cascade' }), // User who reported the issue
  firestoreMessageId: varchar('firestore_message_id', { length: 255 }), // Reference to the specific Firestore message triggering escalation
  gigId: varchar('gig_id', { length: 255 }), // Reference to a gig if applicable
  issueType: varchar('issue_type', { length: 100 }), // Categorized issue type (e.g., 'payment_issue', 'service_quality')
  description: text('description'), // Summary or initial description of the issue
  status: varchar('status', { length: 50 }).default('OPEN').notNull(), // Status of the escalation (e.g., 'OPEN', 'IN_PROGRESS', 'RESOLVED')
  adminUserId: uuid('admin_user_id').references(() => UsersTable.id, { onDelete: 'set null' }), // Admin assigned to the issue
  resolutionNotes: text('resolution_notes'), // Notes added by the admin resolving the issue
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Optional: Add indexes for performance
// For example, index userAiUsage by userId and date for quick lookups
/*
export const userAiUsageIndexes = pgTable('user_ai_usage_indexes', {
  userId: uuid('user_id').notNull().references(() => UsersTable.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
}, (t) => ({
  userDateIdx: primaryKey(t.userId, t.date),
}));
*/

// Optional: Index escalatedIssues by userId or status
/*
export const escalatedIssuesIndexes = pgTable('escalated_issues_indexes', {
  userId: uuid('user_id').notNull().references(() => UsersTable.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).default('OPEN').notNull(),
}, (t) => ({
  userIdIdx: t.userId,
  statusIdx: t.status,
}));
*/

// --- TODO: Define relations for these tables in relations.ts or schema/index.ts ---
// Example:
// export const adminLogsRelations = relations(AdminLogsTable, ({ one }) => ({
//   adminUser: one(UsersTable, {
//     fields: [AdminLogsTable.adminUserId],
//     references: [UsersTable.id],
//     relationName: "LogAdminUser"
//   }),
// }));

// export const aiPromptsRelations = relations(AiPromptsTable, ({ one }) => ({
//   lastUpdatedByUser: one(UsersTable, {
//     fields: [AiPromptsTable.lastUpdatedByUserId],
//     references: [UsersTable.id],
//     relationName: "PromptUpdaterUser"
//   }),
// }));
