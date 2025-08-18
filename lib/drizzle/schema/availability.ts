// File: lib/drizzle/schema/availability.ts

import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
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
  
  startTime: timestamp("start_time", { withTimezone: true })
    .notNull(),
  
  endTime: timestamp("end_time", { withTimezone: true })
    .notNull(),
  
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
}));
