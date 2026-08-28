/**
 * Consultation flow — direct port of joodlife.com /pages/consultation.
 *
 * Each slide declares:
 *   - type:        which renderer to use
 *   - title/subtitle
 *   - field:       answers[] key the slide writes to
 *   - options:     for single/multi types
 *   - next:        either a static slide id, or a function that
 *                  inspects current answers and returns the next id
 *
 * The flow engine in ConsultationFlow.tsx walks slides by reading
 * the current id, calling next(answers) when the user clicks
 * Continue, and persisting after every transition.
 *
 * Block slides (s_block_*) are dead-end pages that explain why
 * treatment isn't suitable + give a link back to a relevant
 * earlier slide so the user can fix their answer.
 */

export type Answers = Record<string, unknown>;

export const TOTAL_STEPS = 20;

export const DOSES = {
  Mounjaro: ["2.5 mg", "5 mg", "7.5 mg", "10 mg", "12.5 mg", "15 mg", "Not sure"],
  Wegovy: ["0.25 mg", "0.5 mg", "1.0 mg", "1.7 mg", "2.4 mg", "7.2 mg", "Not sure"],
} as const;

export const ETHNICITY = [
  "Asian or Asian British",
  "Black, Black British, Caribbean or African",
  "Mixed or multiple ethnic groups",
  "Other ethnic group",
  "White",
];

export const WHY_JOODLIFE = [
  "Value having expert support",
  "Long term sustainable progress",
  "Option that fits my budget",
  "Fast access to start medication",
  "Other",
];

export const MOTIVATION = [
  "Help with or manage a specific medical condition",
  "Improve my overall health and longevity",
  "Improve my physical capabilities",
  "Help with self-confidence",
  "Other",
];

export const COMORBIDITIES = [
  "High blood pressure",
  "High cholesterol",
  "Sleep apnoea",
  "Prediabetes or type 2 diabetes",
  "Fatty liver",
  "Joint pain or arthritis made worse by weight",
  "Other weight related condition",
];

export const RECENT_INJECTIONS = [
  "Mounjaro",
  "Wegovy",
  "Ozempic",
  "Saxenda",
  "Another injection",
  "Not sure",
];

export const SAFETY_FLAGS = [
  "Pregnant, trying for a baby, or breastfeeding",
  "Pancreatitis before",
  "Gallbladder problems now or removed in the last 3 months",
  "Heart failure diagnosis",
  "Severe kidney problems",
  "Liver problems",
  "Taking insulin or diabetes tablets like gliclazide",
  "Told your diabetes is very poorly controlled",
  "Bowel disease or slow stomach emptying",
  "Allergic to Mounjaro or Wegovy",
  "Taking another weight loss medicine or injection",
];

const HARD_STOP_FLAGS = new Set([
  "Pregnant, trying for a baby, or breastfeeding",
  "Pancreatitis before",
  "Gallbladder problems now or removed in the last 3 months",
  "Severe kidney problems",
  "Allergic to Mounjaro or Wegovy",
  "Bowel disease or slow stomach emptying",
]);

// ────────────────────────────────────────────────────────────────
// Calculators
// ────────────────────────────────────────────────────────────────

export function calcAge(dob: string | undefined): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export function calcBmi(answers: Answers): number | null {
  const h = Number(answers.height_cm);
  const w = Number(answers.current_weight_kg);
  if (!h || !w) return null;
  const m = h / 100;
  return w / (m * m);
}

// ────────────────────────────────────────────────────────────────
// Slide definitions
// ────────────────────────────────────────────────────────────────

export type SlideType =
  | "consent"
  | "single"
  | "multi"
  | "email"
  | "phone"
  | "dob"
  | "height"
  | "weight"
  | "date"
  | "upload"
  | "gp"
  | "doseSelector" // dynamically built dose options based on selected medicine
  | "purchase"
  | "block"
  | "success"
  // ── added for the ED / PD / reorder flows ──
  | "text" // single-line free text
  | "textarea" // multi-line free text
  | "number" // numeric input with a unit label
  | "name" // full name in one field
  | "choiceCards" // rich single-select cards (title + subtitle + desc + image)
  | "acknowledge"; // tick-to-proceed safety screen (one or more required ticks)

export type SlideOption = string;

