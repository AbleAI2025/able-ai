// File: app/lib/user.server.ts
import { db } from "@/lib/drizzle/db"; // Correct path to your Drizzle instance
import { UsersTable, GigWorkerProfilesTable, BuyerProfilesTable, userAppRoleEnum, activeRoleContextEnum } from "@/lib/drizzle/schema"; // Import specific tables
import { eq } from "drizzle-orm";

// Define a comprehensive AppUser type
export interface AppUser {
  id: string; // This will be your PostgreSQL UsersTable.id
  firebaseUid: string; // Firebase UID
  email: string | null | undefined;
  fullName: string | null | undefined;
  picture?: string | null | undefined; // From Firebase profile
  appRole: typeof userAppRoleEnum.enumValues[number];
  isBuyer: boolean;
  isGigWorker: boolean;
  lastRoleUsed: typeof activeRoleContextEnum.enumValues[number] | null;
  lastViewVisitedBuyer: string | null;
  lastViewVisitedWorker: string | null;
}

// Type for the input to findOrCreatePgUserAndUpdateRole
interface FindOrCreatePgUserInput {
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  phone?: string | null;
  initialRoleContext?: typeof activeRoleContextEnum.enumValues[number] | undefined;
}

// Type for the PostgreSQL User record
type PgUserSelect = typeof UsersTable.$inferSelect;

/**
 * Finds an existing PostgreSQL user by Firebase UID or creates a new one.
 * Updates role flags (isBuyer, isGigWorker) based on initialRoleContext if it's a new user
 * or if the flags are not yet set.
 * This is called by NextAuth's `authorize` callback.
 */
export async function findOrCreatePgUserAndUpdateRole(
  input: FindOrCreatePgUserInput
): Promise<PgUserSelect | null> {
  const { firebaseUid, email, displayName, initialRoleContext, phone } = input;

  try {
    // Try to find the user by firebaseUid
    let pgUser = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, firebaseUid),
    });

    if (pgUser) {
      // User exists, potentially update fullName if it's different from Firebase displayName
      // and ensure role flags are set if they were previously false and an initialRoleContext is now provided.
      const updates: Partial<typeof UsersTable.$inferInsert> = { updatedAt: new Date() };
      if (displayName && pgUser.fullName !== displayName) {
        updates.fullName = displayName;
      }
      if (!!phone && pgUser.phone !== phone) {
        updates.phone = phone;
      }
      if (initialRoleContext === 'BUYER' && !pgUser.isBuyer) {
        updates.isBuyer = true;
        if (!pgUser.lastRoleUsed) updates.lastRoleUsed = 'BUYER'; // Set initial context
        // Create BuyerProfile if it doesn't exist
        const buyerProfile = await db.query.BuyerProfilesTable.findFirst({ where: eq(BuyerProfilesTable.userId, pgUser.id) });
        if (!buyerProfile) {
          await db.insert(BuyerProfilesTable).values({ userId: pgUser.id, fullCompanyName: `${displayName}'s Company` /* Default or from further onboarding */ });
        }
      }
      if (initialRoleContext === 'GIG_WORKER' && !pgUser.isGigWorker) {
        updates.isGigWorker = true;
        if (!pgUser.lastRoleUsed) updates.lastRoleUsed = 'GIG_WORKER'; // Set initial context
        // Create GigWorkerProfile if it doesn't exist
        const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({ where: eq(GigWorkerProfilesTable.userId, pgUser.id) });
        if (!workerProfile) {
          await db.insert(GigWorkerProfilesTable).values({ userId: pgUser.id });
        }
      }

      console.log("Updating existing user in PG:", { updates });
      if (Object.keys(updates).length > 1) { // More than just updatedAt
        const updatedUsers = await db
          .update(UsersTable)
          .set(updates)
          .where(eq(UsersTable.firebaseUid, firebaseUid))
          .returning();
        pgUser = updatedUsers[0] || pgUser;
      }
      return pgUser;
    } else {
      // User does not exist, create them
      const newUserIsBuyer = initialRoleContext === 'BUYER';
      const newUserIsGigWorker = initialRoleContext === 'GIG_WORKER';

      const newPgUsers = await db
        .insert(UsersTable)
        .values({
          firebaseUid,
          email,
          fullName: displayName,
          appRole: 'USER', // Default appRole for new sign-ups
          isBuyer: true,
          isGigWorker: newUserIsGigWorker,
          lastRoleUsed: initialRoleContext || null, // Set initial context if provided
          phone,
          // Other fields will use DB defaults
        })
        .returning();

      pgUser = newPgUsers[0];

      if (pgUser) {
        // Create corresponding profiles if flags are set
        if (newUserIsBuyer) {
          await db.insert(BuyerProfilesTable).values({ userId: pgUser.id, fullCompanyName: `${displayName}'s Company` /* Default or from further onboarding */ });
        }
        if (newUserIsGigWorker) {
          await db.insert(GigWorkerProfilesTable).values({ userId: pgUser.id });
        }
      }
      return pgUser || null;
    }
  } catch (error) {
    console.error("Error in findOrCreatePgUserAndUpdateRole:", error);
    return null;
  }
}


// --- UTILITY FUNCTIONS BASED ON PG USER OBJECT ---

export function getPgUserLastRoleUsed(pgUser: PgUserSelect | null): typeof activeRoleContextEnum.enumValues[number] | null {
  return pgUser?.lastRoleUsed || null;
}

