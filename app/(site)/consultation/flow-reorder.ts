/**
 * Reorder / resupply flow — Jood Life (optimised, client update 2026-07).
 *
 * Goal: let a pharmacist safely decide to continue / increase / reduce /
 * pause treatment (or contact the patient) using as few questions as
 * possible. Conditional screens only appear when relevant:
 *   - progress note        → only when "Not so well"
 *   - side effect detail    → only when "Yes" to side effects
 *   - "what's changed" note  → only when "Yes" to anything changed
 *   - 4-week confirmation    → only when "Move up to the next dose"
 *
 * No hard blocks in the UI — every reorder reaches a "received" terminal
 * and is reviewed by a pharmacist server-side. Serious symptoms, "Severe"
 * severity, and pregnancy/trying/breastfeeding automatically raise a
 * High Priority Pharmacist Review in HubSpot (see app/api/consultations).
 * Saved with productSlug = "reorder".
 */
import { type SlideDef } from "./flow";

export const REORDER_TOTAL_STEPS = 10;

/** Common side effects — no automatic red flag. */
export const REORDER_COMMON_SIDE_EFFECTS = [
  "Feeling sick (nausea)",
  "Constipation",
  "Diarrhoea",
  "Vomiting",
  "Tiredness",
  "Headache",
  "Injection site soreness",
  "Reduced appetite",
  "Other",
];

/** Serious symptoms — each auto-creates a High Priority Pharmacist Review. */
export const REORDER_SERIOUS_SIDE_EFFECTS = [
  "Severe stomach pain",
  "Pain under the ribs or yellow skin/eyes",
  "Severe dehydration",
  "Rash, swelling or difficulty breathing",
  "New or worsening low mood",
  "Something else that feels serious",
];