export type SlideDef = {
  id: string;
  type: SlideType;
  /** Step number for the progress bar (1..TOTAL_STEPS, or 0 for consent / non-progress slides). */
  step: number;
  title: string;
  subtitle?: string;
  /** answers[] key for single-value slides. */
  field?: string;
  options?: SlideOption[];
  /** Rich single-select cards (for type "choiceCards"). `value` is what's
   *  stored in answers; the rest is presentation. */
  cardOptions?: {
    value: string;
    title: string;
    subtitle?: string;
    desc?: string;
    image?: string;
  }[];
  /** When the user picks an option on a single-select with auto, advance immediately. */
  auto?: boolean;
  /** For multi-select, render a "None of these" toggle that's mutually exclusive. */
  noneOption?: string;
  /** Optional inline "other" text for comorbidities-type questions. */
  otherTrigger?: string;
  /** Block-screen meta (id of slide to bounce back to). */
  reviewSlideId?: string;
  /** Compute next slide based on answers. */
  next?: (answers: Answers) => string;
  // ── extras for text / textarea / number / acknowledge slides ──
  /** Placeholder for text/textarea/number inputs. */
  placeholder?: string;
  /** Unit label shown beside a number input (e.g. "kg"). */
  unit?: string;
  /** Min/max for number inputs. */
  min?: number;
  max?: number;
  /** When false, a text/textarea slide can be skipped (Continue always enabled). */
  required?: boolean;
  /** Acknowledge-screen lines — each renders as a required tick. */
  bullets?: string[];
  /** Body copy for block slides (overrides the generic copy). */
  body?: string;
};

const isWegovyContext = (a: Answers): boolean => {
  const intent = a.intended_medicine_v2;
  const recent = a.most_recent_injection_used_v2;
  const switching = a.switching_intention;
  if (switching === "Switch to the other one") {
    return recent === "Mounjaro";
  }
  if (recent === "Wegovy" || recent === "Ozempic") return true;
  return intent === "Wegovy";
};

