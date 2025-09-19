"use server";
import { findOrCreatePgUserAndUpdateRole } from "@/lib/user.server";
import { authServer } from "@/lib/firebase/firebase-server";

type RegisterUserData = {
  email: string;
  password: string;
  name: string;
  phone: string;
};

export async function registerUserWithPhoneVerificationAction(data: RegisterUserData) {
  try {
    // Validate phone number format
    if (!data.phone || !data.phone.startsWith('+')) {
      return { 
        ok: false, 
        error: 'Invalid phone number format. Please include country code (e.g., +44)' 
      };
    }

    // Create Firebase user
    const firebaseUser = await authServer.createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
      phoneNumber: data.phone, // Store phone number in Firebase user
    });

    // Create PostgreSQL user
    await findOrCreatePgUserAndUpdateRole({
      firebaseUid: firebaseUser.uid,
      email: data.email,
      displayName: firebaseUser?.displayName || data.name,
      photoURL: firebaseUser?.photoURL,
      initialRoleContext: "BUYER" as "BUYER" | "GIG_WORKER" | undefined,
      phone: data.phone,
    });

    return { 
      ok: true, 
      userId: firebaseUser.uid
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error registering user with phone verification:", error.message);
      
      // Handle specific Firebase errors
      if (error.message.includes('email-already-in-use')) {
        return { ok: false, error: 'Email address is already registered' };
      }
      if (error.message.includes('invalid-email')) {
        return { ok: false, error: 'Invalid email address' };
      }
      if (error.message.includes('weak-password')) {
        return { ok: false, error: 'Password is too weak' };
      }
      if (error.message.includes('invalid-phone-number')) {
        return { ok: false, error: 'Invalid phone number format' };
      }
      
      return { ok: false, error: error.message };
    } else {
      console.error("Unexpected error registering user:", error);
      return { ok: false, error: 'Unexpected error during registration' };
    }
  }
}

// Action to update phone verification status
export async function updatePhoneVerificationStatusAction(firebaseUid: string, verified: boolean) {
  try {
    // This would update the phone verification status in your database
    // You'll need to add a phoneVerified field to your UsersTable schema
    
    return { ok: true, phoneVerified: verified };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error updating phone verification status:", error.message);
      return { ok: false, error: error.message };
    } else {
      console.error("Unexpected error updating phone verification:", error);
      return { ok: false, error: 'Unexpected error' };
    }
  }
}
