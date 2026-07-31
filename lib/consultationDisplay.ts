/**
 * Shared display helpers for consultation answers — used by both the
 * clinical-queue detail view and the /admin-tools edit page so labels,
 * dates and numbers render identically (and correctly) in both places.
 */

/** Human-friendly labels for known questionnaire keys. */
export const CONSULTATION_LABELS: Record<string, string> = {
  // Prescription
  intended_medicine_v2: "Requested medication",
  medication_type_preference: "Treatment type preference",
  requested_dose: "Requested dose",
  current_glp_1_use_status: "Previous GLP-1 use",
  current_dose: "Current / last dose",
  last_injection_date: "Last injection date",
  missed_more_than_2_doses: "Missed 2+ doses in a row",
  most_recent_injection_used_v2: "Most recent injection",
  switching_intention: "Switching intention",
  reorder_dose_choice: "Requested dose",
  // Safety
  safety_flags: "Medical conditions / safety flags",
  comorbidities: "Weight-related conditions",
  wegovy_72_current_symptoms_v2: "Current symptoms",
  reorder_has_side_effects: "Has side effects",
  reorder_side_effects: "Side effects reported",
  reorder_side_effect_severity: "Side-effect severity",
  reorder_new_clinical_event: "Anything changed since last order",
  reorder_new_clinical_event_details: "What changed",
  reorder_weight_loss_goal: "Weight still to lose",
  reorder_medical_history: "Medical history & medicines",
  reorder_pregnancy_flag: "Pregnancy status",
  reorder_four_weeks_complete: "4+ weeks on current dose",
  reorder_callback_request: "Clinician callback requested",
  prescription_evidence_upload: "Prescription evidence",
  // Patient
  fullName: "Full name",
  which_ethnicity_are_you: "Ethnicity",
  height_cm: "Height",
  current_weight_kg: "Current weight",
  date_of_birth_consultation: "Date of birth",
  consultation_mobile_number_v2: "Mobile",
  // GP
  gp_practice_name: "GP practice",
  gp_practice_full_address: "GP address",
  // Consultation
  video_consultation_preference: "Video booking",
  consultation_consent_confirmed: "Consent confirmed",
  reorder_consent_confirmed: "Consent confirmed",
  willing_to_follow_reduced_calorie_diet_and_increase_physical_activity:
    "Lifestyle commitment",
  // Goals
  motivation: "Motivation",
  why_joodlife: "Why they chose Jood",
  // Reorder progress
  reorder_progress: "Treatment progress",
  reorder_progress_note: "Progress note",
  reorder_pharmacist_question: "Question for pharmacist",
};

/** snake_case / prefixed keys → readable Title Case fallback label. */
export function prettify(key: string): string {
  return key
    .replace(/_v2$/i, "")
    .replace(/^(reorder|ed|pd)_/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export const labelFor = (key: string) => CONSULTATION_LABELS[key] ?? prettify(key);

/** True for answer keys that hold a date value. */
export function isDateKey(key: string): boolean {
  return /(_date$|date_of_birth|_dob$|birthdate)/i.test(key);
}

/**
 * Robustly coerce a stored date value into a Date.
 * Handles ISO strings ("1990-01-01"), and epoch numbers stored as either
 * milliseconds (e.g. 565488000000) or seconds — some older consultations
 * saved the date-picker value as a raw epoch, which rendered as a giant
 * meaningless number in the dashboard.
 */
export function toDate(v: unknown): Date | null {
  if (v === null || v === undefined || v === "") return null;
  let d: Date | null = null;
  if (typeof v === "number") {
    d = new Date(v);
  } else {
    const s = String(v).trim();
    if (/^-?\d+$/.test(s)) {
      const n = Number(s);
      d = new Date(n);
      const y = d.getFullYear();
      // If epoch-as-ms lands absurdly far out, it was probably seconds.
      if (y < 1900 || y > 2100) d = new Date(n * 1000);
    } else {
      d = new Date(s);
    }
  }
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

/** Format a date value as "07 May 1988" (or "—" if unparseable). */
export function fmtDate(v: unknown): string {
  const d = toDate(v);
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Round a numeric value to at most 1 decimal, dropping a trailing ".0". */
export function fmtNum(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v ?? "—");
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/** Age in whole years from a date-of-birth value, or null. */
export function ageFromDob(v: unknown): number | null {
  const birth = toDate(v);
  if (!birth) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 && age < 130 ? age : null;
}
