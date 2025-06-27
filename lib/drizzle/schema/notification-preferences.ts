import {
  pgTable,
  uuid,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { UsersTable } from "./users";

export const NotificationPreferencesTable = pgTable("notification_preferences", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => UsersTable.id, { onDelete: "cascade" }),

  // Email preferences
  emailGigUpdates: boolean("email_gig_updates").default(true).notNull(),
  emailPlatformAnnouncements: boolean("email_platform_announcements").default(true).notNull(),
  emailMarketing: boolean("email_marketing").default(false).notNull(),

  // SMS preferences
  smsGigAlerts: boolean("sms_gig_alerts").default(true).notNull(),

  // FCM preferences
  fcmUpdates: boolean("fcm_updates").default(true).notNull(),

  // Timestamps
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),

  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});