// File: app/lib/drizzle/schema/payments.ts

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  decimal,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Import enums
import { paymentStatusEnum } from "./enums";

// Import related tables for foreign keys
import { UsersTable } from "./users";
import { GigsTable } from "./gigs";

// --- PAYMENTS TABLE ---
// Records all financial transactions related to gigs
export const PaymentsTable = pgTable("payments", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  gigId: uuid("gig_id")
    .notNull()
    .references(() => GigsTable.id, { onDelete: "restrict" }), // Prevent deleting a gig if payments exist
  payerUserId: uuid("payer_user_id") // Typically the Buyer
    .notNull()
    .references(() => UsersTable.id, { onDelete: "restrict" }),
  receiverUserId: uuid("receiver_user_id") // Typically the Gig Worker
    .notNull()
    .references(() => UsersTable.id, { onDelete: "restrict" }),

  amountGross: decimal("amount_gross", { precision: 10, scale: 2 }).notNull(), // Total amount paid by the payer (e.g., buyer)
  ableFeeAmount: decimal("able_fee_amount", {
    precision: 10,
    scale: 2,
  }).notNull(), // Platform fee
  stripeFeeAmount: decimal("stripe_fee_amount", {
    precision: 10,
    scale: 2,
  }).notNull(), // Payment processor fee
  amountNetToWorker: decimal("amount_net_to_worker", {
    precision: 10,
    scale: 2,
  }).notNull(), // Gross - Able Fee - Stripe Fee

  status: paymentStatusEnum("status").default("PENDING").notNull(),

  // Stripe specific IDs
  stripePaymentIntentId: varchar("stripe_payment_intent_id", {
    length: 255,
  }).unique(),
  stripeChargeId: varchar("stripe_charge_id", { length: 255 }).unique(), // May not always be present depending on Stripe flow
  stripeTransferIdToWorker: varchar("stripe_transfer_id_to_worker", {
    length: 255,
  }), // If using Stripe Connect transfers
  stripePayoutIdToWorker: varchar("stripe_payout_id_to_worker", {
    length: 255,
  }), // If tracking payouts from Stripe to worker's bank

  invoiceUrl: text("invoice_url"), // Link to a generated PDF invoice (if applicable)
  isTesting: boolean("is_testing").default(false).notNull(), // For QA/mock payments that are still recorded
  paymentMethodDetailsJson: jsonb("payment_method_details_json"), // e.g., { cardBrand: "visa", last4: "4242" } (sensitive, ensure proper handling)

  paidAt: timestamp("paid_at", { mode: "date", withTimezone: true }), // Timestamp when payment status became COMPLETED
  refundedAt: timestamp("refunded_at", { mode: "date", withTimezone: true }),
  refundReason: text("refund_reason"),

  // Notes or internal references for this payment
  internalNotes: text("internal_notes"),

  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(), // Application logic should update this field
});

// --- MOCK PAYMENTS TABLE (for QA Testing) ---
// This table is specifically for QA to generate test payment scenarios
// without affecting real financial metrics if `isTesting` flag is used above.
// Or, if you want a completely separate table for mock transactions that don't even
// hit the main PaymentsTable with an isTesting flag.
// The current design has PaymentsTable.isTesting=true, which is often sufficient.
// If MockPaymentsTable is truly separate and NOT just PaymentsTable where isTesting=true:
export const MockPaymentsTable = pgTable("mock_payments", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  // These would reference UsersTable if mock workers/buyers are actual users
  workerUserId: uuid("worker_user_id")
    .notNull()
    .references(() => UsersTable.id, { onDelete: "cascade" }),
  buyerUserId: uuid("buyer_user_id")
    .notNull()
    .references(() => UsersTable.id, { onDelete: "cascade" }),
  // If they can reference GigsTable for context (optional for pure mock)
  // gigId: uuid('gig_id').references(() => GigsTable.id, { onDelete: 'set null' }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"), // e.g., "QA Test for high value transaction"
  scenario: text("scenario"), // e.g., "REFUND_SCENARIO", "PARTIAL_PAYMENT_TEST"
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// --- TODO: Define relations for these tables in relations.ts or schema/index.ts ---
// Example:
// export const paymentsRelations = relations(PaymentsTable, ({ one }) => ({
//   gig: one(GigsTable, { fields: [PaymentsTable.gigId], references: [GigsTable.id] }),
//   payer: one(UsersTable, { fields: [PaymentsTable.payerUserId], references: [UsersTable.id], relationName: "PaymentPayer" }),
//   receiver: one(UsersTable, { fields: [PaymentsTable.receiverUserId], references: [UsersTable.id], relationName: "PaymentReceiver" }),
// }));

// export const mockPaymentsRelations = relations(MockPaymentsTable, ({ one }) => ({
//   worker: one(UsersTable, { fields: [MockPaymentsTable.workerUserId], references: [UsersTable.id], relationName: "MockWorkerUser" }),
//   buyer: one(UsersTable, { fields: [MockPaymentsTable.buyerUserId], references: [UsersTable.id], relationName: "MockBuyerUser" }),
//   // gig: one(GigsTable, { fields: [MockPaymentsTable.gigId], references: [GigsTable.id] }),
// }));
