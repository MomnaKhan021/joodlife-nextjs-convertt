/**
 * Blog categories — shape, shipped defaults and validation.
 *
 * The list is editable in /cms/blog-categories and stored on the
 * `blog-categories` global. These are the categories the site ships with;
 * an empty global falls back to them, so the filter tabs on /blogs never
 * come up blank.
 *
 * Client-safe (no `server-only`, no Payload import) so the editors can
 * import it. `lib/blogCategories.ts` is the server-side reader.
 *
 * The `value` is stored on every post and appears in URLs
 * (/blogs?category=…), so it is fixed once created — renaming it would
 * orphan every post already filed under it. The `label` is display-only and
 * safe to change at any time. The editor enforces exactly that.
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

/** Turn a display name into the permanent stored value. */
export function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Last-resort label for a value with no entry in the list — a category
 * that was removed while posts still referenced it. Reads better than the
 * raw slug, and is what the stored label would have been anyway.
 */
export function fallbackLabel(value: string): string {
  const words = value.replace(/-/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : value;
}

/** Human-readable name for a value, given the list in force. */
export function labelFor(
  value: string | null | undefined,
  list: PostCategory[] = CATEGORIES,
): string {
  if (!value) return "";
  return list.find((c) => c.value === value)?.label ?? fallbackLabel(value);
}

/**
 * Merge a stored list over the shipped one.
 *
 * Rows missing a value or a label are dropped, duplicate values collapse to
 * the first occurrence, and an empty result falls back to the shipped list
 * — deleting every category should leave the site with working filter tabs
 * rather than none.
 */
export function mergeCategories(stored: unknown): PostCategory[] {
  const raw = (stored as { items?: unknown } | null)?.items ?? stored;
  if (!Array.isArray(raw)) return CATEGORIES;

  const seen = new Set<string>();
  const out: PostCategory[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as { value?: unknown; label?: unknown };
    const value = String(r.value ?? "").trim();
    const label = String(r.label ?? "").trim();
    if (!value || !label || seen.has(value)) continue;
    seen.add(value);
    out.push({ value, label });
  }
  return out.length ? out : CATEGORIES;
}
