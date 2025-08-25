// File: lib/drizzle/schema/availability.ts

import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  jsonb,
  varchar,
  integer,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Import related tables for foreign keys
import { UsersTable } from "./users";

// --- WORKER AVAILABILITY TABLE ---
// Stores individual availability/unavailability time slots for workers
export const WorkerAvailabilityTable = pgTable("worker_availability", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  
  userId: uuid("user_id")
    .notNull()
    .references(() => UsersTable.id, { onDelete: "cascade" }), // If user is deleted, their availability is too
  
  // For recurring availability patterns (new fields)
  days: jsonb("days"), // Array of days like ["Mon", "Wed", "Fri"]
  frequency: varchar("frequency", { length: 50 }), // "daily", "weekly", "monthly", "yearly"
  startDate: varchar("start_date", { length: 50 }), // Start date for recurring pattern
  startTimeStr: varchar("start_time_str", { length: 10 }), // Time like "09:00" for recurring pattern
  endTimeStr: varchar("end_time_str", { length: 10 }), // Time like "19:00" for recurring pattern
  ends: varchar("ends", { length: 50 }), // "never", "after_occurrences", "on_date"
  occurrences: integer("occurrences"), // Number of occurrences if ends = "after_occurrences"
  endDate: varchar("end_date", { length: 50 }), // End date if ends = "on_date"
  
  // For individual time slots (existing fields)
  startTime: timestamp("start_time", { withTimezone: true }), // Individual slot start
  endTime: timestamp("end_time", { withTimezone: true }), // Individual slot end
  
  notes: text("notes"), // Optional notes about the availability period
  
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}, (table) => ({
  // Index for efficient queries by user and time range
  userTimeIndex: index("worker_availability_user_time_idx").on(
    table.userId,
    table.startTime,
    table.endTime
  ),
  
  // Index for overlap detection queries
  timeRangeIndex: index("worker_availability_time_range_idx").on(
    table.startTime,
    table.endTime
  ),
  
  // Index for recurring pattern queries
  userPatternIndex: index("worker_availability_user_pattern_idx").on(
    table.userId,
    table.frequency,
    table.startDate
  ),
}));
