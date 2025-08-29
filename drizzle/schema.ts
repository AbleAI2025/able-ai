import { pgTable, foreignKey, serial, uuid, varchar, jsonb, timestamp, unique, text, integer, boolean, numeric, uniqueIndex, index, date, vector } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const adminLogs = pgTable("admin_logs", {
	id: serial().primaryKey().notNull(),
	adminUserId: uuid("admin_user_id").notNull(),
	action: varchar({ length: 255 }).notNull(),
	targetEntityType: varchar("target_entity_type", { length: 100 }),
	targetEntityId: varchar("target_entity_id", { length: 255 }),
	detailsJson: jsonb("details_json"),
	ipAddress: varchar("ip_address", { length: 45 }),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.adminUserId],
			foreignColumns: [users.id],
			name: "admin_logs_admin_user_id_users_id_fk"
		}).onDelete("restrict"),
]);

export const aiPrompts = pgTable("ai_prompts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	promptKey: varchar("prompt_key", { length: 100 }).notNull(),
	promptText: text("prompt_text").notNull(),
	description: text(),
	version: integer().default(1).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	lastUpdatedByUserId: uuid("last_updated_by_user_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.lastUpdatedByUserId],
			foreignColumns: [users.id],
			name: "ai_prompts_last_updated_by_user_id_users_id_fk"
		}).onDelete("set null"),
	unique("ai_prompts_prompt_key_unique").on(table.promptKey),
]);

export const badgeDefinitions = pgTable("badge_definitions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text().notNull(),
	iconUrlOrLucideName: varchar("icon_url_or_lucide_name", { length: 255 }),
	// TODO: failed to parse database type 'badge_type_enum'
	type: text("type").notNull(),
	criteriaJson: jsonb("criteria_json"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	unique("badge_definitions_name_unique").on(table.name),
]);

export const buyerProfiles = pgTable("buyer_profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	fullCompanyName: varchar("full_company_name", { length: 255 }),
	vatNumber: varchar("vat_number", { length: 50 }),
	businessRegistrationNumber: varchar("business_registration_number", { length: 100 }),
	billingAddressJson: jsonb("billing_address_json"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	videoUrl: text("video_url"),
	companyRole: varchar("company_role", { length: 100 }),
	responseRateInternal: numeric("response_rate_internal", { precision: 5, scale:  2 }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "buyer_profiles_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("buyer_profiles_user_id_unique").on(table.userId),
]);

export const chatMessages = pgTable("chat_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	gigId: uuid("gig_id").notNull(),
	senderUserId: uuid("sender_user_id").notNull(),
	text: text().notNull(),
	imageUrl: text("image_url"),
	isReadByReceiver: boolean("is_read_by_receiver").default(false).notNull(),
	// TODO: failed to parse database type 'moderation_status_enum'
	moderationStatus: text("moderation_status").notNull(),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.gigId],
			foreignColumns: [gigs.id],
			name: "chat_messages_gig_id_gigs_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.senderUserId],
			foreignColumns: [users.id],
			name: "chat_messages_sender_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const equipment = pgTable("equipment", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workerProfileId: uuid("worker_profile_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	isVerifiedByAdmin: boolean("is_verified_by_admin").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.workerProfileId],
			foreignColumns: [gigWorkerProfiles.id],
			name: "equipment_worker_profile_id_gig_worker_profiles_id_fk"
		}).onDelete("cascade"),
]);

export const escalatedIssues = pgTable("escalated_issues", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	firestoreMessageId: varchar("firestore_message_id", { length: 255 }),
	gigId: varchar("gig_id", { length: 255 }),
	issueType: varchar("issue_type", { length: 100 }),
	description: text(),
	status: varchar({ length: 50 }).default('OPEN').notNull(),
	adminUserId: uuid("admin_user_id"),
	resolutionNotes: text("resolution_notes"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.adminUserId],
			foreignColumns: [users.id],
			name: "escalated_issues_admin_user_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "escalated_issues_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const gigSkillsRequired = pgTable("gig_skills_required", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	gigId: uuid("gig_id").notNull(),
	skillName: varchar("skill_name", { length: 100 }).notNull(),
	isRequired: boolean("is_required").default(true),
	notes: text(),
	skillId: uuid("skill_id"),
}, (table) => [
	uniqueIndex("gig_id_skill_name_unique_idx").using("btree", table.gigId.asc().nullsLast().op("text_ops"), table.skillName.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.gigId],
			foreignColumns: [gigs.id],
			name: "gig_skills_required_gig_id_gigs_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.skillId],
			foreignColumns: [skills.id],
			name: "gig_skills_required_skill_id_skills_id_fk"
		}),
]);

