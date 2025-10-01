"use server";
import { findOrCreatePgUserAndUpdateRole } from "@/lib/user.server";
import { authServer } from "@/lib/firebase/firebase-server";
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

type RegisterUserData = {
  email: string;
  password: string;
  name: string;
  phone: string;
};

export async function registerUserWithPhoneVerificationAction(data: RegisterUserData) {
  try {
    // Validate phone number format using libphonenumber-js
    if (!data.phone) {
      return { 
        ok: false, 
        error: 'Phone number is required' 
      };
    }

    // Check if phone number is valid E.164 format
    if (!isValidPhoneNumber(data.phone)) {
      return { 
        ok: false, 
        error: 'Invalid phone number format. Please use international format (e.g., +44 20 7946 0958)' 
      };
    }

    // Parse and normalize the phone number
    let normalizedPhone: string;
    try {
      const phoneNumber = parsePhoneNumber(data.phone);
      normalizedPhone = phoneNumber.format('E.164');
    } catch (parseError) {
      return { 
        ok: false, 
        error: 'Unable to parse phone number. Please check the format and try again.' 
      };
    }

    // Create Firebase user
    const firebaseUser = await authServer.createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
      phoneNumber: normalizedPhone, // Store normalized phone number in Firebase user
    });

    // Create PostgreSQL user
    await findOrCreatePgUserAndUpdateRole({
      firebaseUid: firebaseUser.uid,
      email: data.email,
      displayName: firebaseUser?.displayName || data.name,
      photoURL: firebaseUser?.photoURL,
      initialRoleContext: "BUYER" as "BUYER" | "GIG_WORKER" | undefined,
      phone: normalizedPhone,
    });

    return { 
      ok: true, 
      userId: firebaseUser.uid
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error registering user with phone verification:", error.message);
      
      // Handle specific Firebase errors using error codes for better reliability
      if ('code' in error) {
        const firebaseError = error as { code: string };
        switch (firebaseError.code) {
          case 'auth/email-already-in-use':
            return { ok: false, error: 'This email address is already registered. Please use a different email or try signing in.' };
          case 'auth/invalid-email':
            return { ok: false, error: 'Please enter a valid email address.' };
          case 'auth/weak-password':
            return { ok: false, error: 'Password must be at least 8 characters long and contain a mix of letters, numbers, and symbols.' };
          case 'auth/invalid-phone-number':
            return { ok: false, error: 'The phone number format is invalid. Please use international format (e.g., +44 20 7946 0958).' };
          case 'auth/phone-number-already-exists':
            return { ok: false, error: 'This phone number is already registered. Please use a different number or try signing in.' };
          case 'auth/operation-not-allowed':
            return { ok: false, error: 'Registration is temporarily disabled. Please try again later.' };
          case 'auth/quota-exceeded':
            return { ok: false, error: 'Too many registration attempts. Please wait a moment and try again.' };
          case 'auth/network-request-failed':
            return { ok: false, error: 'Network error. Please check your internet connection and try again.' };
          case 'auth/too-many-requests':
            return { ok: false, error: 'Too many failed attempts. Please wait a moment and try again.' };
          default:
            // Log unknown Firebase error codes for debugging
            console.warn('Unknown Firebase error code:', firebaseError.code);
            return { ok: false, error: 'Registration failed. Please check your information and try again.' };
        }
      }
      
      // Generic error fallback for non-Firebase errors
      return { ok: false, error: 'Registration failed. Please check your information and try again.' };
    } else {
      console.error("Unexpected error registering user:", error);
      return { ok: false, error: 'An unexpected error occurred during registration. Please try again.' };
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
