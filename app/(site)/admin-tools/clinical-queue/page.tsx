"use client";

/**
 * DEV-03 / DEV-04 — Clinical Approval Queue
 *
 * Shows all consultations and reorders waiting for pharmacist review,
 * organised into three tabs (Video consultation booked / Consultation
 * not booked / Reorder) with a name search. Each patient expands into a
 * clean, sectioned clinical summary with a sticky summary bar.
 *
 * Pharmacist can approve or reject each one with a mandatory reason.
 * Decisions are logged (reviewer + timestamp + reason) and mirrored to
 * HubSpot (server-side — untouched by this UI).
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ageFromDob,
  fmtDate,
  fmtNum,
  labelFor,
} from "@/lib/consultationDisplay";
import { refreshAdminBadges } from "../AdminShell";

type Consultation = {
  id: number;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  productSlug: string | null;
  dose: string | null;
  status: string;
  createdAt: string;
  isReorder: boolean;
  redFlags: string[];
  hasRedFlags: boolean;
  reviewed: boolean;
  reviewDecision: string | null;
  reviewReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  answers: Record<string, unknown>;
};

type TabKey = "booked" | "notbooked" | "reorder";

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const isUrl = (v: unknown): v is string =>
  typeof v === "string" && /^https?:\/\//i.test(v.trim());

/** Turn a raw answer value into a readable string. */
function fmtValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  const s = String(v);
  if (s === "true") return "Yes";
  if (s === "false") return "No";
  return s;
}

/* Labels + date/number formatting live in lib/consultationDisplay so the
 * clinical-queue and the edit page render answers identically. */

/* ------------------------------------------------------------------ */
/* Derived clinical values                                             */
/* ------------------------------------------------------------------ */

function computeBmi(a: Record<string, unknown>): number | null {
  const w = Number(a.current_weight_kg);
  const h = Number(a.height_cm);
  if (!w || !h) return null;
  const bmi = w / Math.pow(h / 100, 2);
  return Math.round(bmi * 10) / 10;
}

function requestedDose(c: Consultation): string {
  return (
    (c.answers.requested_dose as string) ||
    (c.answers.reorder_dose_choice as string) ||
    c.dose ||
    ""
  );
}

/** Which medicine the patient selected / is on. */
function medicationName(c: Consultation): string {
  return (
    (c.answers.intended_medicine_v2 as string) ||
    (c.answers.most_recent_injection_used_v2 as string) ||
    (c.productSlug && c.productSlug !== "reorder" ? c.productSlug : "") ||
    ""
  );
}

/** Medicine + dose combined, e.g. "Mounjaro · 7.2 mg". */
function medicationAndDose(c: Consultation): string {
  const med = medicationName(c);
  const dose = requestedDose(c);
  if (med && dose) return `${med} · ${dose}`;
  return med || dose || "—";
}

/** Age from the stored value, falling back to a calc from date of birth. */
function ageOf(a: Record<string, unknown>): string {
  const stored = a._age;
  if (typeof stored === "number") return `${stored}`;
  const age = ageFromDob(a.date_of_birth_consultation);
  return age === null ? "—" : `${age}`;
}

function eligibilityStatus(c: Consultation): { label: string; tone: string } {
  if (c.reviewed) {
    return c.reviewDecision === "approved"
      ? { label: "Approved", tone: "text-[#2f5d2a]" }
      : { label: "Rejected", tone: "text-[#b91c1c]" };
  }
  if (c.hasRedFlags) return { label: "Needs review", tone: "text-[#b45309]" };
  return { label: "Eligible", tone: "text-[#2f5d2a]" };
}

function treatmentStage(a: Record<string, unknown>): string {
  const usage = a.current_glp_1_use_status as string | undefined;
  if (usage === "No, I have never used one") return "New patient";
  if (a.switching_intention === "Switch to the other one") return "Switching";
  if (usage) return "Maintenance / continuing";
  return "—";
}

/**
 * Which tab a patient belongs in.
 *
 * - Reorders and any red-flagged consultation go to "Reorder" (they need
 *   priority clinical attention).
 * - "Video consultation booked" holds patients who chose a video consult AND
 *   have an actual scheduled meeting time. `meetingTime` is the HubSpot start
 *   time for this patient: `undefined` = not looked up yet (treated optimistically
 *   as booked so rows don't flash), a string = has a real meeting, `null` =
 *   looked up and no meeting exists → they drop to "Consultation not booked".
 */
function categorize(c: Consultation, meetingTime?: string | null): TabKey {
  if (c.isReorder || c.hasRedFlags) return "reorder";
  const pref = !!c.answers.video_consultation_preference;
  if (!pref) return "notbooked";
  if (meetingTime === undefined) return "booked";
  return meetingTime ? "booked" : "notbooked";
}

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

function StatusBadge({ status, decision }: { status: string; decision: string | null }) {
  if (decision === "approved") return <span className="rounded-full bg-[#dff49f] px-2.5 py-0.5 text-[12px] font-semibold text-[#142e2a]">Approved</span>;
  if (decision === "rejected") return <span className="rounded-full bg-[#fee2e2] px-2.5 py-0.5 text-[12px] font-semibold text-[#991b1b]">Rejected</span>;
  if (status === "submitted") return <span className="rounded-full bg-[#eef3e6] px-2.5 py-0.5 text-[12px] font-semibold text-[#4a5c46]">Pending</span>;
  return <span className="rounded-full bg-[#e7efe0] px-2.5 py-0.5 text-[12px] font-semibold text-[#142e2a] capitalize">{status}</span>;
}

