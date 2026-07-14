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

function tabOf(c: Consultation): TabKey {
  if (c.isReorder) return "reorder";
  return c.answers.video_consultation_preference ? "booked" : "notbooked";
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
    <div className="flex flex-col gap-0.5 py-[5px] sm:flex-row sm:gap-4">
      <dt className="w-[210px] shrink-0 text-[13px] font-semibold text-[#1f2937]">{label}</dt>
      <dd className="text-[13px] leading-[20px] text-[#4b5563] break-words">{node}</dd>
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
      <dl className="divide-y divide-[#f3f4f6]">
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

function SummaryBar({
  c,
  reviewed,
  loading,
  error,
  onDecision,
}: {
  c: Consultation;
  reviewed?: boolean;
  loading?: boolean;
  error?: string | null;
  onDecision?: (dec: "approved" | "rejected") => void;
}) {
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
    <div className="sticky top-0 z-20 -mx-5 mb-3 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-y border-[#cdd8bf] bg-[#eef3e6]/95 px-5 py-3 backdrop-blur">
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

      {onDecision && !reviewed ? (
        <div className="flex flex-col items-end gap-1">
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => onDecision("approved")}
              className="rounded-lg bg-[#142e2a] px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#0c2421] disabled:opacity-60"
            >
              Approve supply
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => onDecision("rejected")}
              className="rounded-lg border border-[#142e2a]/30 bg-white px-4 py-1.5 text-[13px] font-semibold text-[#142e2a] transition-colors hover:border-[#142e2a] hover:bg-[#f7f9f2] disabled:opacity-60"
            >
              Reject supply
            </button>
          </div>
          {loading && <span className="text-[12px] text-[#4a5c46]">Saving…</span>}
          {error && <span className="text-[12px] text-[#dc2626]">{error}</span>}
        </div>
      ) : null}
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

function JoinCallButton({ email }: { email: string | null }) {
  const [state, setState] = useState<"idle" | "loading" | "none">("idle");
  const onClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!email || state === "loading") return;
      setState("loading");
      try {
        const res = await fetch(
          `/api/admin-tools/meet-link?email=${encodeURIComponent(email)}`,
          { credentials: "include", cache: "no-store" },
        );
        const j = await res.json();
        if (res.ok && j.ok && j.joinUrl) {
          window.open(String(j.joinUrl), "_blank", "noopener,noreferrer");
          setState("idle");
        } else {
          setState("none");
        }
      } catch {
        setState("none");
      }
    },
    [email, state],
  );
  if (!email) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      title="Open the Google Meet video consultation (link from HubSpot)"
      className="inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-3 py-0.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#1666d0] disabled:opacity-60"
      disabled={state === "loading"}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M15 8v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2Zm2 2.5 4-2.2v7.4l-4-2.2V10.5Z" />
      </svg>
      {state === "loading" ? "Opening…" : state === "none" ? "No link yet" : "Join call"}
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
}: {
  c: Consultation;
  onDecision: (id: number, decision: string, reason: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
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
      {/* Header row — name + status. The decision buttons live in the green
          sticky summary bar below, not here. */}
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
            <span className="text-[16px] font-bold text-[#111827]">
              {c.fullName || `Patient #${c.id}`}
            </span>
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
            {c.answers.video_consultation_preference ? (
              <JoinCallButton email={c.email} />
            ) : null}
          </div>
          {c.email && (
            <p className="mt-0.5 text-[12px] text-[#6b7280]">{c.email}</p>
          )}
          <p className="text-[11px] text-[#9ca3af]">
            Submitted: {fmt(c.createdAt)}
            {c.productSlug ? ` · ${c.productSlug}` : ""}
          </p>
        </div>
        <span className="text-[12px] font-mono text-[#9ca3af]">#{c.id}</span>
      </div>

      {/* Red flag banner */}
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

      {/* Expandable clinical detail */}
      <div className="mt-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-[12px] font-semibold text-[#1450b0] hover:underline"
        >
          {open ? "Hide clinical summary ▲" : "View clinical summary ▼"}
        </button>
        {/* On expand: the green sticky bar (metrics + Approve/Reject supply)
            appears first, then the full clinical detail below it. */}
        {open && (
          <div className="mt-3">
            <SummaryBar
              c={c}
              reviewed={c.reviewed}
              loading={loading}
              error={error}
              onDecision={runDecision}
            />
            <PatientDetails c={c} />
          </div>
        )}
      </div>

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
  // Worklist ordering. "oldest" = FIFO daily worklist (consultation order);
  // red-flagged unreviewed patients always float to the top regardless.
  const [sortMode, setSortMode] = useState<"oldest" | "newest" | "name">("oldest");
  // Batch approval selection (consultation ids).
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [batchBusy, setBatchBusy] = useState(false);

  const load = useCallback(async (all: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin-tools/clinical-review?status=${all ? "all" : "pending"}`,
        { credentials: "include", cache: "no-store" },
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Failed to load");
      const list: Consultation[] = json.consultations ?? [];
      setConsultations(list);
      setLoaded(Number(json.loaded ?? list.length));
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
      setLoading(false);
    }
  }, []);

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

  // Counts per tab. In the default "Pending only" view use the true full-DB
  // counts from the server (so the tabs sum to the same number as the sidebar
  // badge — not just the loaded page). In "All" mode fall back to counting the
  // loaded list.
  const localCounts = useMemo(() => {
    const base: Record<TabKey, number> = { booked: 0, notbooked: 0, reorder: 0 };
    for (const c of consultations) base[tabOf(c)] += 1;
    return base;
  }, [consultations]);
  const counts = !showAll && serverCounts ? serverCounts : localCounts;

  // Rows for the active tab, filtered by the search query.
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return consultations
      .filter((c) => tabOf(c) === tab)
      .filter((c) => {
        if (!q) return true;
        return (
          (c.fullName ?? "").toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q) ||
          String(c.id).includes(q)
        );
      })
      // Red-flagged, unreviewed patients first, then by the chosen order.
      .sort((x, y) => {
        const xf = x.hasRedFlags && !x.reviewed ? 1 : 0;
        const yf = y.hasRedFlags && !y.reviewed ? 1 : 0;
        if (xf !== yf) return yf - xf;
        if (sortMode === "name") {
          return (x.fullName ?? "").localeCompare(y.fullName ?? "");
        }
        const dx = +new Date(x.createdAt);
        const dy = +new Date(y.createdAt);
        return sortMode === "oldest" ? dx - dy : dy - dx;
      });
  }, [consultations, tab, query, sortMode]);

  const flaggedTotal = consultations.filter((c) => c.hasRedFlags && !c.reviewed).length;

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
              <option value="oldest">Consultation order (oldest first)</option>
              <option value="newest">Newest first</option>
              <option value="name">Name (A–Z)</option>
            </select>
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

        {/* Volume note — the queue loads the first 200 for speed; the tab
            counts + sidebar badge reflect the full pending total. */}
        {!showAll && totalPending != null && loaded < totalPending ? (
          <p className="mb-3 text-[12px] text-[#6b7280]">
            Showing the first {loaded} of {totalPending.toLocaleString("en-GB")} pending — use search to find a specific patient.
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
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