export function getPgUserLastViewVisited(pgUser: PgUserSelect | null, currentRoleContext: typeof activeRoleContextEnum.enumValues[number] | null): string | null {
  if (!pgUser || !currentRoleContext) return null;
  return currentRoleContext === 'BUYER' ? pgUser.lastViewVisitedBuyer : pgUser.lastViewVisitedWorker;
}

export function isPgUserAdmin(pgUser: PgUserSelect | null): boolean {
  return pgUser?.appRole === 'ADMIN';
}

export function isPgUserSuperAdmin(pgUser: PgUserSelect | null): boolean {
  return pgUser?.appRole === 'SUPER_ADMIN';
}

export function isPgUserQA(pgUser: PgUserSelect | null): boolean {
  return pgUser?.appRole === 'QA';
}

export function isPgUserActualBuyer(pgUser: PgUserSelect | null): boolean {
  return !!pgUser?.isBuyer;
}

export function isPgUserActualGigWorker(pgUser: PgUserSelect | null): boolean {
  return !!pgUser?.isGigWorker;
}

// --- UTILITY FUNCTIONS BASED ON APP USER ---

export function getUserLastRoleUsed(user: AppUser | null): typeof activeRoleContextEnum.enumValues[number] | null {
  return user?.lastRoleUsed || null;
}

export function getUserLastViewVisited(user: AppUser | null, currentRoleContext?: typeof activeRoleContextEnum.enumValues[number] | null): string | null {
  if (!user) return null;
  const roleToUse = currentRoleContext || user.lastRoleUsed;
  if (!roleToUse) return null;
  return roleToUse === 'BUYER' ? user.lastViewVisitedBuyer : user.lastViewVisitedWorker;
}

export function isUserAdmin(user: AppUser | null): boolean {
  return user?.appRole === 'ADMIN';
}

export function isUserSuperAdmin(user: AppUser | null): boolean {
  return user?.appRole === 'SUPER_ADMIN';
}

export function isUserQA(user: AppUser | null): boolean {
  return user?.appRole === 'QA';
}

export function isUserBuyer(user: AppUser | null): boolean {
  return !!user?.isBuyer;
}

export function isUserGigWorker(user: AppUser | null): boolean {
  return !!user?.isGigWorker;
}

// --- FUNCTION TO UPDATE USER CONTEXT IN POSTGRESQL (lastRoleUsed, lastViewVisited) ---
export async function updateUserAppContext(
  firebaseUid: string,
  updates: {
    lastRoleUsed?: typeof activeRoleContextEnum.enumValues[number];
    lastViewVisited?: string; // This will be the specific view for the role being set/updated
  }
): Promise<PgUserSelect | null> {
  if (!firebaseUid || Object.keys(updates).length === 0) return null;

  const updateData: Partial<typeof UsersTable.$inferInsert> = { updatedAt: new Date() };

  if (updates.lastRoleUsed) {
    updateData.lastRoleUsed = updates.lastRoleUsed;
    // When lastRoleUsed is updated, also update the specific lastViewVisited for that role
    if (updates.lastViewVisited) {
      if (updates.lastRoleUsed === 'BUYER') {
        updateData.lastViewVisitedBuyer = updates.lastViewVisited;
      } else if (updates.lastRoleUsed === 'GIG_WORKER') {
        updateData.lastViewVisitedWorker = updates.lastViewVisited;
      }
    }
  } else if (updates.lastViewVisited) {
    // If only lastViewVisited is provided, we need to know for which role context
    // This scenario implies the role context is already known and not changing.
    // It's better if updateUserAppContext is always called with the current role context
    // if lastViewVisited is being updated.
    // For simplicity, this function should ideally be called when a role IS active.
    // Let's assume the caller knows the current role if only updating view.
    // Or, fetch the current lastRoleUsed from DB first if not provided.
    // To avoid complexity, the `updates` object should ideally contain `lastRoleUsed` if `lastViewVisited` for that role is changing.
    // For now, if lastRoleUsed is not in updates, we won't update specific lastViewVisited.
    console.warn("Updating lastViewVisited without lastRoleUsed might lead to ambiguity. Please provide lastRoleUsed.");
  }

  try {
    const updatedUsers = await db
      .update(UsersTable)
      .set(updateData)
      .where(eq(UsersTable.firebaseUid, firebaseUid))
      .returning();

    return updatedUsers[0] || null;
  } catch (error) {
    console.error("Error updating user app context in PG:", error);
    return null;
  }
}

/**
 * Gets a hydrated AppUser object for a given Firebase UID by fetching data from PostgreSQL
 */
export async function getHydratedAppUser(firebaseUid: string): Promise<AppUser | null> {
  if (!firebaseUid) {
    console.warn("getHydratedAppUser: No Firebase UID provided.");
    return null;
  }

  try {
    const pgUser = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, firebaseUid),
    });

    if (!pgUser) {
      console.warn(`getHydratedAppUser: No PG User found for Firebase UID: ${firebaseUid}`);
      return null;
    }

    // Return user data from PostgreSQL
    return {
      id: pgUser.id,
      firebaseUid: pgUser.firebaseUid,
      email: pgUser.email,
      fullName: pgUser.fullName,
      picture: undefined, // This will be set from Firebase user data when needed
      appRole: pgUser.appRole,
      isBuyer: pgUser.isBuyer,
      isGigWorker: pgUser.isGigWorker,
      lastRoleUsed: pgUser.lastRoleUsed,
      lastViewVisitedBuyer: pgUser.lastViewVisitedBuyer,
      lastViewVisitedWorker: pgUser.lastViewVisitedWorker,
    };
  } catch (error) {
    console.error(`getHydratedAppUser: Error fetching PG User details:`, error);
    return null;
  }
}