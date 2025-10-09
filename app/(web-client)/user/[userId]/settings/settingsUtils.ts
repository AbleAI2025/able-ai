import { parsePhoneNumberWithError, CountryCode } from "libphonenumber-js";

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