export const gigWorkerAwards = pgTable("gig_worker_awards", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	icon: varchar({ length: 255 }).notNull(),
	textLines: text("text_lines").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	unique("gig_worker_awards_user_id_unique").on(table.userId),
]);

export const gigWorkerProfiles = pgTable("gig_worker_profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	fullBio: text("full_bio"),
	privateNotes: text("private_notes"),
	responseRateInternal: numeric("response_rate_internal", { precision: 5, scale:  2 }),
	availabilityJson: jsonb("availability_json"),
	semanticProfileJson: jsonb("semantic_profile_json"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	location: text(),
	address: text(),
	latitude: numeric({ precision: 10, scale:  7 }),
	longitude: numeric({ precision: 10, scale:  7 }),
	hashTags: jsonb("hash_tags"),
	videoUrl: text("video_url"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "gig_worker_profiles_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("gig_worker_profiles_user_id_unique").on(table.userId),
]);

export const gigWorkerSkills = pgTable("gig_worker_skills", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	ableGigs: varchar("able_gigs", { length: 255 }),
	experience: varchar({ length: 255 }),
	eph: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	unique("gig_worker_skills_user_id_unique").on(table.userId),
]);

export const gigWorkerStatistics = pgTable("gig_worker_statistics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	icon: varchar({ length: 255 }).notNull(),
	value: varchar({ length: 255 }).notNull(),
	label: varchar({ length: 255 }).notNull(),
	iconColor: varchar("icon_color", { length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	unique("gig_worker_statistics_user_id_unique").on(table.userId),
]);

export const gigWorkerWorkerReviews = pgTable("gig_worker_worker_reviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	workerName: varchar("worker_name", { length: 255 }).notNull(),
	reviewText: text("review_text").notNull(),
	rating: integer().notNull(),
	date: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	workerAvatarUrl: varchar("worker_avatar_url", { length: 512 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	unique("gig_worker_worker_reviews_user_id_unique").on(table.userId),
]);

export const gigs = pgTable("gigs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	buyerUserId: uuid("buyer_user_id").notNull(),
	workerUserId: uuid("worker_user_id"),
	titleInternal: varchar("title_internal", { length: 255 }).notNull(),
	fullDescription: text("full_description"),
	exactLocation: text("exact_location"),
	addressJson: jsonb("address_json"),
	startTime: timestamp("start_time", { withTimezone: true, mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { withTimezone: true, mode: 'string' }).notNull(),
	agreedRate: numeric("agreed_rate", { precision: 10, scale:  2 }).notNull(),
	estimatedHours: numeric("estimated_hours", { precision: 5, scale:  2 }),
	totalAgreedPrice: numeric("total_agreed_price", { precision: 10, scale:  2 }),
	// TODO: failed to parse database type 'gig_status_enum'
	statusInternal: text("status_internal").notNull(),
	ableFeePercent: numeric("able_fee_percent", { precision: 5, scale:  4 }),
	stripeFeePercent: numeric("stripe_fee_percent", { precision: 5, scale:  4 }),
	stripeFeeFixed: numeric("stripe_fee_fixed", { precision: 10, scale:  2 }),
	promoCodeApplied: varchar("promo_code_applied", { length: 50 }),
	// TODO: failed to parse database type 'moderation_status_enum'
	moderationStatus: text("moderation_status").notNull(),
	cancellationReason: text("cancellation_reason"),
	// TODO: failed to parse database type 'cancellation_party_enum'
	cancellationParty: text("cancellation_party"),
	notesForWorker: text("notes_for_worker"),
	notesForBuyer: text("notes_for_buyer"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	finalRate: numeric("final_rate", { precision: 10, scale:  2 }),
	finalHours: numeric("final_hours", { precision: 5, scale:  2 }),
	finalAgreedPrice: numeric("final_agreed_price", { precision: 10, scale:  2 }),
	adjustmentNotes: text("adjustment_notes"),
	adjustedAt: timestamp("adjusted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.buyerUserId],
			foreignColumns: [users.id],
			name: "gigs_buyer_user_id_users_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.workerUserId],
			foreignColumns: [users.id],
			name: "gigs_worker_user_id_users_id_fk"
		}).onDelete("restrict"),
]);

export const mockPayments = pgTable("mock_payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workerUserId: uuid("worker_user_id").notNull(),
	buyerUserId: uuid("buyer_user_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	description: text(),
	scenario: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.buyerUserId],
			foreignColumns: [users.id],
			name: "mock_payments_buyer_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.workerUserId],
			foreignColumns: [users.id],
			name: "mock_payments_worker_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const notificationPreferences = pgTable("notification_preferences", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	emailGigUpdates: boolean("email_gig_updates").default(true).notNull(),
	emailPlatformAnnouncements: boolean("email_platform_announcements").default(true).notNull(),
	emailMarketing: boolean("email_marketing").default(false).notNull(),
	smsGigAlerts: boolean("sms_gig_alerts").default(true).notNull(),
	fcmUpdates: boolean("fcm_updates").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notification_preferences_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("notification_preferences_user_id_unique").on(table.userId),
]);

export const passwordRecoveryRequests = pgTable("password_recovery_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	tokenHash: varchar("token_hash", { length: 255 }).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	isUsed: boolean("is_used").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "password_recovery_requests_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("password_recovery_requests_token_hash_unique").on(table.tokenHash),
]);

