import { parsePhoneNumberWithError, CountryCode } from "libphonenumber-js";
import { User } from "@/context/AuthContext";
import { UserSettingsData, UserRole } from "@/app/types/SettingsTypes";

/**
 * Creates a default UserSettingsData object for a given user and role.
 * This centralizes the default values to avoid duplication with the type definition.
 */
export const createDefaultUserSettings = (user: User, role: UserRole): UserSettingsData => {
  return {
    displayName: user.displayName || "",
    email: user.email || "",
    phone: null,
    stripeCustomerId: null,
    stripeAccountStatus: null,
    stripeConnectAccountId: null,
    canReceivePayouts: false,
    lastRole: role,
    notificationPreferences: {
      email: { gigUpdates: false, platformAnnouncements: false },
      sms: { gigAlerts: false },
    },
    privacySettings: { profileVisibility: false },
  };
};

/**
 * Validates if a phone number is in E.164 format
 */
export const isValidE164PhoneNumber = (phone: string): boolean => {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
};

/**
 * Formats and validates a phone number, returning E.164 format or null if invalid
 * Uses libphonenumber-js with multiple default countries for robust parsing
 */
export const formatPhoneNumber = (phone: string): string | null => {
  if (!phone) return null;
  const trimmedPhone = phone.trim();

  // If already in E.164 format, return as-is
  if (isValidE164PhoneNumber(trimmedPhone)) return trimmedPhone;

  // Try parsing with multiple default countries for broader support
  const defaultCountries: CountryCode[] = ["GB"];
  for (const country of defaultCountries) {
    try {
      const parsed = parsePhoneNumberWithError(trimmedPhone, {
        defaultCountry: country,
      });
      if (parsed.isValid()) {
        return parsed.number;
      }
    } catch (error: unknown) {
      // Continue to next country if parsing fails for this one
      console.warn(
        `Failed to parse phone number with default country ${country}:`,
        error
      );
    }
  }

  return null;
};
