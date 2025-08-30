// File: app/lib/drizzle/schema/interactions.ts

import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  varchar,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Import enums
import { reviewTypeEnum, moderationStatusEnum, badgeTypeEnum, activeRoleContextEnum } from "./enums";

// Import related tables for foreign keys
import { UsersTable } from "./users";
import { GigsTable, SkillsTable } from "./gigs";

// --- RECOMMENDATIONS TABLE ---
export const RecommendationsTable = pgTable("recommendations", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workerUserId: uuid("worker_user_id")
    .notNull()
    .references(() => UsersTable.id, { onDelete: "cascade" }),
  recommendationCode: varchar("recommendation_code", { length: 50 })
    .unique()
    .notNull(),
  recommendationText: text("recommendation_text"),
  relationship: text("relationship"),
  recommenderName: varchar("recommender_name", { length: 100 }),
  recommenderEmail: varchar("recommender_email", { length: 255 }),
  isVerified: boolean("is_verified").default(false),
  moderationStatus: moderationStatusEnum("moderation_status")
    .default("PENDING")
    .notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// --- REVIEWS TABLE ---
export const ReviewsTable = pgTable(
  "reviews",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    gigId: uuid("gig_id")
      .references(() => GigsTable.id, { onDelete: "cascade" }),
    authorUserId: uuid("author_user_id")
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    targetUserId: uuid("target_user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    relationship: text("relationship"),
    recommenderName: text("recommender_name"),
    recommenderEmail: text("recommender_email"),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    wouldWorkAgain: boolean("would_work_again"),
    awardedBadgeNamesToTargetJson: jsonb("awarded_badge_names_to_target_json"),
    isPublic: boolean("is_public").default(true).notNull(),
    type: reviewTypeEnum("type").default("INTERNAL_PLATFORM").notNull(),
    moderationStatus: moderationStatusEnum("moderation_status")
      .default("PENDING")
      .notNull(),
    targetRole: activeRoleContextEnum("target_role"),
    skillId: uuid("skill_id").references(() => SkillsTable.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("author_target_gig_unique_idx").on(
      table.authorUserId,
      table.targetUserId,
      table.gigId,
    ),
  ],
);

// --- BADGE DEFINITIONS TABLE ---
export const BadgeDefinitionsTable = pgTable("badge_definitions", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).unique().notNull(),
  description: text("description").notNull(),
  iconUrlOrLucideName: varchar("icon_url_or_lucide_name", { length: 255 }),
  type: badgeTypeEnum("type").notNull(),
  criteriaJson: jsonb("criteria_json"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// --- USER BADGES LINK TABLE ---
export const UserBadgesLinkTable = pgTable(
  "user_badges_link",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    badgeId: uuid("badge_id")
      .notNull()
      .references(() => BadgeDefinitionsTable.id, { onDelete: "cascade" }),
    awardedAt: timestamp("awarded_at", { mode: "date", withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    awardedBySystem: boolean("awarded_by_system").default(false),
    awardedByUserId: uuid("awarded_by_user_id").references(
      () => UsersTable.id,
      { onDelete: "set null" },
    ),
    gigId: uuid("gig_id").references(() => GigsTable.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
  },
  (table) => [
    uniqueIndex("user_badge_unique_idx").on(table.userId, table.badgeId),
  ],
);

// --- CHAT MESSAGES TABLE ---
// Stores individual chat messages related to a gig
export const ChatMessagesTable = pgTable("chat_messages", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  gigId: uuid("gig_id") // The gig this chat message pertains to
    .notNull()
    .references(() => GigsTable.id, { onDelete: "cascade" }), // If gig is deleted, messages are deleted
  senderUserId: uuid("sender_user_id") // The User ID of the message sender
    .notNull()
    .references(() => UsersTable.id, { onDelete: "cascade" }), // If sender is deleted, their messages are deleted

  // Receiver ID is implicitly the other participant of the gig (buyer or worker).
  // Not strictly needed as a column if the gig has only two participants (buyer and worker).
  // If a gig could have group chat, then receiverId (or a participant link table) would be necessary.
  // For now, assuming point-to-point chat related to a gig.

  text: text("text").notNull(), // The content of the message
  imageUrl: text("image_url"), // Optional: If images can be sent in chat

  // For tracking read status - might be more complex in a real-time system
  // This simple boolean implies "read by the other party".
  isReadByReceiver: boolean("is_read_by_receiver").default(false).notNull(),

  moderationStatus: moderationStatusEnum("moderation_status")
    .default("PENDING")
    .notNull(),

  // Timestamps
  // 'timestamp' is a reserved keyword in some SQL dialects, using 'sentAt' for clarity
  sentAt: timestamp("sent_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  // No 'updatedAt' for chat messages typically, as they are immutable once sent.
  // If edits are allowed, then add 'updatedAt'.
});

// --- TODO: Define relations for these tables (especially ChatMessagesTable) in relations.ts or schema/index.ts ---
// export const chatMessagesRelations = relations(ChatMessagesTable, ({ one }) => ({
//   gig: one(GigsTable, { fields: [ChatMessagesTable.gigId], references: [GigsTable.id] }),
//   sender: one(UsersTable, { fields: [ChatMessagesTable.senderUserId], references: [UsersTable.id], relationName: "MessageSender" }),
// }));