export const REORDER_SLIDES: SlideDef[] = [
  {
    id: "s0",
    type: "consent",
    step: 0,
    title: "Reorder your treatment",
    subtitle:
      "A few quick questions so our pharmacist can review your repeat supply. It takes under 2 minutes.",
    bullets: [],
    field: "reorder_consent_confirmed",
    next: () => "s_email",
  },

  // ── STEP 1 — Confirm account ────────────────────────────────────
  {
    id: "s_email",
    type: "email",
    step: 1,
    title: "What's the email address on your Jood account?",
    subtitle: "We use this to find your treatment records.",
    field: "email",
    next: () => "s_progress",
  },

  // ── STEP 2 — Progress ───────────────────────────────────────────
  {
    id: "s_progress",
    type: "single",
    step: 2,
    title: "How are you getting on with your treatment?",
    field: "reorder_progress",
    options: ["Really well", "Quite well", "Not so well"],
    next: (a) =>
      a.reorder_progress === "Not so well" ? "s_progress_note" : "s_side_effects",
  },
  {
    id: "s_progress_note",
    type: "textarea",
    step: 2,
    title: "Tell us a little more",
    subtitle: "This helps our pharmacist understand how to best support you.",
    field: "reorder_progress_note",
    placeholder: "Tell us a little more… (optional)",
    required: false,
    next: () => "s_side_effects",
  },

  // ── STEP 3 — Side effects ───────────────────────────────────────
  {
    id: "s_side_effects",
    type: "single",
    step: 3,
    title: "Have you had any side effects since your last order?",
    field: "reorder_has_side_effects",
    options: ["No", "Yes"],
    auto: true,
    next: (a) =>
      a.reorder_has_side_effects === "Yes" ? "s_side_effects_which" : "s_weight",
  },
  {
    id: "s_side_effects_which",
    type: "multi",
    step: 3,
    title: "Which side effects have you had?",
    subtitle:
      "Tick all that apply. If anything feels serious, please tell us — our pharmacist will look at this carefully.",
    field: "reorder_side_effects",
    options: [
      ...REORDER_COMMON_SIDE_EFFECTS,
      ...REORDER_SERIOUS_SIDE_EFFECTS,
    ],
    next: () => "s_severity",
  },
  {
    id: "s_severity",
    type: "single",
    step: 3,
    title: "Are these side effects:",
    field: "reorder_side_effect_severity",
    options: ["Mild", "Moderate", "Severe"],
    auto: true,
    next: () => "s_weight",
  },

  // ── STEP 4 — Current weight + goal ──────────────────────────────
  {
    id: "s_weight",
    type: "weight",
    step: 4,
    title: "What's your current weight?",
    field: "current_weight_kg",
    next: () => "s_goal_weight",
  },
  {
    id: "s_goal_weight",
    type: "single",
    step: 4,
    title: "How much more weight would you like to lose?",
    subtitle: "This helps your clinician tailor your ongoing plan.",
    field: "reorder_weight_loss_goal",
    options: [
      "Under 5 kg (under 11 lbs)",
      "5–10 kg (11–22 lbs)",
      "10–20 kg (22–44 lbs)",
      "More than 20 kg (44+ lbs)",
      "I'm not sure",
    ],
    next: () => "s_change",
  },

  // ── STEP 5 — Anything changed? ──────────────────────────────────
  {
    id: "s_change",
    type: "single",
    step: 5,
    title: "Since your last order, has anything changed?",
    subtitle:
      "For example: a new medicine, a new health condition, a hospital visit, surgery, or pregnancy.",
    field: "reorder_new_clinical_event",
    options: ["No", "Yes"],
    next: (a) =>
      a.reorder_new_clinical_event === "Yes" ? "s_change_detail" : "s_pregnancy",
  },
  {
    id: "s_change_detail",
    type: "textarea",
    step: 5,
    title: "Tell us what's changed",
    subtitle:
      "For example: a new medicine, a new health condition, a hospital visit, surgery, or pregnancy.",
    field: "reorder_new_clinical_event_details",
    placeholder: "Tell us what's changed…",
    next: () => "s_pregnancy",
  },

  // ── STEP 6 — Pregnancy (hard stop under PGDs) ───────────────────
  {
    id: "s_pregnancy",
    type: "single",
    step: 6,
    title: "Are you currently:",
    field: "reorder_pregnancy_flag",
    options: ["Pregnant", "Trying for a baby", "Breastfeeding", "None of these"],
    next: () => "s_gp",
  },

  // ── STEP 7 — GP details + medical history update ────────────────
  {
    id: "s_gp",
    type: "gp",
    step: 7,
    title: "Confirm your GP details",
    subtitle:
      "The practice where you're registered. If you share your GP details, we'll keep them informed about your treatment — this supports safe, coordinated care.",
    field: "gp_practice_name",
    next: () => "s_medical_history",
  },
  {
    id: "s_medical_history",
    type: "textarea",
    step: 7,
    title: "Your medical history and current medicines",
    subtitle:
      "List any medical conditions and the medicines you take. If nothing has changed since your last order, just write “No changes”.",
    field: "reorder_medical_history",
    placeholder: "e.g. Type 2 diabetes; metformin 500 mg — or “No changes”",
    next: () => "s_dose",
  },

  // ── STEP 8 — Next dose ──────────────────────────────────────────
  {
    id: "s_dose",
    type: "single",
    step: 8,
    title: "What would you like to do next?",
    field: "reorder_dose_choice",
    options: [
      "Stay on my current dose",
      "Move up to the next dose",
      "Move down a dose",
      "I'm not sure",
    ],
    next: (a) =>
      a.reorder_dose_choice === "Move up to the next dose"
        ? "s_four_weeks"
        : "s_pharmacist_q",
  },
  {
    id: "s_four_weeks",
    type: "single",
    step: 8,
    title: "Have you completed at least 4 weeks on your current dose?",
    field: "reorder_four_weeks_complete",
    options: ["Yes", "No", "Not sure"],
    auto: true,
    next: () => "s_pharmacist_q",
  },

  // ── STEP 9 — Message to pharmacist ──────────────────────────────
  {
    id: "s_pharmacist_q",
    type: "textarea",
    step: 9,
    title: "Anything you'd like your clinician to know?",
    field: "reorder_pharmacist_question",
    placeholder: "Your message… (optional)",
    required: false,
    next: () => "s_callback",
  },

  // ── STEP 10 — Clinician call ────────────────────────────────────
  {
    id: "s_callback",
    type: "single",
    step: 10,
    title: "Would you like a call from one of our clinicians?",
    subtitle:
      "We're always happy to help if you'd like to discuss your treatment or have any questions.",
    field: "reorder_callback_request",
    options: [
      "Yes, I'd like a clinician to call me",
      "No thanks, I'm happy to continue",
    ],
    next: () => "s_success",
  },

  { id: "s_success", type: "success", step: REORDER_TOTAL_STEPS, title: "" },
];
