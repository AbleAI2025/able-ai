// File: app/lib/drizzle/schema/discount.ts

import {
  pgTable,
  uuid,
  varchar,
  decimal,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Import related tables
import { UsersTable } from "./users";
import { discountTypeEnum } from "./enums";

export const DiscountCodesTable = pgTable("discount_codes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(),

  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
  discountPercentage: decimal("discount_percentage", {
    precision: 5,
    scale: 2,
  }),

  type: discountTypeEnum("type").notNull(),

  userId: uuid("user_id")
    .notNull()
    .references(() => UsersTable.id, { onDelete: "cascade" }),

  alreadyUsed: boolean("already_used").default(false).notNull(),

  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

