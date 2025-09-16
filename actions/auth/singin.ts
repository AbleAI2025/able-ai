'use server'
import { db } from "@/lib/drizzle/db";
import { UsersTable } from "@/lib/drizzle/schema";
import admin from "@/lib/firebase/firebase-server";
import { ERROR_CODES } from "@/lib/responses/errors";
import { CODES_SUCCESS } from "@/lib/responses/success";
import { eq } from "drizzle-orm";

export async function signInWithFirebaseAction(uid: string) {
  try {
    const pgUser = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
      with: {
        gigWorkerProfile: {
          columns: {
            id: true,
          }
        }
      }
    });

    const customClaims = {
      role: pgUser?.appRole,
      haveWorkerProfile: !!pgUser?.gigWorkerProfile?.id,
    };

    await admin.auth().setCustomUserClaims(uid, customClaims);

    return {...CODES_SUCCESS.QUERY_OK, error: false};
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error signing in with Firebase:", error.message);
      return { error: error.message, ...ERROR_CODES.BAD_REQUEST };
    } else {
      console.error("Unexpected error signing in with Firebase:", error);
      return { error: 'Unexpected error', ...ERROR_CODES.BAD_REQUEST };
    }
  }
}
