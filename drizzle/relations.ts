import { relations } from "drizzle-orm/relations";
import { users, adminLogs, aiPrompts, buyerProfiles, gigs, chatMessages, gigWorkerProfiles, equipment, escalatedIssues, gigSkillsRequired, skills, mockPayments, notificationPreferences, passwordRecoveryRequests, payments, qualifications, recommendations, reviews, teamMembers, userAiUsage, userBadgesLink, badgeDefinitions } from "./schema";

export const adminLogsRelations = relations(adminLogs, ({one}) => ({
	user: one(users, {
		fields: [adminLogs.adminUserId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	adminLogs: many(adminLogs),
	aiPrompts: many(aiPrompts),
	buyerProfiles: many(buyerProfiles),
	chatMessages: many(chatMessages),
	escalatedIssues_adminUserId: many(escalatedIssues, {
		relationName: "escalatedIssues_adminUserId_users_id"
	}),
	escalatedIssues_userId: many(escalatedIssues, {
		relationName: "escalatedIssues_userId_users_id"
	}),
	gigWorkerProfiles: many(gigWorkerProfiles),
	gigs_buyerUserId: many(gigs, {
		relationName: "gigs_buyerUserId_users_id"
	}),
	gigs_workerUserId: many(gigs, {
		relationName: "gigs_workerUserId_users_id"
	}),
	mockPayments_buyerUserId: many(mockPayments, {
		relationName: "mockPayments_buyerUserId_users_id"
	}),
	mockPayments_workerUserId: many(mockPayments, {
		relationName: "mockPayments_workerUserId_users_id"
	}),
	notificationPreferences: many(notificationPreferences),
	passwordRecoveryRequests: many(passwordRecoveryRequests),
	payments_payerUserId: many(payments, {
		relationName: "payments_payerUserId_users_id"
	}),
	payments_receiverUserId: many(payments, {
		relationName: "payments_receiverUserId_users_id"
	}),
	recommendations: many(recommendations),
	reviews_authorUserId: many(reviews, {
		relationName: "reviews_authorUserId_users_id"
	}),
	reviews_targetUserId: many(reviews, {
		relationName: "reviews_targetUserId_users_id"
	}),
	teamMembers: many(teamMembers),
	userAiUsages: many(userAiUsage),
	userBadgesLinks_awardedByUserId: many(userBadgesLink, {
		relationName: "userBadgesLink_awardedByUserId_users_id"
	}),
	userBadgesLinks_userId: many(userBadgesLink, {
		relationName: "userBadgesLink_userId_users_id"
	}),
}));

export const aiPromptsRelations = relations(aiPrompts, ({one}) => ({
	user: one(users, {
		fields: [aiPrompts.lastUpdatedByUserId],
		references: [users.id]
	}),
}));

export const buyerProfilesRelations = relations(buyerProfiles, ({one, many}) => ({
	user: one(users, {
		fields: [buyerProfiles.userId],
		references: [users.id]
	}),
	teamMembers: many(teamMembers),
}));

export const chatMessagesRelations = relations(chatMessages, ({one}) => ({
	gig: one(gigs, {
		fields: [chatMessages.gigId],
		references: [gigs.id]
	}),
	user: one(users, {
		fields: [chatMessages.senderUserId],
		references: [users.id]
	}),
}));

export const gigsRelations = relations(gigs, ({one, many}) => ({
	chatMessages: many(chatMessages),
	gigSkillsRequireds: many(gigSkillsRequired),
	user_buyerUserId: one(users, {
		fields: [gigs.buyerUserId],
		references: [users.id],
		relationName: "gigs_buyerUserId_users_id"
	}),
	user_workerUserId: one(users, {
		fields: [gigs.workerUserId],
		references: [users.id],
		relationName: "gigs_workerUserId_users_id"
	}),
	payments: many(payments),
	reviews: many(reviews),
	userBadgesLinks: many(userBadgesLink),
}));

export const equipmentRelations = relations(equipment, ({one}) => ({
	gigWorkerProfile: one(gigWorkerProfiles, {
		fields: [equipment.workerProfileId],
		references: [gigWorkerProfiles.id]
	}),
}));

export const gigWorkerProfilesRelations = relations(gigWorkerProfiles, ({one, many}) => ({
	equipment: many(equipment),
	user: one(users, {
		fields: [gigWorkerProfiles.userId],
		references: [users.id]
	}),
	qualifications: many(qualifications),
	skills: many(skills),
}));

export const escalatedIssuesRelations = relations(escalatedIssues, ({one}) => ({
	user_adminUserId: one(users, {
		fields: [escalatedIssues.adminUserId],
		references: [users.id],
		relationName: "escalatedIssues_adminUserId_users_id"
	}),
	user_userId: one(users, {
		fields: [escalatedIssues.userId],
		references: [users.id],
		relationName: "escalatedIssues_userId_users_id"
	}),
}));

export const gigSkillsRequiredRelations = relations(gigSkillsRequired, ({one}) => ({
	gig: one(gigs, {
		fields: [gigSkillsRequired.gigId],
		references: [gigs.id]
	}),
	skill: one(skills, {
		fields: [gigSkillsRequired.skillId],
		references: [skills.id]
	}),
}));

export const skillsRelations = relations(skills, ({one, many}) => ({
	gigSkillsRequireds: many(gigSkillsRequired),
	gigWorkerProfile: one(gigWorkerProfiles, {
		fields: [skills.workerProfileId],
		references: [gigWorkerProfiles.id]
	}),
}));

export const mockPaymentsRelations = relations(mockPayments, ({one}) => ({
	user_buyerUserId: one(users, {
		fields: [mockPayments.buyerUserId],
		references: [users.id],
		relationName: "mockPayments_buyerUserId_users_id"
	}),
	user_workerUserId: one(users, {
		fields: [mockPayments.workerUserId],
		references: [users.id],
		relationName: "mockPayments_workerUserId_users_id"
	}),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({one}) => ({
	user: one(users, {
		fields: [notificationPreferences.userId],
		references: [users.id]
	}),
}));

export const passwordRecoveryRequestsRelations = relations(passwordRecoveryRequests, ({one}) => ({
	user: one(users, {
		fields: [passwordRecoveryRequests.userId],
		references: [users.id]
	}),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	gig: one(gigs, {
		fields: [payments.gigId],
		references: [gigs.id]
	}),
	user_payerUserId: one(users, {
		fields: [payments.payerUserId],
		references: [users.id],
		relationName: "payments_payerUserId_users_id"
	}),
	user_receiverUserId: one(users, {
		fields: [payments.receiverUserId],
		references: [users.id],
		relationName: "payments_receiverUserId_users_id"
	}),
}));

export const qualificationsRelations = relations(qualifications, ({one}) => ({
	gigWorkerProfile: one(gigWorkerProfiles, {
		fields: [qualifications.workerProfileId],
		references: [gigWorkerProfiles.id]
	}),
}));

export const recommendationsRelations = relations(recommendations, ({one}) => ({
	user: one(users, {
		fields: [recommendations.workerUserId],
		references: [users.id]
	}),
}));

export const reviewsRelations = relations(reviews, ({one}) => ({
	user_authorUserId: one(users, {
		fields: [reviews.authorUserId],
		references: [users.id],
		relationName: "reviews_authorUserId_users_id"
	}),
	gig: one(gigs, {
		fields: [reviews.gigId],
		references: [gigs.id]
	}),
	user_targetUserId: one(users, {
		fields: [reviews.targetUserId],
		references: [users.id],
		relationName: "reviews_targetUserId_users_id"
	}),
}));

export const teamMembersRelations = relations(teamMembers, ({one}) => ({
	buyerProfile: one(buyerProfiles, {
		fields: [teamMembers.buyerProfileId],
		references: [buyerProfiles.id]
	}),
	user: one(users, {
		fields: [teamMembers.memberUserId],
		references: [users.id]
	}),
}));

export const userAiUsageRelations = relations(userAiUsage, ({one}) => ({
	user: one(users, {
		fields: [userAiUsage.userId],
		references: [users.id]
	}),
}));

export const userBadgesLinkRelations = relations(userBadgesLink, ({one}) => ({
	user_awardedByUserId: one(users, {
		fields: [userBadgesLink.awardedByUserId],
		references: [users.id],
		relationName: "userBadgesLink_awardedByUserId_users_id"
	}),
	badgeDefinition: one(badgeDefinitions, {
		fields: [userBadgesLink.badgeId],
		references: [badgeDefinitions.id]
	}),
	gig: one(gigs, {
		fields: [userBadgesLink.gigId],
		references: [gigs.id]
	}),
	user_userId: one(users, {
		fields: [userBadgesLink.userId],
		references: [users.id],
		relationName: "userBadgesLink_userId_users_id"
	}),
}));

export const badgeDefinitionsRelations = relations(badgeDefinitions, ({many}) => ({
	userBadgesLinks: many(userBadgesLink),
}));