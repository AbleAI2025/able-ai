import { pgTable, uuid, varchar, text, timestamp, jsonb, integer, date, primaryKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { UsersTable } from './users'; // Assuming users table is in auth.ts schema

// Define enums if they are not globally defined or imported
// For simplicity, using varchar for status enums for now, but proper Drizzle enums are preferred.
// Example: import { user_app_role_enum } from './auth';

/**
 * System Flags Table
 * Stores system-wide configuration settings.
 */
export const systemFlags = pgTable('system_flags', {
  flag_key: varchar('flag_key', { length: 255 }).notNull().unique(), // Unique key for the flag (e.g., 'chat_retention_months')
  flag_value: jsonb('flag_value').notNull(), // Store configuration value (e.g., { value: 3 } or { limit: 100 })
  description: text('description'), // Explanation of the flag
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
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
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
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
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Optional: Add indexes for performance
// For example, index userAiUsage by userId and date for quick lookups
/*
export const userAiUsageIndexes = pgTable('user_ai_usage_indexes', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
}, (t) => ({
  userDateIdx: primaryKey(t.userId, t.date),
}));
*/

// Optional: Index escalatedIssues by userId or status
/*
export const escalatedIssuesIndexes = pgTable('escalated_issues_indexes', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).default('OPEN').notNull(),
}, (t) => ({
  userIdIdx: t.userId,
  statusIdx: t.status,
}));
*/ 