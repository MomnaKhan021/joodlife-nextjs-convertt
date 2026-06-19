/**
 * Reorder / resupply flow — Jood Life.
 * Port of the Shopify jood-reorder wizard (brief §3). 6 questions; the side
 * effect detail screens (2a/2b) show only when "side effects = Yes". No hard
 * blocks — every reorder reaches a "received" terminal and is reviewed by a
 * pharmacist server-side. Saved with productSlug = "reorder".
 */
import { type SlideDef } from "./flow";

export const REORDER_TOTAL_STEPS = 6;

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
  {
    id: "s_email",
    type: "email",
    step: 1,
    title: "The email on your Jood account",
    subtitle: "We use this to find your records so the pharmacist can review your reorder.",
    field: "email",
    next: () => "s_progress",
  },
  {
    id: "s_progress",
    type: "single",
    step: 2,
    title: "How have you got on with your treatment since your last order?",
    field: "reorder_progress",
    options: ["Well", "OK", "Not well"],
    next: () => "s_progress_note",
  },
  {
    id: "s_progress_note",
    type: "textarea",
    step: 2,
    title: "Anything you'd like to add?",
    field: "reorder_progress_note",
    placeholder: "Tell us a little more… (optional)",
    required: false,
    next: () => "s_side_effects",
  },
  {
    id: "s_side_effects",
    type: "single",
    step: 3,
    title: "Have you had any side effects since your last order?",
    field: "reorder_has_side_effects",
    options: ["Yes", "No"],
    auto: true,
    next: (a) => (a.reorder_has_side_effects === "Yes" ? "s_side_effects_which" : "s_weight"),
  },
  {
    id: "s_side_effects_which",
    type: "multi",
    step: 3,
    title: "Which side effects? Tick all that apply.",
    subtitle:
      "If anything feels severe or you're worried, please tell us — our pharmacist will look at this carefully.",
    field: "reorder_side_effects",
    options: [
      "Severe stomach (abdominal) pain, especially if it spreads to your back",
      "Severe pain in the upper-right tummy, yellowing of the skin or eyes, or fever",
      "Persistent vomiting or diarrhoea, or feeling very dehydrated",
      "Signs of an allergic reaction — rash, swelling of the face/lips/throat, or difficulty breathing",
      "New or worsening low mood, or any thoughts of harming yourself",
      "Any other symptom you would describe as severe",
      "Mild nausea",
      "Constipation",
      "Occasional diarrhoea",
      "Reduced appetite",
      "Tiredness",
      "Headache",
      "Injection-site redness or soreness",
    ],
    next: () => "s_severity",
  },
  {
    id: "s_severity",
    type: "single",
    step: 3,
    title: "How severe have they been?",
    field: "reorder_side_effect_severity",
    options: ["Mild", "Moderate", "Severe"],
    auto: true,
    next: () => "s_weight",
  },
  {
    id: "s_weight",
    type: "weight",
    step: 4,
    title: "What is your current weight?",
    field: "current_weight_kg",
    next: () => "s_new_event",
  },
  {
    id: "s_new_event",
    type: "single",
    step: 5,
    title:
      "Since your last order, have you started any new medicine, been diagnosed with a new condition, or been admitted to hospital?",
    field: "reorder_new_clinical_event",
    options: ["Yes", "No"],
    next: (a) => (a.reorder_new_clinical_event === "Yes" ? "s_new_event_detail" : "s_pregnancy"),
  },
  {
    id: "s_new_event_detail",
    type: "textarea",
    step: 5,
    title: "Please tell us what changed",
    field: "reorder_new_clinical_event_details",
    placeholder: "New medicine, condition, or hospital admission…",
    next: () => "s_pregnancy",
  },
  {
    id: "s_pregnancy",
    type: "single",
    step: 6,
    title: "Are you pregnant, trying to conceive, or breastfeeding?",
    field: "reorder_pregnancy_flag",
    options: ["Yes", "No"],
    auto: true,
    next: () => "s_dose",
  },
  {
    id: "s_dose",
    type: "single",
    step: 6,
    title: "Which dose would you like next?",
    field: "reorder_dose_choice",
    options: ["Same", "Increase", "Decrease", "Stop"],
    next: () => "s_pharmacist_q",
  },
  {
    id: "s_pharmacist_q",
    type: "textarea",
    step: 6,
    title: "Anything you'd like to ask the pharmacist?",
    field: "reorder_pharmacist_question",
    placeholder: "Your question… (optional)",
    required: false,
    next: () => "s_success",
  },
  { id: "s_success", type: "success", step: REORDER_TOTAL_STEPS, title: "" },
];
