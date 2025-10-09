"use server";
import { findOrCreatePgUserAndUpdateRole } from "@/lib/user.server";

type RegisterUserData = {
  firebaseUid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string;
  password: string;
  name: string;
  phone: string | null;
};

export async function registerUserAction(data: RegisterUserData) {
  try {

    await findOrCreatePgUserAndUpdateRole({
      // This function MUST return these new fields
      firebaseUid: data.firebaseUid,
      email: data.email,
      displayName: data?.displayName || data.name,
      photoURL: data?.photoURL,
      initialRoleContext: "BUYER" as "BUYER" | "GIG_WORKER" | undefined,
      phone: data.phone,
    });

    return { ok: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error registering user:", error.message);
      return { ok: false, error: error.message };
    } else {
      console.error("Unexpected error registering user:", error);
      return { ok: false, error: 'Unexpected error' };
    }
  }
}
