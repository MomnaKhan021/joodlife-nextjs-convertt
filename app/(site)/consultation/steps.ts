/**
 * Consultation step config — full UK telehealth weight-loss
 * questionnaire, modeled after joodlife.com /pages/consultation.
 *
 * Each step declares a `type` that the renderer in ConsultationFlow.tsx
 * understands. Steps may declare a `showIf` predicate to make them
 * conditional on prior answers (e.g. pregnancy questions only for
 * customers who selected "Female").
 *
 * Answers are stored under the step's `id` in the answers object,
 * keeping the JSON shape predictable for downstream consumers.
 */
export type Answers = Record<string, unknown>;

export type Step =
  | {
      id: string;
      type: "intro";
      title: string;
      intro: string;
      bullets: string[];
      agreeLabel: string;
    }
  | {
      id: string;
      type: "single";
      title: string;
      intro?: string;
      options: string[];
      required?: boolean;
    }
  | {
      id: string;
      type: "multi";
      title: string;
      intro?: string;
      options: string[];
      required?: boolean;
      noneOption?: string;
    }
  | {
      id: string;
      type: "text";
      title: string;
      intro?: string;
      placeholder?: string;
      required?: boolean;
      autoComplete?: string;
    }
  | {
      id: string;
      type: "textarea";
      title: string;
      intro?: string;
      placeholder?: string;
      required?: boolean;
      maxLength?: number;
    }
  | {
      id: string;
      type: "number";
      title: string;
      intro?: string;
      unit: string;
      placeholder?: string;
      min?: number;
      max?: number;
      required?: boolean;
    }
  | {
      id: string;
      type: "date";
      title: string;
      intro?: string;
      required?: boolean;
    }
  | {
      id: string;
      type: "name";
      title: string;
      intro?: string;
    }
  | { id: string; type: "review"; title: string; intro?: string };

export type StepWithCondition = Step & {
  /**
   * Optional predicate. When provided and returning `false`, the step
   * is skipped in both directions (forward and back).
   */
  showIf?: (answers: Answers) => boolean;
};

const isFemale = (a: Answers) => a.sex === "Female";
const has = (a: Answers, key: string, value: string) => {
  const v = a[key];
  if (Array.isArray(v)) return v.includes(value);
  return v === value;
};

