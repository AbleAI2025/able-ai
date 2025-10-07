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
 * Handles international formats and common country codes
 */
export const formatPhoneNumber = (phone: string): string | null => {
  if (!phone) return null;
  phone = phone.trim();
  if (isValidE164PhoneNumber(phone)) return phone;
  const digits = phone.replace(/\D/g, '');

  // US numbers (11 digits starting with 1)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // UK numbers (10-11 digits)
  if (digits.length >= 10 && digits.length <= 11) {
    return `+44${digits}`;
  }

  // Try parsing with multiple default countries for broader support
  const defaultCountries: CountryCode[] = ['GB', 'US', 'CO', 'CA', 'AU'];
  for (const country of defaultCountries) {
    try {
      const parsed = parsePhoneNumberWithError(phone, {defaultCountry: country});
      if (parsed.isValid()) {
        return parsed.number;
      }
    } catch {}
  }

  return null;
};