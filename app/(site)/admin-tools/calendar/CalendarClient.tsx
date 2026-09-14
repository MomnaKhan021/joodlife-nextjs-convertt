"use client";

import { useMemo, useState } from "react";

/**
 * Bookings calendar (preview) — a Google-Calendar-style week view for the
 * admin. Shows booked / attended consultations as event blocks; selecting one
 * opens a details panel. The "Join call" action is present but DISABLED — the
 * video-call/booking backend isn't connected yet, so the schedule here is
 * example data (clearly labelled) to show the intended layout.
 *
 * md+ renders the time-grid week view; below that it falls back to a per-day
 * agenda list so it stays usable on a phone.
 */

type Status = "attended" | "booked" | "cancelled";

type Meeting = {
  id: string;
  title: string;
  patient: string;
  clinician: string;
  type: string;
  /** 0 = Monday … 6 = Sunday within the displayed week. */
  day: number;
  startHour: number;
  startMin: number;
  durationMin: number;
  status: Status;
  attendees: string[];
};

const DAY_START = 8; // 08:00
const DAY_END = 19; // 19:00
const HOUR_PX = 56;
const HOURS = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
  cancelled: {
    chip: "bg-[#f1f3f4] text-[#5f6368]",
    block:
      "border-[#9aa0a6]/30 bg-[#f1f3f4] text-[#5f6368] line-through hover:bg-[#e8eaed]",
    dot: "bg-[#9aa0a6]",
    label: "Cancelled",
  },
};

// A plausible weekly schedule. Anchored to whichever week is shown, so the
// grid is always populated — example data, not a live feed.
const SCHEDULE: Omit<Meeting, "id">[] = [
  { title: "Weight-loss consultation", patient: "Sarah Mitchell", clinician: "Dr. Zahhaad Khalil", type: "Initial consultation", day: 0, startHour: 9, startMin: 0, durationMin: 45, status: "attended", attendees: ["Sarah Mitchell", "Dr. Zahhaad Khalil"] },
  { title: "Follow-up review", patient: "James Cole", clinician: "Dr. Zahhaad Khalil", type: "Follow-up", day: 0, startHour: 11, startMin: 30, durationMin: 30, status: "attended", attendees: ["James Cole", "Dr. Zahhaad Khalil"] },
  { title: "Initial consultation", patient: "Priya Sharma", clinician: "Dr. Aisha Ahmed", type: "Initial consultation", day: 1, startHour: 10, startMin: 0, durationMin: 45, status: "booked", attendees: ["Priya Sharma", "Dr. Aisha Ahmed"] },
  { title: "ED treatment review", patient: "Michael Grant", clinician: "Dr. Zahhaad Khalil", type: "Follow-up", day: 2, startHour: 14, startMin: 0, durationMin: 30, status: "booked", attendees: ["Michael Grant", "Dr. Zahhaad Khalil"] },
  { title: "Weight-loss review", patient: "Emma Brown", clinician: "Dr. Aisha Ahmed", type: "Follow-up", day: 3, startHour: 9, startMin: 30, durationMin: 60, status: "booked", attendees: ["Emma Brown", "Dr. Aisha Ahmed"] },
  { title: "Period-delay consultation", patient: "Aisha Khan", clinician: "Dr. Aisha Ahmed", type: "Initial consultation", day: 3, startHour: 15, startMin: 0, durationMin: 30, status: "cancelled", attendees: ["Aisha Khan", "Dr. Aisha Ahmed"] },
  { title: "Follow-up review", patient: "David Lee", clinician: "Dr. Zahhaad Khalil", type: "Follow-up", day: 4, startHour: 12, startMin: 0, durationMin: 45, status: "booked", attendees: ["David Lee", "Dr. Zahhaad Khalil"] },
  { title: "Initial consultation", patient: "Grace Okafor", clinician: "Dr. Aisha Ahmed", type: "Initial consultation", day: 4, startHour: 16, startMin: 0, durationMin: 45, status: "booked", attendees: ["Grace Okafor", "Dr. Aisha Ahmed"] },
];

function startOfWeek(base: Date): Date {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // Mon = 0
  d.setDate(d.getDate() - dow);
  return d;
}

