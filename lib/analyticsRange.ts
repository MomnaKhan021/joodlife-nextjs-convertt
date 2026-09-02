/**
 * Date range for the admin analytics endpoints (/api/admin-tools/metrics and
 * /marketing). Two ways to ask:
 *
 *   ?days=1|7|30|90            — preset: today, or the last N days incl. today
 *   ?from=YYYY-MM-DD&to=YYYY-MM-DD — custom: inclusive calendar days
 *
 * Both resolve to the same shape so the routes don't care which was used.
 * Dates are calendar days in the server's local time, matching the preset
 * behaviour the dashboard already had (a "day" starts at local midnight).
 */
export type AnalyticsRange = {
  /** First instant of the range (local midnight of the first day). */
  start: Date;
  /** First instant AFTER the range — use `< endExclusive` in queries. */
  endExclusive: Date;
  /** Last calendar day of the range (inclusive), for APIs that take dates. */
  endDay: Date;
  /** Number of calendar days covered. */
  days: number;
  /** True for a single day → the dashboard buckets by hour. */
  hourly: boolean;
  mode: "preset" | "custom";
};

const PRESETS = new Set([1, 7, 30, 90]);
/** Longest custom span we'll compute in one request. */
const MAX_CUSTOM_DAYS = 366;
const YMD = /^\d{4}-\d{2}-\d{2}$/;

function localMidnight(ymd: string): Date | null {
  if (!YMD.test(ymd)) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  // Reject "2026-02-31" style inputs that Date silently rolls over.
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

export function resolveAnalyticsRange(params: URLSearchParams, now = new Date()): AnalyticsRange {
  const from = params.get("from");
  const to = params.get("to");
  if (from && to) {
    const start = localMidnight(from);
    const last = localMidnight(to);
    if (start && last && last >= start) {
      const span = Math.round((last.getTime() - start.getTime()) / 86_400_000) + 1;
      if (span <= MAX_CUSTOM_DAYS) {
        return {
          start,
          endExclusive: addDays(last, 1),
          endDay: last,
          days: span,
          hourly: span === 1,
          mode: "custom",
        };
      }
    }
    // Malformed / too long → fall through to the default preset.
  }

  const daysRaw = Number(params.get("days") ?? 7);
  const days = PRESETS.has(daysRaw) ? daysRaw : 7;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const start = days > 1 ? addDays(today, -(days - 1)) : today;
  return {
    start,
    endExclusive: addDays(today, 1),
    endDay: today,
    days,
    hourly: days === 1,
    mode: "preset",
  };
}

/** YYYY-MM-DD in local time. */
export function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
