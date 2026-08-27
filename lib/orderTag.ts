/**
 * Order tagging helpers.
 *
 * Some order numbers arrive from the HubSpot sync as deal names with the
 * supply type (and a red-flag marker) baked in, e.g.
 * "Reorder 🚩 RED FLAG — #2948". These helpers split that into a clean
 * identifier plus a supply-type tag, so every admin view (Orders list, To
 * Dispatch, Dispatched, order detail) shows the same clean number and the
 * same "Reorder" / "New Supply" tag.
 */

/** The clean identifier to show: JLxxxx or #NNNN, with the clutter stripped. */
export function orderNumberDisplay(raw: unknown, id?: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return id != null && id !== "" ? `#${id}` : "";
  const jl = s.match(/JL[-\s]?\d+/i);
  if (jl) return jl[0].replace(/\s+/g, "").toUpperCase();
  const hash = s.match(/#\s*([A-Za-z0-9-]+)/);
  if (hash) return `#${hash[1]}`;
  const cleaned = s
    .replace(/red\s*flag/gi, "")
    .replace(/reorder/gi, "")
    .replace(/🚩/g, "")
    .replace(/[—–-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || s;
}

export type SupplyType = "Reorder" | "New Supply";

/** Supply type inferred from the order-number text (HubSpot prefixes reorders). */
export function supplyTypeOf(raw: unknown): SupplyType {
  return /reorder/i.test(String(raw ?? "")) ? "Reorder" : "New Supply";
}

/** A reorder the HubSpot sync flagged for clinical attention. */
export function isRedFlagOrder(raw: unknown): boolean {
  const s = String(raw ?? "");
  return /red\s*flag/i.test(s) || s.includes("🚩");
}
