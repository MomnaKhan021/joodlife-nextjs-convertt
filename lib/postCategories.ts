/**
 * The blog categories — the single source of truth.
 *
 * Read by the Posts collection (the dropdown), the /cms editor, the article
 * cards, and lib/ensureSchema (which teaches Postgres the new value).
 *
 * TO ADD A CATEGORY: add one line to CATEGORIES below. Nothing else needs
 * touching — the dropdown, the labels and the database's allowed values all
 * derive from this list, and SCHEMA_VERSION fingerprints it so the migration
 * runs on the next boot without anyone having to remember to bump it.
 *
 * The `value` is stored in the database and appears in URLs
 * (/blogs?category=…), so treat it as permanent: renaming one orphans every
 * post already filed under it. The `label` is display-only and safe to edit.
 *
 * Deliberately a plain module rather than living beside the editor: the
 * editor is a client component, and a value imported from a client module
 * into a server component arrives as a client-reference proxy rather than
 * the array itself — so `CATEGORIES.find(...)` would not be a function.
 */

export type PostCategory = { label: string; value: string };

export const CATEGORIES: PostCategory[] = [
  { label: "Weight loss", value: "weight-loss" },
  { label: "Nutrition", value: "nutrition" },
  { label: "Lifestyle", value: "lifestyle" },
  { label: "Science", value: "science" },
  { label: "Company news", value: "company-news" },
  { label: "Other", value: "other" },
];

/** Human-readable name for a stored category value. */
export function categoryLabel(value?: string | null): string {
  if (!value) return "—";
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

/**
 * A short, stable fingerprint of the category list.
 *
 * ensureSchema folds this into SCHEMA_VERSION so that adding a category
 * automatically re-runs the repair — otherwise the version would still match,
 * the ALTER TYPE would be skipped, and saving a post in the new category
 * would fail against an enum that had never heard of it.
 */
export function categoriesFingerprint(): string {
  const joined = CATEGORIES.map((c) => c.value).join(",");
  let h = 5381;
  for (let i = 0; i < joined.length; i++) {
    h = ((h << 5) + h + joined.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}
