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

/* ------------------------------------------------------------------ */
/* Delivery address — must survive the courier                         */
/* ------------------------------------------------------------------ */

/**
 * DPD rejects over-long values outright ("Maximum length exceeded"), so every
 * address part collected at checkout is kept inside the courier's limit.
 */
export const DPD_FIELD_MAX = 35;

/**
 * Max length for the street/address line. Wider than DPD_FIELD_MAX because
 * real UK street lines (flat + long street names) regularly run past 35
 * characters and customers were being blocked at checkout.
 * NOTE: DPD's own address fields are ~35 chars, so a line longer than that may
 * need trimming/splitting when the dispatch label is generated.
 */
export const ADDRESS_LINE_MAX = 50;

/**
 * A street line the courier can actually deliver to. Rejects junk like "cds"
 * while still allowing named properties without a number ("Rose Cottage").
 */
export function isDeliverableStreet(value: string): boolean {
  const t = value.trim();
  if (t.length < 5 || t.length > ADDRESS_LINE_MAX) return false;
  if (!/\p{L}{3,}/u.test(t)) return false; // needs at least one real word
  const words = t.split(/\s+/).filter(Boolean);
  if (/\d/.test(t)) return words.length >= 2; // "12 High Street"
  return words.length >= 2 && t.length >= 8; // "Rose Cottage"
}

/** Human-readable reason a street line is unusable, or null when valid/empty. */
export function streetError(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  if (t.length > ADDRESS_LINE_MAX)
    return `Address must be ${ADDRESS_LINE_MAX} characters or fewer.`;
  if (!isDeliverableStreet(t))
    return "Enter your full street address, including the house number or name (e.g. 12 High Street).";
  return null;
}

/** A town/city the courier will accept: letters and separators only. */
export function isValidTown(value: string): boolean {
  const t = value.trim();
  if (t.length < 2 || t.length > DPD_FIELD_MAX) return false;
  return /^[\p{L} .'\-]+$/u.test(t);
}

/** Reason a town is invalid, or null when valid/empty. */
export function townError(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  if (!isValidTown(t)) return "Enter a valid town or city.";
  return null;
}

/**
 * Stricter than "contains an @": needs a real domain and a 2+ letter TLD, and
 * rejects doubled or edge dots — so "a@b" and "x@y.c" no longer pass.
 */
export function isValidEmail(value: string): boolean {
  const t = value.trim();
  if (t.length < 6 || t.length > 254) return false;
  if (/\.\./.test(t) || /^[.]|[.]@|@[.]|[.]$/.test(t)) return false;
  return /^[A-Za-z0-9._%+-]{2,}@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(t);
}
