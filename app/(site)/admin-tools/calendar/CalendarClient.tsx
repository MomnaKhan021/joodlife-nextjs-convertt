"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Bookings calendar — booked video consultations pulled from the Clinical
 * Check data (/api/admin-tools/clinical-review), placed on their real
 * scheduled date/time. Authoritative meeting times and Google Meet join
 * links come from /api/admin-tools/meeting-times (HubSpot), the same source
 * the clinical queue uses; answers._meeting_start / _meeting_join are the
 * fallback.
 *
 * Only consultations that actually have a booked meeting appear. Upcoming =
 * "Booked" with a live Join call; past = "Attended" (the call has ended).
 * A date-range filter (Today / Yesterday / This week / This month / All) and
 * a status filter scope what's shown. md+ gets the week grid; below that a
 * per-day agenda list.
 */

type Status = "booked" | "attended";

type Consultation = {
  id: number;
  fullName: string | null;
  email: string | null;
  productSlug: string | null;
  dose: string | null;
  status: string | null;
  reviewed: boolean;
  answers: Record<string, unknown>;
};

type Ev = {
  id: string;
  patient: string;
  email: string;
  product: string;
  dose: string | null;
  start: Date;
  durationMin: number;
  joinUrl: string | null;
  status: Status;
};

type Range = "today" | "yesterday" | "week" | "month" | "all";

const DAY_START = 8;
const DAY_END = 20;
const HOUR_PX = 56;
const HOURS = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const RANGES: { key: Range; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "all", label: "All" },
];

const STATUS_STYLE: Record<
  Status,
  { chip: string; block: string; dot: string; label: string }
> = {
  attended: {
    chip: "bg-[#e6f4ea] text-[#137333]",
    block: "border-[#137333]/30 bg-[#e6f4ea] text-[#0d5223] hover:bg-[#d7eddd]",
    dot: "bg-[#137333]",
    label: "Attended",
  },
  booked: {
    chip: "bg-[#e8f0fe] text-[#1a56c4]",
    block: "border-[#1a56c4]/30 bg-[#e8f0fe] text-[#12419b] hover:bg-[#dbe8fd]",
    dot: "bg-[#1a56c4]",
    label: "Booked",
  },
};

function productLabel(slug: string | null): string {
  const s = (slug ?? "").toLowerCase();
  if (s === "reorder") return "Reorder";
  if (s.startsWith("erectile") || s === "ed") return "Erectile dysfunction";
  if (s.startsWith("period") || s === "pd") return "Period delay";
  if (
    !s ||
    /weight|mounjaro|wegovy|ozempic|saxenda|foundayo|tirzepatide|semaglutide|liraglutide/.test(s)
  )
    return "Weight loss";
  return s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function startOfWeek(base: Date): Date {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Mon = 0
  return d;
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function fmtTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const period = h < 12 ? "am" : "pm";
  h = h % 12 === 0 ? 12 : h % 12;
  return `${h}:${String(m).padStart(2, "0")}${period}`;
}

async function loadEvents(): Promise<Ev[]> {
  // 1) Consultations from the Clinical Check (all statuses → booked + attended).
  const res = await fetch(
    "/api/admin-tools/clinical-review?status=all&queue=clinical&offset=0",
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error(`clinical-review ${res.status}`);
  const data = (await res.json()) as { consultations?: Consultation[] };
  const consults = data.consultations ?? [];

  // De-dupe by email (latest wins) and keep only ones with a meeting.
  const withMeeting = consults.filter((c) => {
    const s = c.answers?._meeting_start;
    return typeof s === "string" && /^\d{4}-\d{2}-\d{2}/.test(s);
  });

  // 2) Authoritative times + join links from HubSpot (batched ≤60).
  const emails = Array.from(
    new Set(withMeeting.map((c) => (c.email ?? "").toLowerCase()).filter(Boolean)),
  );
  const times: Record<string, string | null> = {};
  const links: Record<string, string | null> = {};
  for (let i = 0; i < emails.length; i += 60) {
    try {
      const r = await fetch("/api/admin-tools/meeting-times", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: emails.slice(i, i + 60) }),
      });
      if (r.ok) {
        const j = (await r.json()) as {
          times?: Record<string, string | null>;
          links?: Record<string, string | null>;
        };
        Object.assign(times, j.times ?? {});
        Object.assign(links, j.links ?? {});
      }
    } catch {
      /* fall back to the answers fields */
    }
  }

  const now = Date.now();
  const events: Ev[] = [];
  for (const c of withMeeting) {
    const email = (c.email ?? "").toLowerCase();
    const startIso =
      times[email] ?? (c.answers._meeting_start as string | undefined) ?? null;
    if (!startIso) continue;
    const start = new Date(startIso);
    if (Number.isNaN(start.getTime())) continue;
    const joinUrl =
      links[email] ??
      (typeof c.answers._meeting_join === "string" ? c.answers._meeting_join : null);
    events.push({
      id: String(c.id),
      patient: (c.fullName ?? "").trim() || email || "Patient",
      email,
      product: productLabel(c.productSlug),
      dose: c.dose,
      start,
      durationMin: 30,
      joinUrl,
      status: start.getTime() < now ? "attended" : "booked",
    });
  }
  events.sort((a, b) => a.start.getTime() - b.start.getTime());
  return events;
}

