/**
 * dateUtils.ts
 * 
 * Common utility functions for date manipulation and validation.
 */

/**
 * Checks if a string is a valid ISO 8601 date that can be parsed by the JavaScript Date object.
 * This aligns with the validation logic used on the backend.
 * @param dateStr The date string to validate.
 * @returns True if the string is a valid date, false otherwise.
 */
export function isValidISODate(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
} 