export const SLIDES: SlideDef[] = [
  // ── Slide 0: Consent ─────────────────────────────────────────
  {
    id: "s0",
    type: "consent",
    step: 0,
    title: "Before you continue",
    subtitle:
      "This consultation helps our clinicians determine whether weight loss treatment is suitable for you. It should take around 3 to 5 minutes to complete.",
    field: "consultation_consent_confirmed",
    next: () => "s1",
  },
  // ── Slide 1: Is this for you? ────────────────────────────────
  {
    id: "s1",
    type: "single",
    step: 1,
    title: "Is this for you?",
    subtitle: "This service is only available for personal use.",
    field: "is_this_consultation_for_you_v2",
    options: ["Yes", "No"],
    auto: true,
    next: (a) => (a.is_this_consultation_for_you_v2 === "No" ? "s_block_third_party" : "s_name"),
  },
  // ── Slide 1b: Full name ──────────────────────────────────────
  {
    id: "s_name",
    type: "name",
    step: 2,
    title: "What is your full name?",
    subtitle:
      "Please double-check your name — we check it to confirm you're over 18, so even small spelling mistakes can delay your order.",
    next: () => "s3",
  },
  // ── Slide 3: Current GLP-1 use status ────────────────────────
  {
    id: "s3",
    type: "single",
    step: 3,
    title: "Are you using a weight loss injection right now?",
    field: "current_glp_1_use_status",
    options: [
      "Yes, I am currently using one",
      "No, but I have used one before",
      "No, I have never used one",
    ],
    auto: true,
    next: () => "s4",
  },
  // ── Slide 4: Email ───────────────────────────────────────────
  {
    id: "s4",
    type: "email",
    step: 4,
    title: "Where should we send your next steps?",
    subtitle: "We'll use this to follow up and book your video call.",
    field: "email",
    next: () => "s_dob",
  },
  // ── Slide DOB: Date of birth ─────────────────────────────────
  {
    id: "s_dob",
    type: "dob",
    step: 5,
    title: "What is your date of birth?",
    subtitle: "We use this to confirm you meet the age criteria for treatment.",
    field: "date_of_birth_consultation",
    next: (a) => {
      const age = a._age as number | undefined;
      if (typeof age !== "number" || age < 18 || age >= 75) return "s_block_age";
      return "s7";
    },
  },
  // ── Slide 7: Height ──────────────────────────────────────────
  {
    id: "s7",
    type: "height",
    step: 6,
    title: "What is your height?",
    field: "height_cm",
    next: () => "s8",
  },
  // ── Slide 8: Weight (computes BMI gate) ──────────────────────
  {
    id: "s8",
    type: "weight",
    step: 7,
    title: "What is your current weight?",
    field: "current_weight_kg",
    next: (a) => {
      const bmi = calcBmi(a);
      const usage = a.current_glp_1_use_status;
      if (usage === "No, I have never used one" && bmi !== null && bmi < 27) {
        return "s_block_bmi";
      }
      return "s9";
    },
  },
  // ── Slide 9: Ethnicity ───────────────────────────────────────
  {
    id: "s9",
    type: "single",
    step: 8,
    title: "Which ethnicity are you?",
    subtitle:
      "Healthy BMI ranges differ by ethnic background. Our clinicians will evaluate this and your full medical history before recommending treatment.",
    field: "which_ethnicity_are_you",
    options: ETHNICITY,
    auto: true,
    next: () => "s10",
  },
  // ── Slide 10: Why Joodlife ───────────────────────────────────
  {
    id: "s10",
    type: "single",
    step: 9,
    title: "Why did you decide to start with Jood?",
    field: "why_joodlife",
    options: WHY_JOODLIFE,
    auto: true,
    next: () => "s11",
  },
  // ── Slide 11: Motivation (branches) ──────────────────────────
  {
    id: "s11",
    type: "single",
    step: 10,
    title: "What motivates you to lose weight?",
    field: "motivation",
    options: MOTIVATION,
    auto: true,
    next: (a) => {
      const usage = a.current_glp_1_use_status;
      const bmi = calcBmi(a);
      if (usage === "No, I have never used one") {
        if (bmi === null) return "s_block_bmi";
        if (bmi >= 30) return "s13a";
        if (bmi >= 27) return "s12a";
        return "s_block_bmi";
      }
      return "s12b"; // currently using or used before
    },
  },
  // ── Slide 12a: Comorbidities (BMI 27–30 only) ────────────────
  {
    id: "s12a",
    type: "multi",
    step: 11,
    title: "Do you have any weight-related health conditions?",
    subtitle: "Your BMI is between 27 and 30 — please pick anything that applies.",
    field: "comorbidities",
    options: COMORBIDITIES,
    noneOption: "None of these",
    otherTrigger: "Other weight related condition",
    next: (a) => {
      const list = (a.comorbidities as string[]) ?? [];
      if (list.length === 0 || list.every((v) => v === "None of these")) {
        return "s_block_bmi";
      }
      return "s13a";
    },
  },
  // ── Slide 13a: Diet commitment ───────────────────────────────
  {
    id: "s13a",
    type: "single",
    step: 12,
    title:
      "Are you happy to follow a reduced-calorie diet and be more active alongside treatment?",
    field: "willing_to_follow_reduced_calorie_diet_and_increase_physical_activity",
    options: ["Yes", "No"],
    auto: true,
    next: (a) =>
      a.willing_to_follow_reduced_calorie_diet_and_increase_physical_activity === "No"
        ? "s_block_diet"
        : "s15",
  },
  // ── Slide 12b: Most recent injection ─────────────────────────
  {
    id: "s12b",
    type: "single",
    step: 11,
    title: "Which injection have you used most recently?",
    field: "most_recent_injection_used_v2",
    options: RECENT_INJECTIONS,
    auto: true,
    next: () => "s13b",
  },
  // ── Slide 13b: Switching intention ───────────────────────────
  {
    id: "s13b",
    type: "single",
    step: 12,
    title: "Are you planning to…",
    field: "switching_intention",
    options: ["Continue the same medicine", "Switch to the other one", "Not sure"],
    auto: true,
    next: () => "s14b",
  },
  // ── Slide 14b: Current/last dose ─────────────────────────────
  {
    id: "s14b",
    type: "doseSelector",
    step: 13,
    title: "What dose are you on now (or last used)?",
    field: "current_dose",
    next: () => "s15b",
  },
  // ── Slide 15b: Last injection date ───────────────────────────
  {
    id: "s15b",
    type: "date",
    step: 14,
    title: "When was your last injection?",
    field: "last_injection_date",
    next: () => "s16b",
  },
  // ── Slide 16b: Missed doses ──────────────────────────────────
  {
    id: "s16b",
    type: "single",
    step: 15,
    title: "Have you missed more than 2 weekly injections in a row?",
    field: "missed_more_than_2_doses",
    options: ["Yes", "No"],
    auto: true,
    next: () => "s17b",
  },
  // ── Slide 17b: Upload prescription ───────────────────────────
  {
    id: "s17b",
    type: "upload",
    step: 16,
    title: "Upload evidence of your prescription or supply",
    subtitle: "A photo or screenshot helps us approve your order faster.",
    field: "prescription_evidence_upload",
    next: () => "s15",
  },
  // ── Slide 15: Safety flags ───────────────────────────────────
  {
    id: "s15",
    type: "multi",
    step: 17,
    title: "Safety check: do any of these apply to you?",
    subtitle: "Pick everything that applies. This keeps you safe.",
    field: "safety_flags",
    options: SAFETY_FLAGS,
    noneOption: "None of these",
    next: (a) => {
      const flags = (a.safety_flags as string[]) ?? [];
      if (flags.some((f) => HARD_STOP_FLAGS.has(f))) return "s_block_safety";
      return "s20";
    },
  },
  // ── Slide 20: Mobile phone ───────────────────────────────────
  {
    id: "s20",
    type: "phone",
    step: 19,
    title: "What's the best mobile number for your video call?",
    subtitle: "A clinician will call you to complete your consultation.",
    field: "consultation_mobile_number_v2",
    next: () => "s_gp",
  },
  // ── Slide GP: GP practice details ────────────────────────────
  {
    id: "s_gp",
    type: "gp",
    step: 20,
    title: "Provide your GP details",
    subtitle:
      "If you share your GP details, we'll inform them about your treatment. This supports safe, coordinated care.",
    field: "gp_practice_name",
    // GP details are the last step. Submitting goes straight to the
    // success/"making a plan" screen — the medication-preference step was
    // removed (the medicine is chosen on the product page after), and buying
    // happens on the final product page the success screen redirects to.
    next: () => "s_success",
  },
  // ── Block screens ────────────────────────────────────────────
  {
    id: "s_block_third_party",
    type: "block",
    step: 0,
    title: "Not suitable for this service",
    body:
      "This weight loss service is only available for your own personal use, so we can’t continue with a consultation on someone else’s behalf. If the treatment is for you, change your answer below.",
    reviewSlideId: "s1",
  },
  {
    id: "s_block_age",
    type: "block",
    step: 0,
    title: "Not suitable at this time",
    body:
      "Weight loss treatment is only available to adults aged 18 or over through this service. Please speak to your GP for advice.",
    reviewSlideId: "s_dob",
  },
  {
    id: "s_block_bmi",
    type: "block",
    step: 0,
    title: "Not suitable at this time",
    body:
      "Based on the height and weight you gave us, your BMI is outside the range we can safely treat. Please speak to your GP, who can advise on the right options for you.",
    reviewSlideId: "s7",
  },
  {
    id: "s_block_diet",
    type: "block",
    step: 0,
    title: "Not suitable at this time",
    body:
      "Because of the eating pattern or eating disorder history you told us about, we can’t supply weight loss treatment online. Please speak to your GP so you get the right support.",
    reviewSlideId: "s13a",
  },
  {
    id: "s_block_safety",
    type: "block",
    step: 0,
    title: "Not suitable at this time",
    body:
      "One or more of the medical conditions or medicines you told us about means weight loss treatment isn’t safe to supply through this service. Please speak to your GP.",
    reviewSlideId: "s15",
  },
  // ── Success ──────────────────────────────────────────────────
  { id: "s_success", type: "success", step: TOTAL_STEPS, title: "" },
];

const SLIDE_INDEX: Record<string, SlideDef> = Object.fromEntries(
  SLIDES.map((s) => [s.id, s])
);

export function getSlide(id: string): SlideDef | undefined {
  return SLIDE_INDEX[id];
}

/**
 * Returns the medicine context for slide 14b / 16's dose options.
 * "Wegovy" if any prior answer points to Wegovy/Ozempic, else "Mounjaro".
 */
export function doseMedicine(a: Answers): "Wegovy" | "Mounjaro" {
  return isWegovyContext(a) ? "Wegovy" : "Mounjaro";
}
