// File: app/lib/drizzle/schema/relations.ts

import { relations } from "drizzle-orm";

// Import all table schemas
import {
  UsersTable,
  GigWorkerProfilesTable,
  BuyerProfilesTable,
  TeamMembersTable,
  PasswordRecoveryRequestsTable,
} from "./users";
import {
  SkillsTable,
  QualificationsTable,
  EquipmentTable,
  GigsTable,
  GigSkillsRequiredTable,
} from "./gigs";
import {
  ReviewsTable,
  BadgeDefinitionsTable,
  UserBadgesLinkTable,
  ChatMessagesTable, // Added ChatMessagesTable
  RecommendationsTable,
} from "./interactions";
import { PaymentsTable, MockPaymentsTable } from "./payments";
import {
  AdminLogsTable,
  AiPromptsTable,
  systemFlags, // Added systemFlags
  userAiUsage, // Added userAiUsage
  escalatedIssues, // Added escalatedIssues
} from "./admin";
import { VectorEmbeddingsTable } from "./vector";
import { NotificationPreferencesTable } from "./notification-preferences";

// --- USER DOMAIN RELATIONS ---

export const usersRelations = relations(UsersTable, ({ one, many }) => ({
  gigWorkerProfile: one(GigWorkerProfilesTable, {
    // User -> GigWorkerProfile (1-to-1)
    fields: [UsersTable.id],
    references: [GigWorkerProfilesTable.userId],
  }),
  buyerProfile: one(BuyerProfilesTable, {
    // User -> BuyerProfile (1-to-1)
    fields: [UsersTable.id],
    references: [BuyerProfilesTable.userId],
  }),
  gigsAsBuyer: many(GigsTable, { relationName: "UserAsBuyerOfGig" }), // Gigs this user posted as a buyer
  gigsAsWorker: many(GigsTable, { relationName: "UserAsWorkerOfGig" }), // Gigs this user accepted as a worker
  paymentsMade: many(PaymentsTable, { relationName: "UserAsPayerOfPayment" }),
  paymentsReceived: many(PaymentsTable, {
    relationName: "UserAsReceiverOfPayment",
  }),
  reviewsAuthored: many(ReviewsTable, { relationName: "UserAsAuthorOfReview" }),
  reviewsTargeted: many(ReviewsTable, { relationName: "UserAsTargetOfReview" }),
  recommendationsReceived: many(RecommendationsTable, { relationName: "UserAsWorkerOfRecommendation" }),
  userBadgeLinks: many(UserBadgesLinkTable, {
    relationName: "UserBadgesEarnedByThisUser",
  }), // Badges this user has
  badgesAwardedByThisUser: many(UserBadgesLinkTable, {
    relationName: "BadgesAwardedByThisUser",
  }), // Badges this user awarded to others
  adminLogs: many(AdminLogsTable, {
    relationName: "AdminUserWhoPerformedLogAction",
  }),
  aiPromptsLastUpdated: many(AiPromptsTable, {
    relationName: "UserWhoLastUpdatedPrompt",
  }),
  passwordRecoveryRequests: many(PasswordRecoveryRequestsTable),
  teamMemberLinks: many(TeamMembersTable, {
    relationName: "UserLinkedAsTeamMember",
  }), // For user records that are team members
  sentChatMessages: many(ChatMessagesTable, {
    relationName: "UserAsSenderOfChatMessage",
  }),
  mockPaymentsAsWorker: many(MockPaymentsTable, {
    relationName: "MockPaymentWorkerUser",
  }),
  mockPaymentsAsBuyer: many(MockPaymentsTable, {
    relationName: "MockPaymentBuyerUser",
  }),
  // New relations from admin.ts tables
  userAiUsage: many(userAiUsage), // User -> UserAiUsage (1-to-many)
  reportedIssues: many(escalatedIssues, { relationName: "UserAsReporterOfIssue" }), // User -> EscalatedIssues (1-to-many, as reporter)
  assignedIssues: many(escalatedIssues, { relationName: "UserAsAssignedAdminOfIssue" }), // User -> EscalatedIssues (1-to-many, as assigned admin)
  notificationPreferences: one(NotificationPreferencesTable, {
    fields: [UsersTable.id],
    references: [NotificationPreferencesTable.userId],
  }),
}));