export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	gigId: uuid("gig_id").notNull(),
	payerUserId: uuid("payer_user_id").notNull(),
	receiverUserId: uuid("receiver_user_id").notNull(),
	amountGross: numeric("amount_gross", { precision: 10, scale:  2 }).notNull(),
	ableFeeAmount: numeric("able_fee_amount", { precision: 10, scale:  2 }).notNull(),
	stripeFeeAmount: numeric("stripe_fee_amount", { precision: 10, scale:  2 }).notNull(),
	amountNetToWorker: numeric("amount_net_to_worker", { precision: 10, scale:  2 }).notNull(),
	// TODO: failed to parse database type 'payment_status_enum'
	status: text("status").notNull(),
	stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
	stripeChargeId: varchar("stripe_charge_id", { length: 255 }),
	stripeTransferIdToWorker: varchar("stripe_transfer_id_to_worker", { length: 255 }),
	stripePayoutIdToWorker: varchar("stripe_payout_id_to_worker", { length: 255 }),
	invoiceUrl: text("invoice_url"),
	isTesting: boolean("is_testing").default(false).notNull(),
	paymentMethodDetailsJson: jsonb("payment_method_details_json"),
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }),
	refundedAt: timestamp("refunded_at", { withTimezone: true, mode: 'string' }),
	refundReason: text("refund_reason"),
	internalNotes: text("internal_notes"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.gigId],
			foreignColumns: [gigs.id],
			name: "payments_gig_id_gigs_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.payerUserId],
			foreignColumns: [users.id],
			name: "payments_payer_user_id_users_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.receiverUserId],
			foreignColumns: [users.id],
			name: "payments_receiver_user_id_users_id_fk"
		}).onDelete("restrict"),
	unique("payments_stripe_payment_intent_id_unique").on(table.stripePaymentIntentId),
	unique("payments_stripe_charge_id_unique").on(table.stripeChargeId),
]);

export const qualifications = pgTable("qualifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workerProfileId: uuid("worker_profile_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	institution: varchar({ length: 255 }),
	yearAchieved: integer("year_achieved"),
	description: text(),
	documentUrl: text("document_url"),
	isVerifiedByAdmin: boolean("is_verified_by_admin").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.workerProfileId],
			foreignColumns: [gigWorkerProfiles.id],
			name: "qualifications_worker_profile_id_gig_worker_profiles_id_fk"
		}).onDelete("cascade"),
]);

