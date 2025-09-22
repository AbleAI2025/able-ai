import { relations } from "drizzle-orm/relations";
import { users, discountCodes, notificationPreferences, gigs, gigSkillsRequired, skills, passwordRecoveryRequests, chatMessages, gigWorkerProfiles, qualifications, equipment, payments, teamMembers, buyerProfiles, adminLogs, reviews, aiPrompts, userBadgesLink, badgeDefinitions, mockPayments, userAiUsage, escalatedIssues, recommendations } from "./schema";

export const discountCodesRelations = relations(discountCodes, ({one}) => ({
	user: one(users, {
		fields: [discountCodes.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	discountCodes: many(discountCodes),
	notificationPreferences: many(notificationPreferences),
	passwordRecoveryRequests: many(passwordRecoveryRequests),
	chatMessages: many(chatMessages),
	payments_payerUserId: many(payments, {
		relationName: "payments_payerUserId_users_id"
	}),
	payments_receiverUserId: many(payments, {
		relationName: "payments_receiverUserId_users_id"
	}),
	teamMembers: many(teamMembers),
	adminLogs: many(adminLogs),
	gigs_buyerUserId: many(gigs, {
		relationName: "gigs_buyerUserId_users_id"
	}),
	gigs_workerUserId: many(gigs, {
		relationName: "gigs_workerUserId_users_id"
	}),
	reviews_authorUserId: many(reviews, {
		relationName: "reviews_authorUserId_users_id"
	}),
	reviews_targetUserId: many(reviews, {
		relationName: "reviews_targetUserId_users_id"
	}),
	gigWorkerProfiles: many(gigWorkerProfiles),
	aiPrompts: many(aiPrompts),
	userBadgesLinks_awardedByUserId: many(userBadgesLink, {
		relationName: "userBadgesLink_awardedByUserId_users_id"
	}),
	userBadgesLinks_userId: many(userBadgesLink, {
		relationName: "userBadgesLink_userId_users_id"
	}),
	mockPayments_buyerUserId: many(mockPayments, {
		relationName: "mockPayments_buyerUserId_users_id"
	}),
	mockPayments_workerUserId: many(mockPayments, {
		relationName: "mockPayments_workerUserId_users_id"
	}),
	userAiUsages: many(userAiUsage),
	escalatedIssues_adminUserId: many(escalatedIssues, {
		relationName: "escalatedIssues_adminUserId_users_id"
	}),
	escalatedIssues_userId: many(escalatedIssues, {
		relationName: "escalatedIssues_userId_users_id"
	}),
  buyerProfiles: many(buyerProfiles),
  recommendations: many(recommendations),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({one}) => ({
	user: one(users, {
		fields: [notificationPreferences.userId],
		references: [users.id]
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

export const gigsRelations = relations(gigs, ({one, many}) => ({
	gigSkillsRequireds: many(gigSkillsRequired),
	chatMessages: many(chatMessages),
	payments: many(payments),
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
	reviews: many(reviews),
	userBadgesLinks: many(userBadgesLink),
}));

export const skillsRelations = relations(skills, ({one, many}) => ({
	gigSkillsRequireds: many(gigSkillsRequired),
	qualifications: many(qualifications),
	gigWorkerProfile: one(gigWorkerProfiles, {
		fields: [skills.workerProfileId],
		references: [gigWorkerProfiles.id]
	}),
	reviews: many(reviews),
}));

export const passwordRecoveryRequestsRelations = relations(passwordRecoveryRequests, ({one}) => ({
	user: one(users, {
		fields: [passwordRecoveryRequests.userId],
		references: [users.id]
	}),
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

export const qualificationsRelations = relations(qualifications, ({one}) => ({
	gigWorkerProfile: one(gigWorkerProfiles, {
		fields: [qualifications.workerProfileId],
		references: [gigWorkerProfiles.id]
	}),
	skill: one(skills, {
		fields: [qualifications.skillId],
		references: [skills.id]
	}),
}));

export const gigWorkerProfilesRelations = relations(gigWorkerProfiles, ({one, many}) => ({
	qualifications: many(qualifications),
	equipment: many(equipment),
	skills: many(skills),
	user: one(users, {
		fields: [gigWorkerProfiles.userId],
		references: [users.id]
	}),
}));

export const equipmentRelations = relations(equipment, ({one}) => ({
	gigWorkerProfile: one(gigWorkerProfiles, {
		fields: [equipment.workerProfileId],
		references: [gigWorkerProfiles.id]
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

export const teamMembersRelations = relations(teamMembers, ({one}) => ({
	user: one(users, {
		fields: [teamMembers.memberUserId],
		references: [users.id]
	}),
	buyerProfile: one(buyerProfiles, {
		fields: [teamMembers.buyerProfileId],
		references: [buyerProfiles.id]
	}),
}));

export const buyerProfilesRelations = relations(buyerProfiles, ({one, many}) => ({
	teamMembers: many(teamMembers),
	user: one(users, {
		fields: [buyerProfiles.userId],
		references: [users.id]
	}),
}));

export const adminLogsRelations = relations(adminLogs, ({one}) => ({
	user: one(users, {
		fields: [adminLogs.adminUserId],
		references: [users.id]
	}),
}));

export const reviewsRelations = relations(reviews, ({one}) => ({
	gig: one(gigs, {
		fields: [reviews.gigId],
		references: [gigs.id]
	}),
	user_authorUserId: one(users, {
		fields: [reviews.authorUserId],
		references: [users.id],
		relationName: "reviews_authorUserId_users_id"
	}),
	user_targetUserId: one(users, {
		fields: [reviews.targetUserId],
		references: [users.id],
		relationName: "reviews_targetUserId_users_id"
	}),
	skill: one(skills, {
		fields: [reviews.skillId],
		references: [skills.id]
	}),
}));

export const aiPromptsRelations = relations(aiPrompts, ({one}) => ({
	user: one(users, {
		fields: [aiPrompts.lastUpdatedByUserId],
		references: [users.id]
	}),
}));

export const userBadgesLinkRelations = relations(userBadgesLink, ({one}) => ({
	gig: one(gigs, {
		fields: [userBadgesLink.gigId],
		references: [gigs.id]
	}),
	user_awardedByUserId: one(users, {
		fields: [userBadgesLink.awardedByUserId],
		references: [users.id],
		relationName: "userBadgesLink_awardedByUserId_users_id"
	}),
	user_userId: one(users, {
		fields: [userBadgesLink.userId],
		references: [users.id],
		relationName: "userBadgesLink_userId_users_id"
	}),
	badgeDefinition: one(badgeDefinitions, {
		fields: [userBadgesLink.badgeId],
		references: [badgeDefinitions.id]
	}),
}));

export const badgeDefinitionsRelations = relations(badgeDefinitions, ({many}) => ({
	userBadgesLinks: many(userBadgesLink),
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

export const userAiUsageRelations = relations(userAiUsage, ({one}) => ({
	user: one(users, {
		fields: [userAiUsage.userId],
		references: [users.id]
	}),
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

export const recommendationsRelations = relations(recommendations, ({one}) => ({
	user: one(users, {
		fields: [recommendations.workerUserId],
		references: [users.id]
	}),
}));
