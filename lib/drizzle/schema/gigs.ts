// File: app/lib/drizzle/schema/gigs.ts

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  jsonb,
  uniqueIndex, // For creating unique indexes
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Import enums
import {
  gigStatusEnum,
  moderationStatusEnum,
  cancellationPartyEnum,
} from "./enums"; // Assuming enums.ts is in the same directory

// Import related tables for foreign keys
import { UsersTable, GigWorkerProfilesTable } from "./users"; // Assuming users.ts exports these
import { DiscountCodesTable } from "./payments";

// --- SKILLS TABLE ---
// Skills specific to a GigWorkerProfile
export const SkillsTable = pgTable("skills", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workerProfileId: uuid("worker_profile_id")
    .notNull()
    .references(() => GigWorkerProfilesTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  experienceMonths: integer("experience_months").notNull(),
  experienceYears: decimal("experience_years", { precision: 4, scale: 1 })
    .$type<number>()
    .notNull(),
  agreedRate: decimal("agreed_rate", { precision: 10, scale: 2 }).notNull(),
  skillVideoUrl: text("skill_video_url"),
  adminTags: text("admin_tags").array(),
  ableGigs: integer("able_gigs"),
  images: jsonb("images")
    .$type<string[]>()
    .default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(), // Application logic should update this field on record changes
});

// --- QUALIFICATIONS TABLE ---
export const QualificationsTable = pgTable("qualifications", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workerProfileId: uuid("worker_profile_id")
    .notNull()
    .references(() => GigWorkerProfilesTable.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  institution: varchar("institution", { length: 255 }),
  yearAchieved: integer("year_achieved"),
  description: text("description"),
  documentUrl: text("document_url"),
  isVerifiedByAdmin: boolean("is_verified_by_admin").default(false),
  skillId: uuid("skill_id").references(() => SkillsTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(), // Application logic should update this field
});

// --- EQUIPMENT TABLE ---
export const EquipmentTable = pgTable("equipment", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workerProfileId: uuid("worker_profile_id")
    .notNull()
    .references(() => GigWorkerProfilesTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isVerifiedByAdmin: boolean("is_verified_by_admin").default(false),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(), // Application logic should update this field
});

// --- GIGS TABLE ---
export const GigsTable = pgTable("gigs", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  buyerUserId: uuid("buyer_user_id")
    .notNull()
    .references(() => UsersTable.id, { onDelete: "restrict" }),
  workerUserId: uuid("worker_user_id").references(() => UsersTable.id, {
    onDelete: "restrict",
  }), // Nullable until worker accepts

  titleInternal: varchar("title_internal", { length: 255 }).notNull(),
  fullDescription: text("full_description"),
  exactLocation: text("exact_location"), // Full address
  addressJson: jsonb("address_json"), // Structured: { street, city, postcode, country, lat?, lng? }

  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),

  agreedRate: decimal("agreed_rate", { precision: 10, scale: 2 }).notNull(),
  estimatedHours: decimal("estimated_hours", { precision: 5, scale: 2 }),
  totalAgreedPrice: decimal("total_agreed_price", { precision: 10, scale: 2 }),

  finalRate: decimal("final_rate", { precision: 10, scale: 2 }),
  finalHours: decimal("final_hours", { precision: 5, scale: 2 }),
  finalAgreedPrice: decimal("final_agreed_price", { precision: 10, scale: 2 }),

  statusInternal: gigStatusEnum("status_internal")
    .default("PENDING_WORKER_ACCEPTANCE")
    .notNull(),

  ableFeePercent: decimal("able_fee_percent", { precision: 5, scale: 4 }), // e.g., 0.0650 for 6.5%
  stripeFeePercent: decimal("stripe_fee_percent", { precision: 5, scale: 4 }),
  stripeFeeFixed: decimal("stripe_fee_fixed", { precision: 10, scale: 2 }), // e.g., 0.20
  promoCodeApplied: varchar("promo_code_applied", { length: 50 }),

  moderationStatus: moderationStatusEnum("moderation_status")
    .default("PENDING")
    .notNull(),
  cancellationReason: text("cancellation_reason"),
  cancellationParty: cancellationPartyEnum("cancellation_party"),

  notesForWorker: text("notes_for_worker"),
  notesForBuyer: text("notes_for_buyer"),
  adjustmentNotes: text("adjustment_notes"),

  adjustedAt: timestamp("adjusted_at", { mode: "date", withTimezone: true }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(), // Application logic should update this field
  discountCodeId: uuid("discount_code_id").references(
    () => DiscountCodesTable.id
  ),
});

// --- GIG SKILLS REQUIRED TABLE ---
// Links specific skills required by a Gig posting.
export const GigSkillsRequiredTable = pgTable(
  "gig_skills_required",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`), // Using UUID as PK for flexibility
    gigId: uuid("gig_id")
      .notNull()
      .references(() => GigsTable.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id").references(() => SkillsTable.id, {
      onDelete: "no action",
    }),
    skillName: varchar("skill_name", { length: 100 }).notNull(), // Name of the skill required for THIS gig
    isRequired: boolean("is_required").default(true),
    notes: text("notes"), // e.g. "Must have 3+ years experience in this specific skill for this gig"gigs
  },
  (table) => [
    // Array syntax for table-level constraints
    uniqueIndex("gig_id_skill_name_unique_idx").on(
      table.gigId,
      table.skillName
    ), // Ensures a gig doesn't list the same skill name twice
  ]
);

// Note: Changed primaryKey strategy for GigSkillsRequiredTable to a composite unique key
// based on gigId and skillName, assuming a skill name is unique per gig. If you need multiple
// entries for the same skill name with different notes (unlikely), then a separate UUID PK is fine.
// For simplicity and to avoid duplicate skill requirements, composite PK is often better.
// If you go with a UUID primary key for this table (as in your original), you'd then add a
// unique constraint: uniqueConstraint('unique_gig_skill_name').on(GigSkillsRequiredTable.gigId, GigSkillsRequiredTable.skillName)

// --- TODO: Define relations for these tables in relations.ts or schema/index.ts ---
// Example relations:
// export const gigWorkerProfilesRelations = relations(GigWorkerProfilesTable, ({ many }) => ({
//   skills: many(SkillsTable),
//   qualifications: many(QualificationsTable),
//   equipment: many(EquipmentTable),
// }));

// export const gigsRelations = relations(GigsTable, ({ one, many }) => ({
//    buyer: one(UsersTable, { fields: [GigsTable.buyerUserId], references: [UsersTable.id], relationName: "GigBuyer" }),
//    worker: one(UsersTable, { fields: [GigsTable.workerUserId], references: [UsersTable.id], relationName: "GigWorker" }),
//    requiredSkills: many(GigSkillsRequiredTable),
// }));