export const recommendations = pgTable("recommendations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workerUserId: uuid("worker_user_id").notNull(),
	recommendationCode: varchar("recommendation_code", { length: 50 }).notNull(),
	recommendationText: text("recommendation_text").notNull(),
	relationship: text().notNull(),
	recommenderName: varchar("recommender_name", { length: 100 }).notNull(),
	recommenderEmail: varchar("recommender_email", { length: 255 }).notNull(),
	isVerified: boolean("is_verified").default(false).notNull(),
	// TODO: failed to parse database type 'moderation_status_enum'
	moderationStatus: text("moderation_status").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("recommendations_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("recommendations_recommendation_code_idx").using("btree", table.recommendationCode.asc().nullsLast().op("text_ops")),
	index("recommendations_worker_user_id_idx").using("btree", table.workerUserId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.workerUserId],
			foreignColumns: [users.id],
			name: "recommendations_worker_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("recommendations_recommendation_code_key").on(table.recommendationCode),
]);

export const reviews = pgTable("reviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	gigId: uuid("gig_id"),
	authorUserId: uuid("author_user_id"),
	targetUserId: uuid("target_user_id").notNull(),
	rating: integer().notNull(),
	comment: text(),
	wouldWorkAgain: boolean("would_work_again"),
	awardedBadgeNamesToTargetJson: jsonb("awarded_badge_names_to_target_json"),
	isPublic: boolean("is_public").default(true).notNull(),
	// TODO: failed to parse database type 'review_type_enum'
	type: text("type").notNull(),
	// TODO: failed to parse database type 'moderation_status_enum'
	moderationStatus: text("moderation_status").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	// TODO: failed to parse database type 'active_role_context_enum'
	targetRole: text("target_role"),
	recommendationText: text("recommendation_text"),
	relationship: text(),
	recommenderName: text("recommender_name"),
	recommenderEmail: text("recommender_email"),
}, (table) => [
	uniqueIndex("author_target_gig_unique_idx").using("btree", table.authorUserId.asc().nullsLast().op("uuid_ops"), table.targetUserId.asc().nullsLast().op("uuid_ops"), table.gigId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.authorUserId],
			foreignColumns: [users.id],
			name: "reviews_author_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.gigId],
			foreignColumns: [gigs.id],
			name: "reviews_gig_id_gigs_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.targetUserId],
			foreignColumns: [users.id],
			name: "reviews_target_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const skills = pgTable("skills", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workerProfileId: uuid("worker_profile_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	experienceMonths: integer("experience_months").notNull(),
	agreedRate: numeric("agreed_rate", { precision: 10, scale:  2 }).notNull(),
	skillVideoUrl: text("skill_video_url"),
	adminTags: text("admin_tags").array(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	ableGigs: integer("able_gigs"),
	images: jsonb().default([]),
	experienceYears: numeric("experience_years", { precision: 4, scale:  1 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.workerProfileId],
			foreignColumns: [gigWorkerProfiles.id],
			name: "skills_worker_profile_id_gig_worker_profiles_id_fk"
		}).onDelete("cascade"),
]);

export const systemFlags = pgTable("system_flags", {
	flagKey: varchar("flag_key", { length: 255 }).notNull(),
	flagValue: jsonb("flag_value").notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	unique("system_flags_flag_key_unique").on(table.flagKey),
]);

export const teamMembers = pgTable("team_members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	buyerProfileId: uuid("buyer_profile_id").notNull(),
	memberUserId: uuid("member_user_id"),
	name: varchar({ length: 255 }),
	email: varchar({ length: 255 }),
	roleInTeam: varchar("role_in_team", { length: 100 }),
	permissionsJson: jsonb("permissions_json"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.buyerProfileId],
			foreignColumns: [buyerProfiles.id],
			name: "team_members_buyer_profile_id_buyer_profiles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.memberUserId],
			foreignColumns: [users.id],
			name: "team_members_member_user_id_users_id_fk"
		}).onDelete("set null"),
]);

export const tenants = pgTable("tenants", {
	id: uuid().default(sql`public.uuid_generate_v7()`).notNull(),
	name: text(),
	created: timestamp({ mode: 'string' }).default(sql`LOCALTIMESTAMP`).notNull(),
	updated: timestamp({ mode: 'string' }).default(sql`LOCALTIMESTAMP`).notNull(),
	deleted: timestamp({ mode: 'string' }),
	computeId: uuid("compute_id"),
}, (table) => [
	uniqueIndex("tenants_pkey").using("btree", table.id.asc().nullsLast().op("uuid_ops")),
]);

