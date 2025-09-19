import { db } from "@/lib/drizzle/db";
import {
  UsersTable,
  GigWorkerProfilesTable,
  BuyerProfilesTable,
  activeRoleContextEnum,
  NotificationPreferencesTable,
} from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";
import admin from "./firebase/firebase-server";

// Type for the input to findOrCreatePgUserAndUpdateRole
interface FindOrCreatePgUserInput {
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  phone?: string | null;
  initialRoleContext?:
    | (typeof activeRoleContextEnum.enumValues)[number]
    | undefined;
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
    // Try to find the user by firebaseUid with notificationPreferences
    let pgUser = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, firebaseUid),
      with: {
        notificationPreferences: true,
      },
    });

    if (pgUser) {
      const updates: Partial<typeof UsersTable.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (displayName && pgUser.fullName !== displayName) {
        updates.fullName = displayName;
      }

      if (!!phone && pgUser.phone !== phone) {
        updates.phone = phone;
      }


      if (initialRoleContext === "BUYER" && !pgUser.isBuyer) {
        updates.isBuyer = true;
        if (!pgUser.lastRoleUsed) updates.lastRoleUsed = "BUYER";

        const buyerProfile = await db.query.BuyerProfilesTable.findFirst({
          where: eq(BuyerProfilesTable.userId, pgUser.id),
        });

        if (!buyerProfile) {
          await db.insert(BuyerProfilesTable).values({
            userId: pgUser.id,
            fullCompanyName: `${displayName}'s Company`,
          });
        }
      }

      if (initialRoleContext === "GIG_WORKER" && !pgUser.isGigWorker) {
        updates.isGigWorker = true;
        if (!pgUser.lastRoleUsed) updates.lastRoleUsed = "GIG_WORKER";

        const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
          where: eq(GigWorkerProfilesTable.userId, pgUser.id),
        });

        if (!workerProfile) {
          await db.insert(GigWorkerProfilesTable).values({
            userId: pgUser.id,
          });
        }
      }

      if (!pgUser.notificationPreferences) {
        await db.insert(NotificationPreferencesTable).values({
          userId: pgUser.id,
        });
      }

      if (Object.keys(updates).length > 1) {
        await db
          .update(UsersTable)
          .set(updates)
          .where(eq(UsersTable.firebaseUid, firebaseUid))
          .returning();

        // Re-fetch the user to ensure notificationPreferences is included
        pgUser =
          (await db.query.UsersTable.findFirst({
            where: eq(UsersTable.firebaseUid, firebaseUid),
            with: {
              notificationPreferences: true,
            },
          })) || pgUser;
      }

      return pgUser;
    } else {
      const newUserIsBuyer = initialRoleContext === "BUYER";
      const newUserIsGigWorker = initialRoleContext === "GIG_WORKER";

      const newPgUsers = await db
        .insert(UsersTable)
        .values({
          firebaseUid,
          email,
          fullName: displayName,
          appRole: "USER",
          isBuyer: newUserIsBuyer,
          isGigWorker: newUserIsGigWorker,
          lastRoleUsed: initialRoleContext || null,
          phone,
        })
        .returning();

      const newPgUser = newPgUsers[0];
      if (!newPgUser) return null;

      await db.insert(NotificationPreferencesTable).values({
        userId: newPgUser.id,
      });

      if (newUserIsBuyer) {
        await db.insert(BuyerProfilesTable).values({
          userId: newPgUser.id,
          fullCompanyName: `${displayName}'s Company`,
        });
      }

      if (newUserIsGigWorker) {
        await db.insert(GigWorkerProfilesTable).values({
          userId: newPgUser.id,
        });
      }

      const foundUser = await db.query.UsersTable.findFirst({
        where: eq(UsersTable.id, newPgUser.id),
        with: {
          notificationPreferences: true,
        },
      });
      return foundUser ?? null;
    }
  } catch (error) {
    console.error("Error in findOrCreatePgUserAndUpdateRole:", error);
    return null;
  }
}

// --- UTILITY FUNCTIONS BASED ON PG USER OBJECT ---


// --- UTILITY FUNCTIONS BASED ON APP USER ---

export async function isUserAuthenticated(idToken?: string) {
  try {
    if (!idToken) throw new Error("Id token is required")
    const data = await admin.auth().verifyIdToken(idToken);
    return { data: true, uid: data.uid };
  } catch (error) {
    console.error("Invalid or expired token:", error);
    throw "Invalid or expired token";
  }
}

export async function isUserAdmin(idToken: string) {
  try {
    const data = await admin.auth().verifyIdToken(idToken);

    return { data: data?.role === "ADMIN", uid: data.uid };
  } catch (error) {
    console.error("Invalid or expired token:", error);
    throw "Invalid or expired token";
  }
}

export async function isUserSuperAdmin(idToken: string): Promise<boolean> {
  try {
    const data = await admin.auth().verifyIdToken(idToken);

    return data?.role === "SUPER_ADMIN";
  } catch (error) {
    console.error("Invalid or expired token:", error);
    throw "Invalid or expired token";
  }
}

export async function isUserQA(idToken: string): Promise<boolean> {
  try {
    const data = await admin.auth().verifyIdToken(idToken);

    return data?.role === "QA";
  } catch (error) {
    console.error("Invalid or expired token:", error);
    throw "Invalid or expired token";
  }
}

export async function isUserBuyer(idToken: string): Promise<boolean> {
  try {
    const data = await admin.auth().verifyIdToken(idToken);

    return data?.role === "BUYER";
  } catch (error) {
    console.error("Invalid or expired token:", error);
    throw "Invalid or expired token";
  }
}

export async function isUserGigWorker(idToken: string): Promise<boolean> {
  try {
    const data = await admin.auth().verifyIdToken(idToken);

    return data?.role === "GIG_WORKER";
  } catch (error) {
    console.error("Invalid or expired token:", error);
    throw "Invalid or expired token";
  }
}
