/**
 * Local GP search over the Scottish practice list, used by /api/gp-search to
 * fill the gap left by the England-centric remote directories.
 *
 * Matching is case-insensitive on practice name, address line, town and
 * postcode (postcode compared with spaces removed so "DD25NH" finds
 * "DD2 5NH"). Name-prefix hits rank above other hits so "Grove" puts
 * "Grove Health Centre" first rather than a practice on Grove Road.
 */
import { SCOTLAND_GPS, type GpPractice } from "./gp-scotland";

const fold = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
const noSpace = (s: string) => s.toLowerCase().replace(/\s+/g, "");

/** Stable identity for de-duplicating against remote results. */
export function gpKey(g: { name: string; postcode: string }): string {
  return `${fold(g.name)}|${noSpace(g.postcode)}`;
}

export function searchScotlandGps(query: string, limit = 12): GpPractice[] {
  const q = fold(query);
  if (q.length < 2) return [];
  const qPc = noSpace(query);

  const starts: GpPractice[] = [];
  const contains: GpPractice[] = [];
  for (const g of SCOTLAND_GPS) {
    const name = fold(g.name);
    if (name.startsWith(q)) {
      starts.push(g);
    } else if (
      name.includes(q) ||
      fold(g.city).includes(q) ||
      fold(g.address).includes(q) ||
      noSpace(g.postcode).startsWith(qPc)
    ) {
      contains.push(g);
    }
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}