function fmtTime(h: number, m: number): string {
  const period = h < 12 ? "am" : "pm";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, "0")}${period}`;
}

function endTime(m: Meeting): { h: number; m: number } {
  const total = m.startHour * 60 + m.startMin + m.durationMin;
  return { h: Math.floor(total / 60), m: total % 60 };
}

export default function CalendarClient() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<Meeting | null>(null);

  const weekStart = useMemo(() => {
    const s = startOfWeek(new Date());
    s.setDate(s.getDate() + weekOffset * 7);
    return s;
  }, [weekOffset]);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekStart],
  );

  const meetings: Meeting[] = useMemo(
    () => SCHEDULE.map((m, i) => ({ ...m, id: `m${weekOffset}-${i}` })),
    [weekOffset],
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIndex = days.findIndex((d) => d.getTime() === today.getTime());

  const monthLabel = weekStart.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#f7f9f2] px-4 py-6 md:px-8">
      {/* Header */}
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-ui text-[22px] font-semibold text-[#142e2a]">Calendar</h1>
            <p className="mt-0.5 font-ui text-[13px] text-[#5f6368]">
              Booked and attended consultations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="h-9 rounded-lg border border-[#142e2a]/15 bg-white px-4 font-ui text-[13px] font-medium text-[#142e2a] transition-colors hover:bg-[#f1f3f4]"
            >
              Today
            </button>
            <div className="flex items-center overflow-hidden rounded-lg border border-[#142e2a]/15 bg-white">
              <button
                type="button"
                aria-label="Previous week"
                onClick={() => setWeekOffset((w) => w - 1)}
                className="grid h-9 w-9 place-items-center text-[#142e2a] transition-colors hover:bg-[#f1f3f4]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Next week"
                onClick={() => setWeekOffset((w) => w + 1)}
                className="grid h-9 w-9 place-items-center border-l border-[#142e2a]/10 text-[#142e2a] transition-colors hover:bg-[#f1f3f4]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <span className="ml-1 font-ui text-[15px] font-semibold text-[#142e2a]">{monthLabel}</span>
            {/* View toggle — Week active; Day/Month are placeholders for now. */}
            <div className="ml-1 hidden items-center overflow-hidden rounded-lg border border-[#142e2a]/15 bg-white sm:flex">
              {["Day", "Week", "Month"].map((v) => (
                <button
                  key={v}
                  type="button"
                  disabled={v !== "Week"}
                  aria-pressed={v === "Week"}
                  title={v !== "Week" ? "Coming soon" : undefined}
                  className={`h-9 px-3 font-ui text-[13px] font-medium transition-colors ${
                    v === "Week"
                      ? "bg-[#142e2a] text-white"
                      : "text-[#9aa0a6] cursor-not-allowed"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Example-data notice */}
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#e8b53d]/40 bg-[#fef7e6] px-4 py-2.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-px shrink-0">
            <path d="M12 9v4m0 4h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.42 0z" stroke="#8a6d12" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="font-ui text-[12.5px] leading-[18px] text-[#8a6d12]">
            Preview with example bookings — the scheduling / video-call system isn&rsquo;t
            connected yet, so the <strong>Join call</strong> action is disabled.
          </p>
        </div>

        {/* ── Week grid (md+) ── */}
        <div className="mt-4 hidden overflow-hidden rounded-xl border border-[#142e2a]/10 bg-white md:block">
          {/* Day header row */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-[#142e2a]/10">
            <div className="border-r border-[#142e2a]/10" />
            {days.map((d, i) => {
              const isToday = i === todayIndex;
              return (
                <div
                  key={i}
                  className={`border-r border-[#142e2a]/10 py-2 text-center last:border-r-0 ${
                    isToday ? "bg-[#e8f0fe]" : ""
                  }`}
                >
                  <div className="font-ui text-[11px] font-medium uppercase tracking-[0.04em] text-[#5f6368]">
                    {WEEKDAYS[i]}
                  </div>
                  <div
                    className={`mx-auto mt-0.5 grid h-7 w-7 place-items-center rounded-full font-ui text-[15px] font-semibold ${
                      isToday ? "bg-[#1a56c4] text-white" : "text-[#142e2a]"
                    }`}
                  >
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)]">
            {/* Time gutter */}
            <div className="border-r border-[#142e2a]/10">
              {HOURS.map((h) => (
                <div key={h} className="relative" style={{ height: HOUR_PX }}>
                  <span className="absolute -top-2 right-1.5 font-ui text-[11px] text-[#9aa0a6]">
                    {fmtTime(h, 0)}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((_, dayIdx) => (
              <div
                key={dayIdx}
                className={`relative border-r border-[#142e2a]/10 last:border-r-0 ${
                  dayIdx === todayIndex ? "bg-[#1a56c4]/[0.03]" : ""
                }`}
              >
                {/* Hour lines */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="border-b border-[#142e2a]/8"
                    style={{ height: HOUR_PX }}
                  />
                ))}

                {/* Events for this day */}
                {meetings
                  .filter((m) => m.day === dayIdx)
                  .map((m) => {
                    const top = (m.startHour - DAY_START + m.startMin / 60) * HOUR_PX;
                    const height = Math.max((m.durationMin / 60) * HOUR_PX - 3, 22);
                    const st = STATUS_STYLE[m.status];
                    const isSel = selected?.id === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelected(m)}
                        style={{ top, height }}
                        className={`absolute inset-x-1 overflow-hidden rounded-md border px-2 py-1 text-left transition-colors ${st.block} ${
                          isSel ? "ring-2 ring-[#142e2a] ring-offset-1" : ""
                        }`}
                      >
                        <span className="block truncate font-ui text-[11.5px] font-semibold leading-[15px]">
                          {m.title}
                        </span>
                        <span className="block truncate font-ui text-[10.5px] leading-[14px] opacity-80">
                          {fmtTime(m.startHour, m.startMin)} · {m.patient}
                        </span>
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>

        {/* ── Agenda list (mobile) ── */}
        <div className="mt-4 flex flex-col gap-4 md:hidden">
          {days.map((d, dayIdx) => {
            const dayMeetings = meetings
              .filter((m) => m.day === dayIdx)
              .sort((a, b) => a.startHour * 60 + a.startMin - (b.startHour * 60 + b.startMin));
            if (dayMeetings.length === 0) return null;
            const isToday = dayIdx === todayIndex;
            return (
              <div key={dayIdx} className="rounded-xl border border-[#142e2a]/10 bg-white p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full font-ui text-[13px] font-semibold ${
                      isToday ? "bg-[#1a56c4] text-white" : "bg-[#f1f3f4] text-[#142e2a]"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  <span className="font-ui text-[14px] font-semibold text-[#142e2a]">
                    {d.toLocaleDateString("en-GB", { weekday: "long" })}
                  </span>
                </div>
                <ul className="flex flex-col gap-2">
                  {dayMeetings.map((m) => {
                    const st = STATUS_STYLE[m.status];
                    return (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => setSelected(m)}
                          className="flex w-full items-center gap-3 rounded-lg border border-[#142e2a]/10 bg-white px-3 py-2 text-left transition-colors hover:bg-[#f7f9f2]"
                        >
                          <span className={`h-9 w-1 shrink-0 rounded-full ${st.dot}`} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-ui text-[14px] font-semibold text-[#142e2a]">
                              {m.title}
                            </span>
                            <span className="block truncate font-ui text-[12px] text-[#5f6368]">
                              {fmtTime(m.startHour, m.startMin)} · {m.patient}
                            </span>
                          </span>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 font-ui text-[11px] font-semibold ${st.chip}`}>
                            {st.label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Details panel ── */}
      {selected ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setSelected(null)}
            aria-hidden
          />
          <aside
            role="dialog"
            aria-label="Meeting details"
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[380px] sm:max-h-none sm:rounded-none"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_STYLE[selected.status].dot}`} />
                <span className={`rounded-full px-2 py-0.5 font-ui text-[11px] font-semibold ${STATUS_STYLE[selected.status].chip}`}>
                  {STATUS_STYLE[selected.status].label}
                </span>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setSelected(null)}
                className="grid h-8 w-8 place-items-center rounded-full text-[#5f6368] transition-colors hover:bg-[#f1f3f4]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <h2 className="mt-3 font-ui text-[18px] font-semibold text-[#142e2a]">
              {selected.title}
            </h2>

            <dl className="mt-4 flex flex-col gap-3">
              <Row label="When">
                {(() => {
                  const d = days[selected.day];
                  const e = endTime(selected);
                  return `${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · ${fmtTime(selected.startHour, selected.startMin)} – ${fmtTime(e.h, e.m)}`;
                })()}
              </Row>
              <Row label="Type">{selected.type}</Row>
              <Row label="Patient">{selected.patient}</Row>
              <Row label="Clinician">{selected.clinician}</Row>
              <Row label="Attendees">
                <ul className="flex flex-col gap-1.5">
                  {selected.attendees.map((a) => (
                    <li key={a} className="flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-[#142e2a] font-ui text-[11px] font-semibold text-white">
                        {a.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </span>
                      {a}
                    </li>
                  ))}
                </ul>
              </Row>
            </dl>

            {/* Disabled Join call */}
            <div className="mt-6">
              <button
                type="button"
                disabled
                title="Video calling isn't connected yet"
                aria-disabled="true"
                className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-[#142e2a]/30 font-ui text-[14px] font-semibold text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M15 10l4.55-2.27A1 1 0 0 1 21 8.62v6.76a1 1 0 0 1-1.45.89L15 14M5 6h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Join call
              </button>
              <p className="mt-2 text-center font-ui text-[11.5px] text-[#9aa0a6]">
                Available once the video-call system is connected.
              </p>
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-ui text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9aa0a6]">
        {label}
      </dt>
      <dd className="mt-0.5 font-ui text-[14px] text-[#142e2a]">{children}</dd>
    </div>
  );
}
