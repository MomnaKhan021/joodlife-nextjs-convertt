/**
 * The blog categories, kept in step with the Posts collection's own select
 * options.
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