export default function CalendarClient() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<Range>("week");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<Ev | null>(null);

  // The load only sets state from async callbacks (never synchronously in the
  // effect body), so it's safe to run on mount. `refresh` adds the loading
  // flag for the manual Refresh button (an event handler).
  const run = useCallback(() => {
    loadEvents()
      .then((e) => {
        setEvents(e);
        setError(null);
      })
      .catch((err) => setError(String(err?.message ?? err)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    run();
  }, [run]);
  const refresh = useCallback(() => {
    setLoading(true);
    run();
  }, [run]);

  const byStatus = useMemo(
    () => (statusFilter === "all" ? events : events.filter((e) => e.status === statusFilter)),
    [events, statusFilter],
  );

  // Week grid days for the "week" range.
  const weekStart = useMemo(() => {
    const s = startOfWeek(new Date());
    s.setDate(s.getDate() + weekOffset * 7);
    return s;
  }, [weekOffset]);
  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekStart],
  );

  const today = new Date();
  const todayMid = new Date(today);
  todayMid.setHours(0, 0, 0, 0);
  const todayIndex = weekDays.findIndex((d) => sameDay(d, todayMid));

  // Events for the active range (agenda) or week grid.
  const rangeEvents = useMemo(() => {
    if (range === "week") {
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 7);
      return byStatus.filter((e) => e.start >= weekStart && e.start < end);
    }
    if (range === "all") return byStatus;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    if (range === "today") end.setDate(end.getDate() + 1);
    else if (range === "yesterday") {
      start.setDate(start.getDate() - 1);
      // end stays at today midnight
    } else if (range === "month") {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 1);
    }
    return byStatus.filter((e) => e.start >= start && e.start < end);
  }, [byStatus, range, weekStart]);

  const title =
    range === "week"
      ? weekStart.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
      : RANGES.find((r) => r.key === range)?.label ?? "";

  return (
    <div className="min-h-screen bg-[#f7f9f2] px-4 py-6 md:px-8">
      <div className="mx-auto w-full max-w-[1400px]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-ui text-[22px] font-semibold text-[#142e2a]">Calendar</h1>
            <p className="mt-0.5 font-ui text-[13px] text-[#5f6368]">
              Booked video consultations from Clinical Check
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Range filter */}
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as Range)}
              className="h-9 rounded-lg border border-[#142e2a]/15 bg-white px-3 font-ui text-[13px] font-medium text-[#142e2a]"
            >
              {RANGES.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | Status)}
              className="h-9 rounded-lg border border-[#142e2a]/15 bg-white px-3 font-ui text-[13px] font-medium text-[#142e2a]"
            >
              <option value="all">All bookings</option>
              <option value="booked">Booked</option>
              <option value="attended">Attended</option>
            </select>
            {range === "week" ? (
              <>
                <button
                  type="button"
                  onClick={() => setWeekOffset(0)}
                  className="h-9 rounded-lg border border-[#142e2a]/15 bg-white px-4 font-ui text-[13px] font-medium text-[#142e2a] transition-colors hover:bg-[#f1f3f4]"
                >
                  Today
                </button>
                <div className="flex items-center overflow-hidden rounded-lg border border-[#142e2a]/15 bg-white">
                  <button type="button" aria-label="Previous week" onClick={() => setWeekOffset((w) => w - 1)} className="grid h-9 w-9 place-items-center text-[#142e2a] transition-colors hover:bg-[#f1f3f4]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <button type="button" aria-label="Next week" onClick={() => setWeekOffset((w) => w + 1)} className="grid h-9 w-9 place-items-center border-l border-[#142e2a]/10 text-[#142e2a] transition-colors hover:bg-[#f1f3f4]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>
              </>
            ) : null}
            <span className="ml-1 font-ui text-[15px] font-semibold text-[#142e2a]">{title}</span>
            <button
              type="button"
              onClick={refresh}
              aria-label="Refresh"
              className="grid h-9 w-9 place-items-center rounded-lg border border-[#142e2a]/15 bg-white text-[#142e2a] transition-colors hover:bg-[#f1f3f4]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 grid h-40 place-items-center rounded-xl border border-[#142e2a]/10 bg-white font-ui text-[14px] text-[#5f6368]">
            Loading consultations…
          </div>
        ) : error ? (
          <div className="mt-6 rounded-xl border border-[#d93025]/30 bg-[#fce8e6] px-4 py-3 font-ui text-[13px] text-[#a50e0e]">
            Couldn&rsquo;t load consultations: {error}
          </div>
        ) : (
          <>
            {/* ── Week grid (md+, week range only) ── */}
            {range === "week" ? (
              <div className="mt-5 hidden overflow-hidden rounded-xl border border-[#142e2a]/10 bg-white md:block">
                <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-[#142e2a]/10">
                  <div className="border-r border-[#142e2a]/10" />
                  {weekDays.map((d, i) => {
                    const isToday = i === todayIndex;
                    return (
                      <div key={i} className={`border-r border-[#142e2a]/10 py-2 text-center last:border-r-0 ${isToday ? "bg-[#e8f0fe]" : ""}`}>
                        <div className="font-ui text-[11px] font-medium uppercase tracking-[0.04em] text-[#5f6368]">{WEEKDAYS[i]}</div>
                        <div className={`mx-auto mt-0.5 grid h-7 w-7 place-items-center rounded-full font-ui text-[15px] font-semibold ${isToday ? "bg-[#1a56c4] text-white" : "text-[#142e2a]"}`}>{d.getDate()}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-[56px_repeat(7,1fr)]">
                  <div className="border-r border-[#142e2a]/10">
                    {HOURS.map((h) => (
                      <div key={h} className="relative" style={{ height: HOUR_PX }}>
                        <span className="absolute -top-2 right-1.5 font-ui text-[11px] text-[#9aa0a6]">
                          {h % 12 === 0 ? 12 : h % 12}{h < 12 ? "am" : "pm"}
                        </span>
                      </div>
                    ))}
                  </div>
                  {weekDays.map((day, dayIdx) => (
                    <div key={dayIdx} className={`relative border-r border-[#142e2a]/10 last:border-r-0 ${dayIdx === todayIndex ? "bg-[#1a56c4]/[0.03]" : ""}`}>
                      {HOURS.map((h) => <div key={h} className="border-b border-[#142e2a]/8" style={{ height: HOUR_PX }} />)}
                      {rangeEvents
                        .filter((e) => sameDay(e.start, day))
                        .map((e) => {
                          const top = (e.start.getHours() - DAY_START + e.start.getMinutes() / 60) * HOUR_PX;
                          const height = Math.max((e.durationMin / 60) * HOUR_PX - 3, 22);
                          const st = STATUS_STYLE[e.status];
                          return (
                            <button key={e.id} type="button" onClick={() => setSelected(e)} style={{ top: Math.max(top, 0), height }}
                              className={`absolute inset-x-1 overflow-hidden rounded-md border px-2 py-1 text-left transition-colors ${st.block} ${selected?.id === e.id ? "ring-2 ring-[#142e2a] ring-offset-1" : ""}`}>
                              <span className="block truncate font-ui text-[11.5px] font-semibold leading-[15px]">{e.patient}</span>
                              <span className="block truncate font-ui text-[10.5px] leading-[14px] opacity-80">{fmtTime(e.start)} · {e.product}</span>
                            </button>
                          );
                        })}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* ── Agenda list (mobile always; desktop for non-week ranges) ── */}
            <div className={range === "week" ? "mt-5 flex flex-col gap-4 md:hidden" : "mt-5 flex flex-col gap-4"}>
              {rangeEvents.length === 0 ? (
                <div className="grid h-40 place-items-center rounded-xl border border-dashed border-[#142e2a]/20 bg-white font-ui text-[14px] text-[#5f6368]">
                  No booked consultations in this range.
                </div>
              ) : (
                groupByDay(rangeEvents).map(([key, dayEvents]) => {
                  const d = dayEvents[0].start;
                  const isToday = sameDay(d, todayMid);
                  return (
                    <div key={key} className="rounded-xl border border-[#142e2a]/10 bg-white p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`grid h-7 w-7 place-items-center rounded-full font-ui text-[13px] font-semibold ${isToday ? "bg-[#1a56c4] text-white" : "bg-[#f1f3f4] text-[#142e2a]"}`}>{d.getDate()}</span>
                        <span className="font-ui text-[14px] font-semibold text-[#142e2a]">{d.toLocaleDateString("en-GB", { weekday: "long", month: "short" })}</span>
                      </div>
                      <ul className="flex flex-col gap-2">
                        {dayEvents.map((e) => {
                          const st = STATUS_STYLE[e.status];
                          return (
                            <li key={e.id}>
                              <button type="button" onClick={() => setSelected(e)} className="flex w-full items-center gap-3 rounded-lg border border-[#142e2a]/10 bg-white px-3 py-2 text-left transition-colors hover:bg-[#f7f9f2]">
                                <span className={`h-9 w-1 shrink-0 rounded-full ${st.dot}`} />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate font-ui text-[14px] font-semibold text-[#142e2a]">{e.patient}</span>
                                  <span className="block truncate font-ui text-[12px] text-[#5f6368]">{fmtTime(e.start)} · {e.product}</span>
                                </span>
                                <span className={`shrink-0 rounded-full px-2 py-0.5 font-ui text-[11px] font-semibold ${st.chip}`}>{st.label}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Details panel ── */}
      {selected ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSelected(null)} aria-hidden />
          <aside role="dialog" aria-label="Consultation details" className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[380px] sm:max-h-none sm:rounded-none">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_STYLE[selected.status].dot}`} />
                <span className={`rounded-full px-2 py-0.5 font-ui text-[11px] font-semibold ${STATUS_STYLE[selected.status].chip}`}>{STATUS_STYLE[selected.status].label}</span>
              </div>
              <button type="button" aria-label="Close" onClick={() => setSelected(null)} className="grid h-8 w-8 place-items-center rounded-full text-[#5f6368] transition-colors hover:bg-[#f1f3f4]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </button>
            </div>

            <h2 className="mt-3 font-ui text-[18px] font-semibold text-[#142e2a]">{selected.patient}</h2>

            <dl className="mt-4 flex flex-col gap-3">
              <Row label="When">
                {selected.start.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · {fmtTime(selected.start)}
              </Row>
              <Row label="Treatment">{selected.product}{selected.dose ? ` · ${selected.dose}` : ""}</Row>
              <Row label="Email">{selected.email || "—"}</Row>
            </dl>

            {/* Join call — real Google Meet link (from HubSpot). Disabled once
                the meeting has passed, or if no link is available yet. */}
            <div className="mt-6">
              {selected.status === "booked" && selected.joinUrl ? (
                <a
                  href={selected.joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#142e2a] font-ui text-[14px] font-semibold text-white transition-colors hover:bg-[#0c2421]"
                >
                  <CamIcon />
                  Join call
                </a>
              ) : (
                <button type="button" disabled aria-disabled="true"
                  title={selected.status === "attended" ? "This consultation has already taken place" : "No meeting link available yet"}
                  className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-[#142e2a]/30 font-ui text-[14px] font-semibold text-white">
                  <CamIcon />
                  {selected.status === "attended" ? "Call ended" : "Join call"}
                </button>
              )}
              {selected.status === "booked" && !selected.joinUrl ? (
                <p className="mt-2 text-center font-ui text-[11.5px] text-[#9aa0a6]">
                  The Google Meet link will appear here once HubSpot has it.
                </p>
              ) : null}
            </div>
            <p className="mt-3 text-center font-ui text-[11px] text-[#9aa0a6]">
              A read-only view of the booking — manage it in Clinical Check.
            </p>
          </aside>
        </>
      ) : null}
    </div>
  );
}

function groupByDay(events: Ev[]): [string, Ev[]][] {
  const map = new Map<string, Ev[]>();
  for (const e of events) {
    const key = e.start.toISOString().slice(0, 10);
    (map.get(key) ?? map.set(key, []).get(key)!).push(e);
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

function CamIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M15 10l4.55-2.27A1 1 0 0 1 21 8.62v6.76a1 1 0 0 1-1.45.89L15 14M5 6h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-ui text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9aa0a6]">{label}</dt>
      <dd className="mt-0.5 font-ui text-[14px] text-[#142e2a]">{children}</dd>
    </div>
  );
}