export const STEPS: StepWithCondition[] = [
  // ----------------------------------------------------------------
  // 1. Intro / agreement
  // ----------------------------------------------------------------
  {
    id: "intro",
    type: "intro",
    title: "Before you continue",
    intro:
      "This consultation helps our clinicians determine whether weight loss treatment is suitable for you. It should take around 3 to 5 minutes to complete.",
    bullets: [
      "You are completing this consultation for yourself",
      "The information you provide will be honest, accurate, and complete",
      "You will tell us about any medical conditions, serious illnesses, operations, and medicines you are taking",
      "You understand you should only use one weight loss treatment at a time",
      "You understand a short video consultation is required before treatment can be supplied",
      "You understand a clinician may need to review your answers before treatment is approved",
      "You agree to our Terms and Conditions and confirm you have read our Privacy Policy",
    ],
    agreeLabel: "I have read and agree to the above",
  },

  // ----------------------------------------------------------------
  // 2. Identity
  // ----------------------------------------------------------------
  { id: "name", type: "name", title: "What is your full name?" },

  {
    id: "dob",
    type: "date",
    title: "What is your date of birth?",
    intro: "We use this to confirm you meet the age criteria for treatment.",
    required: true,
  },

  {
    id: "sex",
    type: "single",
    title: "What is your sex assigned at birth?",
    intro:
      "Some treatments are not suitable during pregnancy or breastfeeding, so this affects which medications a clinician can prescribe.",
    options: ["Female", "Male", "Prefer not to say"],
    required: true,
  },

  // ----------------------------------------------------------------
  // 3. Body measurements
  // ----------------------------------------------------------------
  {
    id: "height",
    type: "number",
    title: "How tall are you?",
    intro: "We use your height and weight to calculate your BMI.",
    unit: "cm",
    placeholder: "170",
    min: 100,
    max: 230,
    required: true,
  },
  {
    id: "weight",
    type: "number",
    title: "What is your current weight?",
    unit: "kg",
    placeholder: "85",
    min: 35,
    max: 300,
    required: true,
  },
  {
    id: "targetWeight",
    type: "number",
    title: "What is your target weight?",
    intro: "It's fine if this is approximate — the clinician will discuss realistic goals with you.",
    unit: "kg",
    placeholder: "70",
    min: 35,
    max: 300,
    required: true,
  },

  // ----------------------------------------------------------------
  // 4. Pregnancy (female only)
  // ----------------------------------------------------------------
  {
    id: "pregnancy",
    type: "single",
    title: "Are you currently pregnant or trying to become pregnant?",
    options: ["No", "Yes — currently pregnant", "Yes — actively trying"],
    required: true,
    showIf: isFemale,
  },
  {
    id: "breastfeeding",
    type: "single",
    title: "Are you currently breastfeeding?",
    options: ["No", "Yes"],
    required: true,
    showIf: isFemale,
  },

  // ----------------------------------------------------------------
  // 5. Medical history
  // ----------------------------------------------------------------
  {
    id: "conditions",
    type: "multi",
    title: "Have you ever been diagnosed with any of the following?",
    intro: "Tick everything that applies. Pick None if none of these apply.",
    options: [
      "Type 1 diabetes",
      "Type 2 diabetes",
      "Heart disease or recent heart attack",
      "Kidney disease",
      "Liver disease",
      "Pancreatitis or gallbladder disease",
      "Thyroid problems (including thyroid cancer)",
      "High blood pressure",
      "Stroke",
      "Severe gastrointestinal disease",
    ],
    required: true,
    noneOption: "None of the above",
  },
  {
    id: "diabetesType",
    type: "single",
    title: "How is your diabetes currently managed?",
    options: [
      "Diet and lifestyle only",
      "Oral medication (e.g. metformin)",
      "Insulin",
      "Other GLP-1 medication",
    ],
    required: true,
    showIf: (a) => has(a, "conditions", "Type 1 diabetes") || has(a, "conditions", "Type 2 diabetes"),
  },
  {
    id: "eatingDisorder",
    type: "single",
    title: "Do you have or have you ever had an eating disorder?",
    intro:
      "Including bulimia, anorexia, binge eating disorder, or any other diagnosed eating disorder.",
    options: ["No", "Yes — in the past", "Yes — currently"],
    required: true,
  },
  {
    id: "mentalHealth",
    type: "multi",
    title: "Have you ever been diagnosed with any of these mental health conditions?",
    options: [
      "Depression",
      "Anxiety",
      "Bipolar disorder",
      "Suicidal thoughts (current or recent)",
      "Other (will discuss with clinician)",
    ],
    required: true,
    noneOption: "None of the above",
  },
  {
    id: "allergies",
    type: "textarea",
    title: "Do you have any drug allergies?",
    intro:
      "Tell us about any medications you've reacted to. Type 'None' if you don't have any.",
    placeholder: "e.g. Penicillin, codeine — or None",
    required: true,
    maxLength: 500,
  },
  {
    id: "medications",
    type: "textarea",
    title: "What medications are you currently taking?",
    intro:
      "Include prescription, over-the-counter, supplements, and recreational drugs. Type 'None' if you take nothing.",
    placeholder: "e.g. Sertraline 50mg daily, vitamin D",
    required: true,
    maxLength: 1000,
  },
  {
    id: "previousTreatments",
    type: "single",
    title: "Have you taken weight loss medication in the past 12 months?",
    options: [
      "No",
      "Yes — Mounjaro / Tirzepatide",
      "Yes — Wegovy / Semaglutide / Ozempic",
      "Yes — Saxenda / Liraglutide",
      "Yes — other",
    ],
    required: true,
  },

  // ----------------------------------------------------------------
  // 6. Lifestyle
  // ----------------------------------------------------------------
  {
    id: "smoking",
    type: "single",
    title: "Do you smoke?",
    options: ["No, I've never smoked", "Used to but quit", "Yes, occasionally", "Yes, daily"],
    required: true,
  },
  {
    id: "alcohol",
    type: "single",
    title: "How often do you drink alcohol?",
    options: [
      "Never",
      "Occasionally (a few times a year)",
      "Monthly",
      "Weekly",
      "Several times a week",
      "Daily",
    ],
    required: true,
  },
  {
    id: "activity",
    type: "single",
    title: "How active are you in a typical week?",
    options: [
      "Mostly sedentary",
      "Light activity (1–2 times a week)",
      "Moderate (3–4 times a week)",
      "Very active (5+ times a week)",
    ],
    required: true,
  },
  {
    id: "goal",
    type: "multi",
    title: "What are your main goals with weight loss?",
    intro: "Pick everything that applies — the clinician uses this to tailor advice.",
    options: [
      "Lose weight for my general health",
      "Manage a diagnosed medical condition",
      "Feel more confident",
      "Improve my fitness or mobility",
      "Reduce risk of future health issues",
      "Look better in clothes / for an event",
    ],
    required: true,
  },

  // ----------------------------------------------------------------
  // 7. Contact
  // ----------------------------------------------------------------
  {
    id: "email",
    type: "text",
    title: "What's the best email to reach you on?",
    intro:
      "We'll send your consultation outcome and treatment updates here.",
    placeholder: "mail@abc.com",
    required: true,
    autoComplete: "email",
  },
  {
    id: "phone",
    type: "text",
    title: "What's your mobile number?",
    intro: "Used for delivery updates and the clinician's video consultation.",
    placeholder: "07700 900 000",
    required: true,
    autoComplete: "tel",
  },
  {
    id: "address",
    type: "textarea",
    title: "What's your delivery address?",
    intro: "Include house/flat number, street, town/city and postcode.",
    placeholder: "12 Example Road\nLondon\nSW1A 1AA",
    required: true,
    maxLength: 500,
  },
  {
    id: "gpDetails",
    type: "textarea",
    title: "Your GP details (optional)",
    intro:
      "If treatment is approved, we may share an outcome letter with your GP. Leave blank if you'd rather we didn't.",
    placeholder: "Practice name and town, e.g. The Mill Practice, Brighton",
    maxLength: 300,
  },

  // ----------------------------------------------------------------
  // 8. Review + submit
  // ----------------------------------------------------------------
  {
    id: "review",
    type: "review",
    title: "Review and submit",
    intro:
      "Take a quick look at what you entered. Use Back to fix anything before submitting.",
  },
];

/**
 * Returns the next visible index (skipping `showIf=false` steps).
 * Returns -1 if there is no next visible step.
 */
export function nextVisibleIndex(
  steps: StepWithCondition[],
  currentIndex: number,
  answers: Answers
): number {
  for (let i = currentIndex + 1; i < steps.length; i++) {
    const step = steps[i];
    if (!step.showIf || step.showIf(answers)) return i;
  }
  return -1;
}

export function prevVisibleIndex(
  steps: StepWithCondition[],
  currentIndex: number,
  answers: Answers
): number {
  for (let i = currentIndex - 1; i >= 0; i--) {
    const step = steps[i];
    if (!step.showIf || step.showIf(answers)) return i;
  }
  return -1;
}

/**
 * Total number of steps that will be shown given the current answers.
 * Used for progress %, which only counts visible steps so the bar
 * doesn't jump backwards when conditional questions appear.
 */
export function visibleStepCount(
  steps: StepWithCondition[],
  answers: Answers
): number {
  return steps.filter((s) => !s.showIf || s.showIf(answers)).length;
}