export const userAiUsage = pgTable("user_ai_usage", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	date: date().notNull(),
	aiMessageCount: integer("ai_message_count").default(0).notNull(),
	lastInteractionTimestamp: timestamp("last_interaction_timestamp", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_ai_usage_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const userBadgesLink = pgTable("user_badges_link", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	badgeId: uuid("badge_id").notNull(),
	awardedAt: timestamp("awarded_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	awardedBySystem: boolean("awarded_by_system").default(false),
	awardedByUserId: uuid("awarded_by_user_id"),
	gigId: uuid("gig_id"),
	notes: text(),
}, (table) => [
	uniqueIndex("user_badge_unique_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.badgeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.awardedByUserId],
			foreignColumns: [users.id],
			name: "user_badges_link_awarded_by_user_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.badgeId],
			foreignColumns: [badgeDefinitions.id],
			name: "user_badges_link_badge_id_badge_definitions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.gigId],
			foreignColumns: [gigs.id],
			name: "user_badges_link_gig_id_gigs_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_badges_link_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	firebaseUid: varchar("firebase_uid", { length: 128 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	fullName: varchar("full_name", { length: 255 }).notNull(),
	phone: varchar({ length: 30 }),
	// TODO: failed to parse database type 'user_app_role_enum'
	appRole: text("app_role").notNull(),
	isGigWorker: boolean("is_gig_worker").default(false).notNull(),
	isBuyer: boolean("is_buyer").default(false).notNull(),
	// TODO: failed to parse database type 'active_role_context_enum'
	lastRoleUsed: text("last_role_used"),
	lastViewVisitedBuyer: text("last_view_visited_buyer"),
	lastViewVisitedWorker: text("last_view_visited_worker"),
	stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
	stripeConnectAccountId: varchar("stripe_connect_account_id", { length: 255 }),
	// TODO: failed to parse database type 'rtw_kyc_status_enum'
	rtwStatus: text("rtw_status"),
	rtwDocumentUrl: text("rtw_document_url"),
	// TODO: failed to parse database type 'rtw_kyc_status_enum'
	kycStatus: text("kyc_status"),
	kycDocumentUrl: text("kyc_document_url"),
	isBanned: boolean("is_banned").default(false).notNull(),
	isDisabled: boolean("is_disabled").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	profileVisibility: boolean("profile_visibility").default(false),
	canReceivePayouts: boolean("can_receive_payouts").default(false).notNull(),
	// TODO: failed to parse database type 'stripe_account_status_enum'
	stripeAccountStatus: text("stripe_account_status"),
}, (table) => [
	unique("users_firebase_uid_unique").on(table.firebaseUid),
	unique("users_email_unique").on(table.email),
	unique("users_stripe_customer_id_unique").on(table.stripeCustomerId),
	unique("users_stripe_connect_account_id_unique").on(table.stripeConnectAccountId),
]);

export const vectorEmbeddings = pgTable("vector_embeddings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityType: text("entity_type").notNull(),
	entityPostgresId: uuid("entity_postgres_id"),
	entityFirestoreId: text("entity_firestore_id"),
	embedding: vector({ dimensions: 1536 }).notNull(),
	sourceTextHash: varchar("source_text_hash", { length: 64 }),
	embeddingModelUsed: varchar("embedding_model_used", { length: 100 }).default('text-embedding-ada-002'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("embedding_hnsw_cosine_idx").using("hnsw", table.embedding.asc().nullsLast().op("vector_cosine_ops")),
]);

export const workerAvailability = pgTable("worker_availability", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	startTime: timestamp("start_time", { withTimezone: true, mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { withTimezone: true, mode: 'string' }).notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	days: jsonb(),
	frequency: varchar({ length: 50 }),
	startDate: varchar("start_date", { length: 50 }),
	startTimeStr: varchar("start_time_str", { length: 10 }),
	endTimeStr: varchar("end_time_str", { length: 10 }),
	ends: varchar({ length: 50 }),
	occurrences: integer(),
	endDate: varchar("end_date", { length: 50 }),
}, (table) => [
	index("worker_availability_user_pattern_idx").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.frequency.asc().nullsLast().op("uuid_ops"), table.startDate.asc().nullsLast().op("uuid_ops")),
]);