export const gigWorkerProfilesRelations = relations(
  GigWorkerProfilesTable,
  ({ one, many }) => ({
    user: one(UsersTable, {
      // GigWorkerProfile -> User (1-to-1 backlink)
      fields: [GigWorkerProfilesTable.userId],
      references: [UsersTable.id],
    }),
    skills: many(SkillsTable),
    qualifications: many(QualificationsTable),
    equipment: many(EquipmentTable),
  })
);

export const buyerProfilesRelations = relations(
  BuyerProfilesTable,
  ({ one, many }) => ({
    user: one(UsersTable, {
      // BuyerProfile -> User (1-to-1 backlink)
      fields: [BuyerProfilesTable.userId],
      references: [UsersTable.id],
    }),
    teamMembers: many(TeamMembersTable), // BuyerProfile -> TeamMembers (1-to-many)
  })
);

export const teamMembersRelations = relations(TeamMembersTable, ({ one }) => ({
  buyerProfile: one(BuyerProfilesTable, {
    // TeamMember -> BuyerProfile (many-to-one)
    fields: [TeamMembersTable.buyerProfileId],
    references: [BuyerProfilesTable.id],
  }),
  user: one(UsersTable, {
    // TeamMember -> User (many-to-one, if memberUserId is set)
    fields: [TeamMembersTable.memberUserId],
    references: [UsersTable.id],
    relationName: "UserLinkedAsTeamMember",
  }),
}));

export const passwordRecoveryRequestsRelations = relations(
  PasswordRecoveryRequestsTable,
  ({ one }) => ({
    user: one(UsersTable, {
      // PasswordRecoveryRequest -> User (many-to-one)
      fields: [PasswordRecoveryRequestsTable.userId],
      references: [UsersTable.id],
    }),
  })
);

// --- GIG DOMAIN RELATIONS ---

export const skillsRelations = relations(SkillsTable, ({ one }) => ({
  workerProfile: one(GigWorkerProfilesTable, {
    // Skill -> GigWorkerProfile (many-to-one)
    fields: [SkillsTable.workerProfileId],
    references: [GigWorkerProfilesTable.id],
  }),
}));

export const qualificationsRelations = relations(
  QualificationsTable,
  ({ one }) => ({
    workerProfile: one(GigWorkerProfilesTable, {
      // Qualification -> GigWorkerProfile (many-to-one)
      fields: [QualificationsTable.workerProfileId],
      references: [GigWorkerProfilesTable.id],
    }),
  })
);

export const equipmentRelations = relations(EquipmentTable, ({ one }) => ({
  workerProfile: one(GigWorkerProfilesTable, {
    // Equipment -> GigWorkerProfile (many-to-one)
    fields: [EquipmentTable.workerProfileId],
    references: [GigWorkerProfilesTable.id],
  }),
}));

export const gigsRelations = relations(GigsTable, ({ one, many }) => ({
  buyer: one(UsersTable, {
    // Gig -> User (Buyer)
    fields: [GigsTable.buyerUserId],
    references: [UsersTable.id],
    relationName: "UserAsBuyerOfGig",
  }),
  worker: one(UsersTable, {
    // Gig -> User (Worker)
    fields: [GigsTable.workerUserId],
    references: [UsersTable.id],
    relationName: "UserAsWorkerOfGig",
  }),
  skillsRequired: many(GigSkillsRequiredTable), // Gig -> GigSkillsRequired (1-to-many)
  payments: many(PaymentsTable), // Gig -> Payments (1-to-many)
  reviews: many(ReviewsTable), // Gig -> Reviews (1-to-many)
  chatMessages: many(ChatMessagesTable), // Gig -> ChatMessages (1-to-many)
  badgesAwardedInContext: many(UserBadgesLinkTable, {
    relationName: "BadgesAwardedInGigContext",
  }), // Badges linked to this gig
}));

