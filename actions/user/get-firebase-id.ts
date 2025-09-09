import { db } from "@/lib/drizzle/db";
import { UsersTable } from "@/lib/drizzle/schema/users";
import { eq } from "drizzle-orm";

export const getFirebaseId = async (workerId: string): Promise<string | null> => {
  try {
    const worker = await db.query.UsersTable.findFirst({
        where: eq(UsersTable.id, workerId),
    });
    const workerFirebaseUid = worker?.firebaseUid;
    return workerFirebaseUid || null;
  } catch (error) {
    console.error("Error fetching Firebase ID:", error);
    return null;
  }
};
