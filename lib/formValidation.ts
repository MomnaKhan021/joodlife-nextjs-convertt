/**
 * Shared form-field validation used by the consultation questionnaire and
 * the checkout form so rules stay consistent across the site.
 *
 * Names: letters (any language), spaces, apostrophes, hyphens and dots
 * only — no digits or other special characters — 2–60 chars.
 */

export const NAME_MAX = 60;
export const NAME_PART_MAX = 40;
export const TEXT_MAX = 200;
export const TEXTAREA_MAX = 1000;
export const ADDRESS_MAX = 300;
export const NOTES_MAX = 500;

// Unicode-aware: \p{L} matches letters in any script (José, María, O'Brien…)
const NAME_ALLOWED = /^[\p{L} .'\-]+$/u;

/** True when the value is a plausible full name. */
export function isValidFullName(value: string): boolean {
  const t = value.trim();
  if (t.length < 2 || t.length > NAME_MAX) return false;
  if (/\d/.test(t)) return false;
  if (!NAME_ALLOWED.test(t)) return false;
  return true;
}

/**
 * Human-readable reason a name is invalid, or null when it's valid or
 * still empty (so we don't nag before the user has typed anything).
 */
export function fullNameError(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  if (/\d/.test(t)) return "Name can’t contain numbers.";
  if (!NAME_ALLOWED.test(t)) return "Name can’t contain special characters.";
  if (t.length < 2) return "Please enter your full name.";
  if (t.length > NAME_MAX) return `Name must be ${NAME_MAX} characters or fewer.`;
  return null;
}

/** True when a single name part (first OR last name) is valid. */
export function isValidNamePart(value: string): boolean {
  const t = value.trim();
  if (t.length < 1 || t.length > NAME_PART_MAX) return false;
  if (/\d/.test(t)) return false;
  if (!NAME_ALLOWED.test(t)) return false;
  return true;
}

/** Human-readable reason a name part is invalid, or null when valid/empty. */
export function namePartError(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  if (/\d/.test(t)) return "Can’t contain numbers.";
  if (!NAME_ALLOWED.test(t)) return "Can’t contain special characters.";
  if (t.length > NAME_PART_MAX) return `Must be ${NAME_PART_MAX} characters or fewer.`;
  return null;
}
