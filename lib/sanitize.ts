/**
 * Plain-text sanitisation for user-supplied checkout fields.
 *
 * Customer name, address, phone, and notes are stored verbatim in the
 * orders table and rendered back to admins inside the dashboard. We
 * strip control characters and any markup so a malicious shopper
 * can't smuggle <script> tags into the admin UI, and we trim/normalise
 * whitespace so the same input always looks the same.
 *
 * This is NOT a replacement for output escaping (React already does
 * that) — it's defence in depth.
 */

/** Strip HTML tags, control chars, and collapse whitespace. */
export function sanitizeText(input: string, maxLen = 500): string {
  if (typeof input !== "string") return "";
  return (
    input
      // strip everything that looks like a tag
      .replace(/<[^>]*>/g, "")
      // strip ASCII control chars except \n and \t
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      // strip zero-width / bidi-override characters that can be used
      // to mask malicious text in admin UI
      .replace(/[​-‏‪-‮﻿]/g, "")
      // collapse runs of whitespace
      .replace(/[ \t]+/g, " ")
      .trim()
      .slice(0, maxLen)
  );
}

/** Sanitise a free-form multiline text field (address, notes). */
export function sanitizeMultiline(input: string, maxLen = 2000): string {
  if (typeof input !== "string") return "";
  return (
    input
      .replace(/<[^>]*>/g, "")
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .replace(/[​-‏‪-‮﻿]/g, "")
      .replace(/\r\n/g, "\n")
      // collapse 3+ newlines to 2 (paragraph spacing)
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, maxLen)
  );
}

/** Normalise an email — lowercase, trim, strict format. */
export function sanitizeEmail(input: string): string {
  if (typeof input !== "string") return "";
  const trimmed = input.trim().toLowerCase().slice(0, 200);
  // The shape was already validated by Zod, this just normalises.
  return trimmed;
}

/** Phone — strip non-numeric chars except + ( ) - and spaces. */
export function sanitizePhone(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[^\d+()\-\s]/g, "")
    .trim()
    .slice(0, 40);
}