export const gigSkillsRequiredRelations = relations(
  GigSkillsRequiredTable,
  ({ one }) => ({
    gig: one(GigsTable, {
      // GigSkillsRequired -> Gig (many-to-one)
      fields: [GigSkillsRequiredTable.gigId],
      references: [GigsTable.id],
    }),
    // If skillName were an FK to a global skills table:
    // skillDefinition: one(GlobalSkillsTable, { fields: [GigSkillsRequiredTable.skillDefinitionId], references: [GlobalSkillsTable.id] }),
  })
);

// --- INTERACTIONS DOMAIN RELATIONS ---

export const reviewsRelations = relations(ReviewsTable, ({ one }) => ({
  gig: one(GigsTable, {
    // Review -> Gig (many-to-one)
    fields: [ReviewsTable.gigId],
    references: [GigsTable.id],
  }),
  author: one(UsersTable, {
    // Review -> User (Author)
    fields: [ReviewsTable.authorUserId],
    references: [UsersTable.id],
    relationName: "UserAsAuthorOfReview",
  }),
  target: one(UsersTable, {
    // Review -> User (Target)
    fields: [ReviewsTable.targetUserId],
    references: [UsersTable.id],
    relationName: "UserAsTargetOfReview",
  }),
}));

export const recommendationsRelations = relations(RecommendationsTable, ({ one }) => ({
  worker: one(UsersTable, {
    // Recommendation -> User (Worker being recommended)
    fields: [RecommendationsTable.workerUserId],
    references: [UsersTable.id],
    relationName: "UserAsWorkerOfRecommendation",
  }),
}));

export const badgeDefinitionsRelations = relations(
  BadgeDefinitionsTable,
  ({ many }) => ({
    userBadgeLinks: many(UserBadgesLinkTable, {
      relationName: "BadgeDefinitionToUserLinks",
    }), // BadgeDefinition -> UserBadgesLink (1-to-many)
  })
);

export const userBadgesLinkRelations = relations(
  UserBadgesLinkTable,
  ({ one }) => ({
    user: one(UsersTable, {
      // UserBadgesLink -> User (Badge Earner)
      fields: [UserBadgesLinkTable.userId],
      references: [UsersTable.id],
      relationName: "UserBadgesEarnedByThisUser",
    }),
    badgeDefinition: one(BadgeDefinitionsTable, {
      // UserBadgesLink -> BadgeDefinition
      fields: [UserBadgesLinkTable.badgeId],
      references: [BadgeDefinitionsTable.id],
    }),
    awardedByUser: one(UsersTable, {
      // UserBadgesLink -> User (Awarder, optional)
      fields: [UserBadgesLinkTable.awardedByUserId],
      references: [UsersTable.id],
      relationName: "BadgesAwardedByThisUser",
    }),
    gig: one(GigsTable, {
      // UserBadgesLink -> Gig (Context, optional)
      fields: [UserBadgesLinkTable.gigId],
      references: [GigsTable.id],
      relationName: "BadgesAwardedInGigContext",
    }),
  })
);

export const chatMessagesRelations = relations(
  ChatMessagesTable,
  ({ one }) => ({
    gig: one(GigsTable, {
      // ChatMessage -> Gig (many-to-one)
      fields: [ChatMessagesTable.gigId],
      references: [GigsTable.id],
    }),
    sender: one(UsersTable, {
      // ChatMessage -> User (Sender)
      fields: [ChatMessagesTable.senderUserId],
      references: [UsersTable.id],
      relationName: "UserAsSenderOfChatMessage",
    }),
  })
);

// --- PAYMENTS DOMAIN RELATIONS ---