/** One label/value row — label bold, value regular. */
function Row({ label, value }: { label: string; value: unknown }) {
  const node = isUrl(value) ? (
    <a
      href={value}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-[#1450b0] underline underline-offset-2 hover:text-[#0f3d86]"
    >
      View image
    </a>
  ) : (
    fmtValue(value)
  );
  return (
    <div className="flex flex-col gap-0.5 border-b border-[#f3f4f6] py-[6px] last:border-b-0 sm:flex-row sm:gap-3">
      <dt className="w-[160px] shrink-0 text-[13px] font-semibold text-[#1f2937]">{label}</dt>
      <dd className="min-w-0 flex-1 text-[13px] leading-[20px] text-[#4b5563] break-words">{node}</dd>
    </div>
  );
}

type Item = { label: string; value: unknown };

function Section({ title, items }: { title: string; items: Item[] }) {
  const visible = items.filter(
    (i) => i.value !== undefined && i.value !== null && i.value !== "",
  );
  if (visible.length === 0) return null;
  return (
    <div className="border-t border-[#eceef1] pt-3">
      <h4 className="mb-1 text-[12px] font-bold uppercase tracking-[0.04em] text-[#111827]">
        {title}
      </h4>
      <dl className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
        {visible.map((i, idx) => (
          <Row key={idx} label={i.label} value={i.value} />
        ))}
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sticky summary bar                                                  */
/* ------------------------------------------------------------------ */

function SummaryBar({ c }: { c: Consultation }) {
  const bmi = computeBmi(c.answers);
  const elig = eligibilityStatus(c);
  const stats: { label: string; value: React.ReactNode; tone?: string }[] = [
    { label: "BMI", value: bmi != null ? `${bmi}` : "—" },
    {
      label: "Current weight",
      value: c.answers.current_weight_kg ? `${fmtNum(c.answers.current_weight_kg)} kg` : "—",
    },
    { label: "Medication & dose", value: medicationAndDose(c) },
    { label: "Eligibility", value: elig.label, tone: elig.tone },
    { label: "Age", value: ageOf(c.answers) },
  ];
  // The green summary bar is the sticky action bar: the metrics on the left,
  // the Approve / Reject supply buttons on the right. It pins to the top of
  // the screen while the pharmacist scrolls the clinical detail below.
  return (
    <div className="-mx-5 mb-3 flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-[#cdd8bf] bg-[#eef3e6] px-5 py-3">
      <div className="flex flex-wrap gap-x-8 gap-y-2">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#4a5c46]">
              {s.label}
            </span>
            <span className={`text-[14px] font-semibold ${s.tone ?? "text-[#142e2a]"}`}>
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Full clinical detail (replaces the raw answer dump)                 */
/* ------------------------------------------------------------------ */

const SECTION_KEYS = new Set<string>([
  // prescription
  "intended_medicine_v2", "medication_type_preference", "requested_dose",
  "current_glp_1_use_status",
  "current_dose", "last_injection_date", "missed_more_than_2_doses",
  "most_recent_injection_used_v2", "switching_intention", "reorder_dose_choice",
  "reorder_four_weeks_complete",
  // name is surfaced as "Name" from fullName — keep the raw keys out of the
  // "Other" catch-all so they don't show twice.
  "fullName",
  // safety
  "safety_flags", "comorbidities", "wegovy_72_current_symptoms_v2",
  "reorder_has_side_effects", "reorder_side_effects",
  "reorder_side_effect_severity", "reorder_new_clinical_event",
  "reorder_new_clinical_event_details", "reorder_pregnancy_flag",
  "prescription_evidence_upload",
  // patient
  "which_ethnicity_are_you", "height_cm", "current_weight_kg",
  "date_of_birth_consultation", "consultation_mobile_number_v2",
  "firstName", "lastName",
  // gp
  "gp_practice_name", "gp_practice_full_address",
  // consultation
  "video_consultation_preference", "consultation_consent_confirmed",
  "reorder_consent_confirmed",
  "willing_to_follow_reduced_calorie_diet_and_increase_physical_activity",
  // goals
  "motivation", "why_joodlife",
  // reorder progress
  "reorder_progress", "reorder_progress_note", "reorder_pharmacist_question",
  "reorder_callback_request",
]);

function PatientDetails({ c }: { c: Consultation }) {
  const a = c.answers;
  const bmi = computeBmi(a);

  const eligItems: Item[] = [
    { label: "BMI", value: bmi != null ? `${bmi}` : undefined },
    { label: "Clinical review required", value: c.hasRedFlags ? "Yes" : "No" },
    { label: "Eligible under PGD", value: c.hasRedFlags ? "Pending clinical review" : "Yes" },
    { label: "Patient stage", value: treatmentStage(a) },
  ];

  const prescriptionItems: Item[] = [
    { label: "Requested medication", value: a.intended_medicine_v2 },
    { label: "Medication preference", value: a.medication_type_preference },
    { label: "Requested dose", value: a.requested_dose ?? a.reorder_dose_choice },
    { label: "Previous GLP-1 use", value: a.current_glp_1_use_status },
    { label: "Current / last dose", value: a.current_dose },
    { label: "Last injection date", value: a.last_injection_date ? fmtDate(a.last_injection_date) : undefined },
    { label: "Missed 2+ doses in a row", value: a.missed_more_than_2_doses },
    { label: "Most recent injection", value: a.most_recent_injection_used_v2 },
    { label: "Switching intention", value: a.switching_intention },
    { label: "4+ weeks on current dose", value: a.reorder_four_weeks_complete },
  ];

  const safetyItems: Item[] = [
    { label: "Medical conditions", value: a.safety_flags ?? a.comorbidities },
    { label: "Current symptoms", value: a.wegovy_72_current_symptoms_v2 },
    { label: "Side effects", value: a.reorder_side_effects },
    { label: "Side-effect severity", value: a.reorder_side_effect_severity },
    { label: "Anything changed since last order", value: a.reorder_new_clinical_event },
    { label: "What changed", value: a.reorder_new_clinical_event_details },
    { label: "Pregnancy status", value: a.reorder_pregnancy_flag },
    { label: "Prescription evidence", value: a.prescription_evidence_upload },
    ...(c.redFlags.length ? [{ label: "Red flags", value: c.redFlags }] : []),
  ];

  const patientItems: Item[] = [
    { label: "Name", value: c.fullName },
    { label: "Date of birth", value: a.date_of_birth_consultation ? fmtDate(a.date_of_birth_consultation) : undefined },
    { label: "Age", value: ageOf(a) !== "—" ? ageOf(a) : undefined },
    { label: "Height", value: a.height_cm ? `${fmtNum(a.height_cm)} cm` : undefined },
    { label: "Weight", value: a.current_weight_kg ? `${fmtNum(a.current_weight_kg)} kg` : undefined },
    { label: "BMI", value: bmi != null ? `${bmi}` : undefined },
    { label: "Mobile", value: a.consultation_mobile_number_v2 ?? c.phone },
    { label: "Email", value: c.email },
    { label: "Ethnicity", value: a.which_ethnicity_are_you },
  ];

  const gpItems: Item[] = [
    { label: "GP practice", value: a.gp_practice_name },
    { label: "GP address", value: a.gp_practice_full_address },
  ];

  const consultationItems: Item[] = [
    { label: "Video booking", value: a.video_consultation_preference },
    { label: "Consent", value: a.consultation_consent_confirmed ?? a.reorder_consent_confirmed },
    {
      label: "Lifestyle commitment",
      value: a.willing_to_follow_reduced_calorie_diet_and_increase_physical_activity,
    },
    { label: "Clinician callback requested", value: a.reorder_callback_request },
  ];

  const goalItems: Item[] = [
    { label: "Motivation", value: a.motivation },
    { label: "Why they chose Jood", value: a.why_joodlife },
  ];

  // Anything not already surfaced — shown cleanly rather than dropped.
  const otherItems: Item[] = Object.entries(a)
    .filter(([k]) => !k.startsWith("_") && !SECTION_KEYS.has(k) && k !== "email")
    .map(([k, v]) => ({ label: labelFor(k), value: v }));

  return (
    <div className="mt-3 rounded-lg border border-[#e5e7eb] bg-white px-4 py-4">
      <div className="space-y-3">
        <Section title="Eligibility snapshot" items={eligItems} />
        <Section title="Prescription" items={prescriptionItems} />
        <Section title="Safety checks" items={safetyItems} />
        <Section title="Patient" items={patientItems} />
        <Section title="GP" items={gpItems} />
        <Section title="Consultation" items={consultationItems} />
        <Section title="Goals" items={goalItems} />
        <Section title="Other answers" items={otherItems} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Join call — fetches the Google Meet link from HubSpot on demand      */
/* ------------------------------------------------------------------ */

/** "Join call" — only rendered when HubSpot actually has a meeting link for
 *  this patient. Opens the video consultation in a new tab. */
function JoinCallButton({ joinUrl, disabled }: { joinUrl?: string | null; disabled?: boolean }) {
  if (!joinUrl) return null;
  const icon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 8v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2Z" />
      <path d="m17 10 4-2v8l-4-2" />
    </svg>
  );
  // Past consultation → the call already happened, so joining is disabled.
  if (disabled) {
    return (
      <span
        title="This consultation has already taken place"
        className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-[#e5e7eb] px-3.5 py-1.5 text-[13px] font-semibold text-[#9ca3af]"
      >
        {icon}
        Call ended
      </span>
    );
  }
  return (
    <a
      href={joinUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title="Open the Google Meet video consultation (link from HubSpot)"
      className="inline-flex items-center gap-1.5 rounded-lg bg-[#142e2a] px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#0c2421]"
    >
      {icon}
      Join call
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Booked-call timing — classify a meeting relative to now (UK time)    */
/* ------------------------------------------------------------------ */

const LONDON_TZ = "Europe/London";

type CallTiming = {
  when: "today" | "tomorrow" | "soon" | "future" | "past";
  dayDiff: number;
  timeLabel: string; // "15:00"
  dateLabel: string; // "Thu 23 Jul"
  relLabel: string; // "In 3 days"
};

/** YYYY-MM-DD for a date in UK time (en-CA formats ISO-style). */
function londonYMD(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: LONDON_TZ });
}
function ymdToUTC(ymd: string): number {
  const [y, m, day] = ymd.split("-").map(Number);
  return Date.UTC(y, (m || 1) - 1, day || 1);
}

/** Classify a booked meeting's start time relative to "now" in UK time. */
function describeCall(iso: string): CallTiming | null {
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) return null;
  const now = new Date();
  const dayDiff = Math.round(
    (ymdToUTC(londonYMD(start)) - ymdToUTC(londonYMD(now))) / 86_400_000,
  );
  const timeLabel = start.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: LONDON_TZ,
  });
  const dateLabel = start.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: LONDON_TZ,
  });
  let when: CallTiming["when"];
  if (dayDiff === 0) when = "today";
  else if (dayDiff === 1) when = "tomorrow";
  else if (dayDiff > 1 && dayDiff <= 3) when = "soon";
  else if (dayDiff > 3) when = "future";
  else when = "past";
  const relLabel = dayDiff > 1 ? `In ${dayDiff} days` : dateLabel;
  return { when, dayDiff, timeLabel, dateLabel, relLabel };
}

/** A pill summarising a patient's booked video-consultation time. Green +
 *  pulsing for calls happening today, amber for calls in the next couple of
 *  days (with a "within 48–72 hours" note), muted for later/past, and an
 *  "awaiting booking" state when the patient chose a video consult but has no
 *  scheduled meeting in HubSpot yet. Nothing for reorders. */
function MeetingBadge({
  meetingTime,
  videoPref,
  isReorder,
}: {
  meetingTime?: string | null;
  videoPref: boolean;
  isReorder: boolean;
}) {
  if (isReorder) return null;
  const timing = meetingTime ? describeCall(meetingTime) : null;

  if (timing) {
    const today = timing.when === "today";
    const upcoming = timing.when === "tomorrow" || timing.when === "soon";
    const tone = today
      ? "border-[#16a34a]/30 bg-[#f0fdf4] text-[#166534]"
      : upcoming
        ? "border-[#d97706]/30 bg-[#fffbeb] text-[#92400e]"
        : "border-[#e5e7eb] bg-[#f9fafb] text-[#6b7280]";
    let label: string;
    if (timing.when === "today") label = `Call today · ${timing.timeLabel}`;
    else if (timing.when === "tomorrow") label = `Call tomorrow · ${timing.timeLabel}`;
    else if (timing.when === "soon")
      label = `Call ${timing.relLabel.toLowerCase()} · ${timing.dateLabel}, ${timing.timeLabel}`;
    else if (timing.when === "future")
      label = `Call ${timing.dateLabel}, ${timing.timeLabel}`;
    else label = `Call was ${timing.dateLabel}, ${timing.timeLabel}`;
    return (
      <div className="flex flex-col items-end gap-1">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold ${tone}`}
        >
          {today && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#16a34a] opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#16a34a]" />
            </span>
          )}
          {label}
        </span>
        {upcoming && (
          <span className="text-[11px] text-[#92400e]">
            Your team will call within 48–72 hours.
          </span>
        )}
      </div>
    );
  }

  if (videoPref) {
    return (
      <span className="inline-flex items-center rounded-full border border-[#d97706]/30 bg-[#fffbeb] px-2.5 py-1 text-[12px] font-semibold text-[#92400e]">
        No call time booked yet
      </span>
    );
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Send reminder — nudges an unbooked patient to book their consult     */
/* ------------------------------------------------------------------ */

function SendReminderButton({ id, email }: { id: number; email: string | null }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const onClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!email || state === "sending" || state === "sent") return;
      setState("sending");
      try {
        const res = await fetch("/api/admin-tools/send-reminder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id, email }),
        });
        const j = await res.json();
        setState(res.ok && j.ok ? "sent" : "error");
      } catch {
        setState("error");
      }
    },
    [id, email, state],
  );
  if (!email) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      title="Email this patient a reminder to book their video consultation"
      disabled={state === "sending" || state === "sent"}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#142e2a]/30 bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#142e2a] transition-colors hover:border-[#142e2a] hover:bg-[#f7f9f2] disabled:opacity-60"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 5h16v14H4z" />
        <path d="m4 6 8 6 8-6" />
      </svg>
      {state === "sending"
        ? "Sending…"
        : state === "sent"
          ? "Reminder sent ✓"
          : state === "error"
            ? "Try again"
            : "Send reminder"}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Patient card                                                        */
/* ------------------------------------------------------------------ */

function ConsultationCard({
  c,
  onDecision,
  selectable,
  selected,
  onToggleSelect,
  joinUrl,
  meetingTime,
}: {
  c: Consultation;
  onDecision: (id: number, decision: string, reason: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
  joinUrl?: string | null;
  meetingTime?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDecision = useCallback(
    async (dec: "approved" | "rejected") => {
      if (loading) return;
      const ok = window.confirm(
        dec === "approved"
          ? "Approve supply for this patient?"
          : "Reject supply for this patient?",
      );
      if (!ok) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin-tools/clinical-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id: c.id, decision: dec, reason: "" }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error ?? "Failed");
        onDecision(c.id, dec, "");
        // Update the sidebar counts instantly: Clinical Queue −1, and an
        // approval bumps the Dispatch queue +1 — no refresh needed.
        refreshAdminBadges();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [c.id, loading, onDecision],
  );

  return (
    <div
      className={`rounded-[12px] border p-5 ${
        c.hasRedFlags && !c.reviewed
          ? "border-[#fca5a5] bg-[#fff8f8] shadow-[0_0_0_2px_#fca5a5]"
          : "border-[#e5e7eb] bg-white"
      }`}
    >
      {/* Sticky header block: patient identity + the three action buttons +
          (when expanded) the green metrics bar — all pinned to the top while
          the clinical detail below scrolls. */}
      <div className="sticky top-0 z-20 -mx-5 -mt-5 rounded-t-[12px] bg-white px-5 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {selectable && !c.reviewed ? (
                <input
                  type="checkbox"
                  aria-label={`Select ${c.fullName ?? `patient #${c.id}`} for batch approval`}
                  checked={!!selected}
                  onChange={() => onToggleSelect?.(c.id)}
                  className="h-4 w-4 cursor-pointer accent-[#142e2a]"
                />
              ) : null}
              {c.email ? (
                <a
                  href={`/admin-tools/customers/${encodeURIComponent(c.email)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="Open this customer's full record in a new tab"
                  className="text-[16px] font-bold text-[#111827] hover:text-[#1450b0] hover:underline"
                >
                  {c.fullName || `Patient #${c.id}`}
                </a>
              ) : (
                <span className="text-[16px] font-bold text-[#111827]">
                  {c.fullName || `Patient #${c.id}`}
                </span>
              )}
              <StatusBadge status={c.status} decision={c.reviewDecision} />
              {c.isReorder && (
                <span className="rounded-full bg-[#e7efe0] px-2.5 py-0.5 text-[11px] font-semibold text-[#142e2a]">
                  Reorder
                </span>
              )}
              {c.hasRedFlags && (
                <span className="rounded-full bg-[#fef2f2] px-2.5 py-0.5 text-[11px] font-bold text-[#b91c1c]">
                  Red flag
                </span>
              )}
            </div>
            {c.email && (
              <a
                href={`/admin-tools/customers/${encodeURIComponent(c.email)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Open this customer's full record in a new tab"
                className="mt-0.5 block w-fit text-[12px] text-[#6b7280] hover:text-[#1450b0] hover:underline"
              >
                {c.email}
              </a>
            )}
            <p className="text-[11px] text-[#9ca3af]">
              Submitted: {fmt(c.createdAt)}
              {c.productSlug ? ` · ${c.productSlug}` : ""}
            </p>
          </div>
          {/* Top-right actions: call time + Join call / reminder + Approve + Reject */}
          <div className="flex flex-col items-end gap-1.5">
            <MeetingBadge
              meetingTime={meetingTime}
              videoPref={!!c.answers.video_consultation_preference}
              isReorder={c.isReorder}
            />
            <div className="flex flex-wrap items-center justify-end gap-2">
              {joinUrl ? (
                <JoinCallButton
                  joinUrl={joinUrl}
                  disabled={!!(meetingTime && describeCall(meetingTime)?.when === "past")}
                />
              ) : !meetingTime && !c.isReorder ? (
                <SendReminderButton id={c.id} email={c.email} />
              ) : null}
              {!c.reviewed && (
                <>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => runDecision("approved")}
                    className="rounded-lg bg-[#142e2a] px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#0c2421] disabled:opacity-60"
                  >
                    Approve supply
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => runDecision("rejected")}
                    className="rounded-lg border border-[#142e2a]/30 bg-white px-4 py-1.5 text-[13px] font-semibold text-[#142e2a] transition-colors hover:border-[#142e2a] hover:bg-[#f7f9f2] disabled:opacity-60"
                  >
                    Reject supply
                  </button>
                </>
              )}
            </div>
            {loading && <span className="text-[11px] text-[#4a5c46]">Saving…</span>}
            {error && <span className="text-[11px] text-[#dc2626]">{error}</span>}
            <span className="text-[12px] font-mono text-[#9ca3af]">#{c.id}</span>
          </div>
        </div>

        {/* Show / hide the clinical detail */}
        <div className="mt-2 pb-2">
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-[12px] font-semibold text-[#1450b0] hover:underline"
          >
            {open ? "Hide clinical summary ▲" : "View clinical summary ▼"}
          </button>
        </div>

        {/* Green metrics bar — sticks together with the header above */}
        {open && <SummaryBar c={c} />}
      </div>

      {/* Red flag banner (scrolls under the sticky header) */}
      {c.hasRedFlags && !c.reviewed && c.redFlags.length > 0 && (
        <div className="mt-3 rounded-lg border border-[#fca5a5] bg-[#fff1f2] px-4 py-3">
          <p className="mb-1.5 text-[13px] font-bold text-[#b91c1c]">
            Red flag — clinical review required
          </p>
          <ul className="space-y-0.5">
            {c.redFlags.map((f, i) => (
              <li key={i} className="text-[12px] text-[#7f1d1d]">• {f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Full clinical detail (scrolls) */}
      {open && <PatientDetails c={c} />}

      {/* Decision already recorded */}
      {c.reviewed && (
        <div className={`mt-3 rounded-lg border px-4 py-3 ${
          c.reviewDecision === "approved"
            ? "border-[#a7f3d0] bg-[#f0fdf4]"
            : "border-[#fca5a5] bg-[#fff1f2]"
        }`}>
          <p className="text-[13px] font-semibold text-[#1a1a1a]">
            {c.reviewDecision === "approved" ? "Approved" : "Rejected"} by {c.reviewedBy ?? "pharmacist"}
          </p>
          <p className="text-[12px] text-[#6b7280]">{fmt(c.reviewedAt ?? null)}</p>
          {c.reviewReason && (
            <p className="mt-1 text-[12px] text-[#374151]">Reason: {c.reviewReason}</p>
          )}
        </div>
      )}

    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const TABS: { key: TabKey; label: string }[] = [
  { key: "booked", label: "Video consultation booked" },
  { key: "notbooked", label: "Consultation not booked" },
  { key: "reorder", label: "Reorder" },
];

export default function ClinicalQueuePage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [tab, setTab] = useState<TabKey>("booked");
  const [query, setQuery] = useState("");
  // True full-DB counts from the server (pending set) + how many are actually
  // loaded, so the tab pills/badge reflect the whole queue, not just the page.
  const [serverCounts, setServerCounts] = useState<Record<TabKey, number> | null>(null);
  const [totalPending, setTotalPending] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(0);
  // True full-DB red-flag count (pending set), so the badge isn't limited to
  // the loaded page.
  const [serverRedFlags, setServerRedFlags] = useState<number | null>(null);
  // Worklist ordering. "consult" = by booked video-consultation time (fetched
  // from HubSpot); "oldest"/"newest" = submission order; "name" = A–Z.
  // Red-flagged unreviewed patients always float to the top regardless.
  const [sortMode, setSortMode] = useState<"consult" | "oldest" | "newest" | "name">("oldest");
  // email -> booked consultation start (ISO) | null, lazily fetched for the
  // consultation-time sort.
  const [meetingTimes, setMeetingTimes] = useState<Record<string, string | null>>({});
  // email -> booked meeting join URL | null. Absent key = not looked up yet.
  const [meetLinks, setMeetLinks] = useState<Record<string, string | null>>({});
  const [loadingTimes, setLoadingTimes] = useState(false);
  // Batch approval selection (consultation ids).
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [batchBusy, setBatchBusy] = useState(false);
  // Whether the last page came back full (200) → there are more to load.
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const PAGE = 200;

  const load = useCallback(
    async (all: boolean, offset = 0, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin-tools/clinical-review?status=${all ? "all" : "pending"}&offset=${offset}`,
          { credentials: "include", cache: "no-store" },
        );
        const json = await res.json();
        if (!json.ok) throw new Error(json.error ?? "Failed to load");
        const list: Consultation[] = json.consultations ?? [];
        setConsultations((prev) => (append ? [...prev, ...list] : list));
        setLoaded((prev) => (append ? prev + list.length : list.length));
        setHasMore(list.length >= PAGE);
        setServerRedFlags(typeof json.redFlags === "number" ? json.redFlags : null);
        setTotalPending(typeof json.total === "number" ? json.total : null);
        setServerCounts(
          json.counts
            ? {
                booked: Number(json.counts.booked ?? 0),
                notbooked: Number(json.counts.notbooked ?? 0),
                reorder: Number(json.counts.reorder ?? 0),
              }
            : null,
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const t = setTimeout(() => load(showAll), 0);
    return () => clearTimeout(t);
  }, [showAll, load]);

  const handleDecision = useCallback((id: number, decision: string, reason: string) => {
    setConsultations((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              reviewed: true,
              reviewDecision: decision,
              reviewReason: reason,
              reviewedBy: "You",
              reviewedAt: new Date().toISOString(),
              answers: { ...c.answers, _review_decision: decision, _review_reason: reason },
            }
          : c,
      ),
    );
  }, []);

  // Collapse duplicate consultations for the same customer. HubSpot syncs can
  // create several rows per patient (same email + treatment), which showed up
  // as the same person twice in the queue. Keep one per (email + treatment):
  // prefer an unreviewed row, then the one that booked a video consult, then
  // the most recent submission.
  const dedupedConsultations = useMemo(() => {
    const best = new Map<string, Consultation>();
    for (const c of consultations) {
      const email = (c.email ?? "").trim().toLowerCase();
      // No email → can't dedupe reliably; keep as-is under a unique key.
      const key = email ? `${email}|${c.productSlug ?? ""}` : `id:${c.id}`;
      const cur = best.get(key);
      if (!cur) {
        best.set(key, c);
        continue;
      }
      const score = (x: Consultation) =>
        (x.reviewed ? 0 : 2) +
        (x.answers.video_consultation_preference ? 1 : 0);
      const sc = score(c);
      const scCur = score(cur);
      if (
        sc > scCur ||
        (sc === scCur && +new Date(c.createdAt) > +new Date(cur.createdAt)) ||
        (sc === scCur &&
          +new Date(c.createdAt) === +new Date(cur.createdAt) &&
          c.id > cur.id)
      ) {
        best.set(key, c);
      }
    }
    return Array.from(best.values());
  }, [consultations]);

  // Counts per tab, computed over the de-duplicated set. Booked / not-booked
  // are meeting-aware (client-side); reorder keeps the true server count.
  const localCounts = useMemo(() => {
    const base: Record<TabKey, number> = { booked: 0, notbooked: 0, reorder: 0 };
    for (const c of dedupedConsultations) {
      const mt = meetingTimes[(c.email ?? "").toLowerCase()];
      base[categorize(c, mt)] += 1;
    }
    return base;
  }, [dedupedConsultations, meetingTimes]);
  // Booked / not-booked are meeting-aware (depend on HubSpot times fetched
  // client-side), so their pills come from the loaded set. Reorder is fully
  // known server-side, so keep the true full-DB count for that pill.
  const counts: Record<TabKey, number> = {
    booked: localCounts.booked,
    notbooked: localCounts.notbooked,
    reorder: !showAll && serverCounts ? serverCounts.reorder : localCounts.reorder,
  };

  // Rows for the active tab, filtered by the search query.
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const mtOf = (c: Consultation) => meetingTimes[(c.email ?? "").toLowerCase()];
    const list = dedupedConsultations
      .filter((c) => categorize(c, mtOf(c)) === tab)
      .filter((c) => {
        if (!q) return true;
        return (
          (c.fullName ?? "").toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q) ||
          String(c.id).includes(q)
        );
      });

    // Booked tab: upcoming calls (today + future) soonest-first on top; calls
    // that have already happened sink to the bottom, latest first.
    if (tab === "booked") {
      return list.sort((x, y) => {
        const tx = mtOf(x) || null;
        const ty = mtOf(y) || null;
        const px = tx && (describeCall(tx)?.when === "past") ? 1 : 0;
        const py = ty && (describeCall(ty)?.when === "past") ? 1 : 0;
        if (px !== py) return px - py; // upcoming (0) before past (1)
        const vx = tx ? +new Date(tx) : Infinity;
        const vy = ty ? +new Date(ty) : Infinity;
        // Upcoming: soonest first (asc). Past: most recent first (desc).
        return px === 0 ? vx - vy : vy - vx;
      });
    }

    // Other tabs: red-flagged, unreviewed patients first, then chosen order.
    return list.sort((x, y) => {
      const xf = x.hasRedFlags && !x.reviewed ? 1 : 0;
      const yf = y.hasRedFlags && !y.reviewed ? 1 : 0;
      if (xf !== yf) return yf - xf;
      if (sortMode === "name") {
        return (x.fullName ?? "").localeCompare(y.fullName ?? "");
      }
      if (sortMode === "consult") {
        // Earliest booked consultation first; unbooked/unknown times last.
        const tx = mtOf(x) ?? null;
        const ty = mtOf(y) ?? null;
        if (tx !== ty) {
          if (!tx) return 1;
          if (!ty) return -1;
          return +new Date(tx) - +new Date(ty);
        }
        return +new Date(x.createdAt) - +new Date(y.createdAt);
      }
      const dx = +new Date(x.createdAt);
      const dy = +new Date(y.createdAt);
      return sortMode === "oldest" ? dx - dy : dy - dx;
    });
  }, [dedupedConsultations, tab, query, sortMode, meetingTimes]);

  // When sorting by consultation time, lazily fetch booked-consult start times
  // from HubSpot for the loaded patients we don't already have.
  // Look up booked-consult meeting info (start time + join link) from HubSpot
  // for the loaded patients we haven't checked yet. Runs on load so the "Join
  // call" button only appears when a link actually exists, and so the
  // consultation-time sort has real times.
  useEffect(() => {
    const emails = consultations
      .filter((c) => c.answers.video_consultation_preference && c.email)
      .map((c) => (c.email ?? "").toLowerCase())
      .filter((e) => e && !(e in meetLinks));
    if (emails.length === 0) return;
    const batch = emails.slice(0, 60);
    let off = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingTimes(true);
    (async () => {
      try {
        const res = await fetch("/api/admin-tools/meeting-times", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ emails: batch }),
        });
        const j = await res.json();
        if (!off && res.ok && j.ok) {
          // Resolve every requested email (value or null) so we don't re-request.
          const times: Record<string, string | null> = {};
          const links: Record<string, string | null> = {};
          for (const e of batch) {
            times[e] = j.times?.[e] ?? null;
            links[e] = j.links?.[e] ?? null;
          }
          setMeetingTimes((prev) => ({ ...prev, ...times }));
          setMeetLinks((prev) => ({ ...prev, ...links }));
        }
      } catch {
        /* leave unset → no Join button, submission-order sort */
      } finally {
        if (!off) setLoadingTimes(false);
      }
    })();
    return () => {
      off = true;
    };
  }, [consultations, meetLinks]);

  // Prefer the true full-DB red-flag count (pending mode); fall back to the
  // loaded set in "All" mode or if the server count is unavailable.
  const loadedFlagged = consultations.filter((c) => c.hasRedFlags && !c.reviewed).length;
  const flaggedTotal = !showAll && serverRedFlags != null ? serverRedFlags : loadedFlagged;

  // Ids selectable for batch approval in the current view (unreviewed only).
  const selectableIds = useMemo(
    () => rows.filter((c) => !c.reviewed).map((c) => c.id),
    [rows],
  );

  // Reset selection when the tab/query/data changes so stale ids can't linger.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(new Set());
  }, [tab, query, showAll]);

  const toggleSelect = useCallback((id: number) => {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const batchApprove = useCallback(async () => {
    if (selected.size === 0 || batchBusy) return;
    if (!window.confirm(`Approve supply for ${selected.size} selected patient(s)?`)) return;
    setBatchBusy(true);
    setError(null);
    const ids = [...selected];
    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch("/api/admin-tools/clinical-review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ id, decision: "approved", reason: "" }),
          }).then(async (res) => {
            const j = await res.json();
            if (!res.ok || !j.ok) throw new Error(j.error ?? "Failed");
            return id;
          }),
        ),
      );
      for (const r of results) {
        if (r.status === "fulfilled") handleDecision(r.value, "approved", "");
      }
      setSelected(new Set());
      refreshAdminBadges();
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) setError(`${failed} of ${ids.length} could not be approved.`);
    } finally {
      setBatchBusy(false);
    }
  }, [selected, batchBusy, handleDecision]);

  return (
    <main className="min-h-screen bg-[#f1f1f1] px-4 py-6 md:px-8">
      <div className="mx-auto max-w-[900px]">

        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-semibold text-[#1a1a1a]">Clinical Approval Queue</h1>
            <p className="mt-0.5 text-[13px] text-[#6b7280]">
              Review and approve or reject patient consultations and reorders before supply.
            </p>
          </div>
          {flaggedTotal > 0 && (
            <span className="inline-flex items-center rounded-full bg-[#dc2626] px-3 py-1 text-[13px] font-bold text-white">
              {flaggedTotal} red flag{flaggedTotal !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-4 flex flex-wrap gap-2 border-b border-[#e5e7eb]">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px border-b-2 px-4 py-2 text-[13px] font-semibold transition-colors ${
                tab === t.key
                  ? "border-[#142e2a] text-[#142e2a]"
                  : "border-transparent text-[#6b7280] hover:text-[#374151]"
              }`}
            >
              {t.label}
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                tab === t.key ? "bg-[#dff49f] text-[#142e2a]" : "bg-[#e7efe0] text-[#4a5c46]"
              }`}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Search + status toggle */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email or #ID…"
            className="h-9 flex-1 min-w-[220px] rounded-lg border border-[#d1d5db] bg-white px-3 text-[13px] text-[#374151] placeholder:text-[#9ca3af] focus:border-[#142e2a] focus:outline-none"
          />
          <button
            onClick={() => setShowAll(false)}
            className={`h-9 rounded-lg px-4 text-[13px] font-medium transition-colors ${
              !showAll ? "bg-[#142e2a] text-white" : "border border-[#d1d5db] bg-white text-[#374151] hover:bg-[#f3f4f6]"
            }`}
          >
            Pending only
          </button>
          <button
            onClick={() => setShowAll(true)}
            className={`h-9 rounded-lg px-4 text-[13px] font-medium transition-colors ${
              showAll ? "bg-[#142e2a] text-white" : "border border-[#d1d5db] bg-white text-[#374151] hover:bg-[#f3f4f6]"
            }`}
          >
            All
          </button>
          <label className="flex items-center gap-1.5 text-[12px] text-[#6b7280]">
            Sort
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as typeof sortMode)}
              className="h-9 rounded-lg border border-[#d1d5db] bg-white px-2 text-[13px] text-[#374151] focus:border-[#142e2a] focus:outline-none"
            >
              <option value="consult">Consultation time (booked)</option>
              <option value="oldest">Submitted (oldest first)</option>
              <option value="newest">Submitted (newest first)</option>
              <option value="name">Name (A–Z)</option>
            </select>
            {sortMode === "consult" && loadingTimes ? (
              <span className="text-[11px] text-[#9ca3af]">loading times…</span>
            ) : null}
          </label>
        </div>

        {/* Batch approval bar */}
        {selectableIds.length > 0 ? (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-[#cdd8bf] bg-[#eef3e6] px-4 py-2.5">
            <label className="flex items-center gap-2 text-[13px] font-medium text-[#142e2a]">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer accent-[#142e2a]"
                checked={selected.size > 0 && selectableIds.every((id) => selected.has(id))}
                ref={(el) => {
                  if (el) {
                    el.indeterminate =
                      selected.size > 0 &&
                      !selectableIds.every((id) => selected.has(id));
                  }
                }}
                onChange={(e) =>
                  setSelected(e.target.checked ? new Set(selectableIds) : new Set())
                }
              />
              Select all in view
            </label>
            {selected.size > 0 ? (
              <>
                <span className="text-[13px] font-semibold text-[#142e2a]">
                  {selected.size} selected
                </span>
                <button
                  type="button"
                  onClick={batchApprove}
                  disabled={batchBusy}
                  className="rounded-lg bg-[#142e2a] px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#0c2421] disabled:opacity-60"
                >
                  {batchBusy ? "Approving…" : `Approve ${selected.size} selected`}
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="rounded-lg border border-[#142e2a]/30 bg-white px-3 py-1.5 text-[13px] font-medium text-[#142e2a] hover:bg-[#f7f9f2]"
                >
                  Clear
                </button>
              </>
            ) : (
              <span className="text-[12px] text-[#4a5c46]">
                Tick patients to approve several at once.
              </span>
            )}
          </div>
        ) : null}

        {/* Result count — how many patients are showing in this tab, and the
            true full-DB total for the tab (not just the loaded page). */}
        {!loading && !error ? (
          <p className="mb-3 text-[12px] text-[#6b7280]">
            Showing <span className="font-semibold text-[#374151]">{rows.length.toLocaleString("en-GB")}</span>
            {" "}
            {rows.length === 1 ? "patient" : "patients"} in “{TABS.find((t) => t.key === tab)?.label}” (
            {counts[tab].toLocaleString("en-GB")} total)
            {totalPending != null && loaded < totalPending
              ? ` · ${loaded.toLocaleString("en-GB")} of ${totalPending.toLocaleString("en-GB")} loaded — Load more below, or search to jump to a patient`
              : ""}
            .
          </p>
        ) : null}

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[120px] animate-pulse rounded-[12px] bg-white" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[12px] border border-[#fca5a5] bg-[#fff1f2] p-6 text-center">
            <p className="text-[14px] font-semibold text-[#b91c1c]">Error loading queue</p>
            <p className="mt-1 text-[13px] text-[#6b7280]">{error}</p>
            <button
              onClick={() => load(showAll)}
              className="mt-3 inline-flex h-8 items-center rounded-lg bg-[#142e2a] px-4 text-[13px] text-white"
            >
              Retry
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-[12px] border border-[#d1fae5] bg-[#f0fdf4] p-10 text-center">
            <p className="text-[15px] font-semibold text-[#065f46]">
              {query ? "No patients match your search" : "Nothing in this tab"}
            </p>
            <p className="mt-1 text-[13px] text-[#6b7280]">
              {query
                ? "Try a different name, email or ID."
                : showAll
                  ? "No records here yet."
                  : "No patients are waiting for review in this tab."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((c) => (
              <ConsultationCard
                key={c.id}
                c={c}
                onDecision={handleDecision}
                selectable
                selected={selected.has(c.id)}
                onToggleSelect={toggleSelect}
                joinUrl={
                  c.answers.video_consultation_preference
                    ? (meetLinks[(c.email ?? "").toLowerCase()] ?? null)
                    : null
                }
                meetingTime={
                  c.answers.video_consultation_preference
                    ? (meetingTimes[(c.email ?? "").toLowerCase()] ?? null)
                    : undefined
                }
              />
            ))}
          </div>
        )}

        {/* Load more — walks the whole pending set in pages of 200. */}
        {!loading && !error && hasMore ? (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => load(showAll, consultations.length, true)}
              disabled={loadingMore}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[#142e2a]/15 bg-white px-6 font-ui text-[14px] font-semibold text-[#142e2a] transition-colors hover:bg-[#f7f9f2] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingMore
                ? "Loading…"
                : `Load more${
                    totalPending != null
                      ? ` (${Math.max(0, totalPending - loaded).toLocaleString("en-GB")} more)`
                      : ""
                  }`}
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