export const paymentsRelations = relations(PaymentsTable, ({ one }) => ({
  gig: one(GigsTable, {
    // Payment -> Gig (many-to-one)
    fields: [PaymentsTable.gigId],
    references: [GigsTable.id],
  }),
  payer: one(UsersTable, {
    // Payment -> User (Payer)
    fields: [PaymentsTable.payerUserId],
    references: [UsersTable.id],
    relationName: "UserAsPayerOfPayment",
  }),
  receiver: one(UsersTable, {
    // Payment -> User (Receiver)
    fields: [PaymentsTable.receiverUserId],
    references: [UsersTable.id],
    relationName: "UserAsReceiverOfPayment",
  }),
}));

export const mockPaymentsRelations = relations(
  MockPaymentsTable,
  ({ one }) => ({
    worker: one(UsersTable, {
      // MockPayment -> User (Worker)
      fields: [MockPaymentsTable.workerUserId],
      references: [UsersTable.id],
      relationName: "MockPaymentWorkerUser",
    }),
    buyer: one(UsersTable, {
      // MockPayment -> User (Buyer)
      fields: [MockPaymentsTable.buyerUserId],
      references: [UsersTable.id],
      relationName: "MockPaymentBuyerUser",
    }),
    // If linking MockPayments to GigsTable:
    // gig: one(GigsTable, { fields: [MockPaymentsTable.gigId], references: [GigsTable.id] }),
  })
);

// --- ADMIN DOMAIN RELATIONS ---

export const adminLogsRelations = relations(AdminLogsTable, ({ one }) => ({
  adminUser: one(UsersTable, {
    // AdminLog -> User (Admin)
    fields: [AdminLogsTable.adminUserId],
    references: [UsersTable.id],
    relationName: "AdminUserWhoPerformedLogAction",
  }),
}));

export const aiPromptsRelations = relations(AiPromptsTable, ({ one }) => ({
  lastUpdatedByUser: one(UsersTable, {
    // AiPrompt -> User (Admin who updated)
    fields: [AiPromptsTable.lastUpdatedByUserId],
    references: [UsersTable.id],
    relationName: "UserWhoLastUpdatedPrompt",
  }),
}));

export const userAiUsageRelations = relations(userAiUsage, ({ one }) => ({
  user: one(UsersTable, { // UserAiUsage -> User (many-to-one backlink)
    fields: [userAiUsage.userId],
    references: [UsersTable.id],
  }),
}));

export const escalatedIssuesRelations = relations(escalatedIssues, ({ one }) => ({
  reporter: one(UsersTable, { // EscalatedIssue -> User (many-to-one, reporter)
    fields: [escalatedIssues.userId],
    references: [UsersTable.id],
    relationName: "UserAsReporterOfIssue", // Should match the relationName in usersRelations
  }),
  assignedAdmin: one(UsersTable, { // EscalatedIssue -> User (many-to-one, assigned admin)
    fields: [escalatedIssues.adminUserId],
    references: [UsersTable.id],
    relationName: "UserAsAssignedAdminOfIssue", // Should match the relationName in usersRelations
  }),
}));

// Note: systemFlags does not have any foreign keys to define relations from.

// --- VECTOR DOMAIN RELATIONS (Generally not heavily relational in Drizzle sense) ---
// As discussed, VectorEmbeddings are often queried independently or linked in application logic.
// If you had a direct FK from VectorEmbeddings to a single source table (e.g., always to GigsTable),
// you could define it here. Since entityPostgresId is generic, it's harder.
export const vectorEmbeddingsRelations = relations(
  VectorEmbeddingsTable,
  ({ one }) => ({
    // Example if entityPostgresId ALWAYS referred to GigsTable.id and entityType was GIG_DESCRIPTION
    sourceGig: one(GigsTable, {
      fields: [VectorEmbeddingsTable.entityPostgresId],
      references: [GigsTable.id],
      // This relation would only be valid if entityType confirms it's a gig
    })
  })
);
