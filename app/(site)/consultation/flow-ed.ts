/**
 * Erectile Dysfunction consultation flow — Jood Pharmacy.
 * Source: "Jood Pharmacy - Erectile Dysfunction Questionnaire" (Sildenafil /
 * Tadalafil under PGD). Encodes the doc's "do not supply / refer" decision
 * key as `block` screens; every other answer is recorded for the prescriber.
 *
 * Same slide schema + engine as the weight-loss flow (flow.ts). Answers are
 * stored under each slide's `field` and saved to the Consultations row with
 * productSlug = "erectile-dysfunction".
 */
import { type Answers, type SlideDef, calcAge } from "./flow";

export const ED_TOTAL_STEPS = 24;

const hasAnyExceptNone = (a: Answers, key: string, none: string): boolean => {
  const v = a[key];
  return Array.isArray(v) && v.some((x) => x !== none);
};

export const ED_SLIDES: SlideDef[] = [
  // ── Consent ──────────────────────────────────────────────────
  {
    id: "s0",
    type: "consent",
    step: 0,
    title: "Before you continue",
    subtitle:
      "This short, confidential questionnaire helps our prescriber check that erectile dysfunction treatment is safe and right for you. A Jood Pharmacy prescriber reviews every answer before any medicine is supplied.",
    bullets: [],
    field: "ed_consent_confirmed",
    next: () => "s_name",
  },

  // ── About you ────────────────────────────────────────────────
  { id: "s_name", type: "name", step: 1, title: "What is your full name?", next: () => "s_dob" },
  {
    id: "s_dob",
    type: "dob",
    step: 2,
    title: "What is your date of birth?",
    subtitle: "We need this to confirm you are 18 or over.",
    field: "date_of_birth_consultation",
    next: (a) => {
      const age = calcAge(a.date_of_birth_consultation as string | undefined);
      return age != null && age >= 18 ? "s_sex" : "s_block_age";
    },
  },
  {
    id: "s_sex",
    type: "single",
    step: 3,
    title: "What is your sex registered at birth?",
    field: "ed_sex_at_birth",
    options: ["Male", "Female"],
    auto: true,
    next: (a) => (a.ed_sex_at_birth === "Female" ? "s_block_sex" : "s_for_self"),
  },
  {
    id: "s_for_self",
    type: "single",
    step: 4,
    title: "Are you ordering this treatment for yourself (not for anyone else)?",
    field: "ed_for_self",
    options: ["Yes", "No"],
    auto: true,
    next: (a) => (a.ed_for_self === "No" ? "s_block_third_party" : "s_symptom"),
  },
  {
    id: "s_symptom",
    type: "single",
    step: 5,
    title: "Are you having trouble getting or keeping an erection firm enough for sex?",
    field: "ed_has_symptom",
    options: ["Yes", "No"],
    auto: true,
    next: () => "s_used_before",
  },
  {
    id: "s_used_before",
    type: "single",
    step: 6,
    title: "Have you used ED treatment before (e.g. sildenafil/Viagra or tadalafil/Cialis)?",
    field: "ed_used_before",
    options: ["Yes", "No"],
    next: (a) => (a.ed_used_before === "Yes" ? "s_used_before_detail" : "s_consent_pom"),
  },
  {
    id: "s_used_before_detail",
    type: "textarea",
    step: 6,
    title: "Which medicine, what dose, did it work, and any side effects?",
    field: "ed_used_before_detail",
    placeholder: "e.g. Sildenafil 50mg, worked well, mild headache…",
    required: false,
    next: () => "s_consent_pom",
  },
  {
    id: "s_consent_pom",
    type: "acknowledge",
    step: 7,
    title: "Your consent",
    field: "ed_consent_pom",
    bullets: [
      "I understand sildenafil and tadalafil are prescription-only medicines supplied after this online assessment, and I consent to being assessed for treatment.",
    ],
    next: () => "s_heart_advised",
  },

  // ── Heart & circulation (any Yes / condition = hard stop) ────
  {
    id: "s_heart_advised",
    type: "single",
    step: 8,
    title:
      "Has a doctor ever told you that sex or strenuous activity is not advised for you (for example because of a heart condition or severe breathlessness)?",
    field: "ed_sex_not_advised",
    options: ["Yes", "No"],
    auto: true,
    next: (a) => (a.ed_sex_not_advised === "Yes" ? "s_block_heart" : "s_heart_conditions"),
  },
  {
    id: "s_heart_conditions",
    type: "multi",
    step: 9,
    title: "Have you ever been diagnosed with any of these heart or circulation conditions?",
    subtitle: "Tick any that apply.",
    field: "ed_heart_conditions",
    noneOption: "None of the above",
    options: [
      "Angina or unstable angina (chest pain)",
      "Heart failure",
      "An irregular heartbeat (arrhythmia)",
      "Heart valve disease",
      "Cardiomyopathy (a disease of the heart muscle)",
      "Narrowing of the aorta or another obstruction to blood flow from the heart",
      "Low blood pressure (hypotension)",
      "None of the above",
    ],
    next: (a) =>
      hasAnyExceptNone(a, "ed_heart_conditions", "None of the above")
        ? "s_block_heart"
        : "s_heart_recent",
  },
  {
    id: "s_heart_recent",
    type: "multi",
    step: 10,
    title: "In the last 6 months, have you had any of the following?",
    subtitle: "Tick any that apply.",
    field: "ed_heart_recent",
    noneOption: "None of these",
    options: [
      "A heart attack",
      "A stroke",
      "Heart failure, or been in hospital for your heart",
      "None of these",
    ],
    next: (a) =>
      hasAnyExceptNone(a, "ed_heart_recent", "None of these")
        ? "s_block_heart"
        : "s_other_conditions",
  },

  // ── Other health conditions (first 6 = stop; Peyronie's = review) ─
  {
    id: "s_other_conditions",
    type: "multi",
    step: 11,
    title: "Do you have, or have you ever had, any of the following?",
    subtitle: "Tick any that apply.",
    field: "ed_other_conditions",
    noneOption: "None of the above",
    options: [
      "Severe kidney problems",
      "Liver problems",
      "A bleeding disorder",
      "Sickle cell anaemia, multiple myeloma or leukaemia",
      "Loss of vision in one eye caused by poor blood flow to the eye nerve (NAION)",
      "An inherited eye condition affecting the retina (e.g. retinitis pigmentosa)",
      "A curved or deformed penis, or Peyronie's disease (prescriber will review)",
      "None of the above",
    ],
    next: (a) => {
      const v = (a.ed_other_conditions as string[]) ?? [];
      const hardStop = v.some(
        (x) =>
          x !== "None of the above" &&
          x !== "A curved or deformed penis, or Peyronie's disease (prescriber will review)"
      );
      return hardStop ? "s_block_conditions" : "s_allergy";
    },
  },

  // ── Allergies ────────────────────────────────────────────────
  {
    id: "s_allergy",
    type: "single",
    step: 12,
    title: "Are you allergic to sildenafil, tadalafil, any other ED medicine, or any of their ingredients?",
    field: "ed_allergy",
    options: ["Yes", "No", "Not sure"],
    next: (a) => (a.ed_allergy === "Yes" ? "s_block_allergy" : "s_meds_a"),
  },

  // ── Medicines: List A (stop) / List B (review) ───────────────
  {
    id: "s_meds_a",
    type: "multi",
    step: 13,
    title: "List A — do you take any of these?",
    subtitle: "Tick any that apply. These cannot be mixed with ED treatment.",
    field: "ed_meds_list_a",
    noneOption: "None of List A",
    options: [
      "Nitrates for chest pain or angina (e.g. GTN spray, isosorbide mononitrate/dinitrate)",
      "“Poppers” or other recreational nitrates (e.g. amyl nitrite), or cannabis",
      "Riociguat or another medicine for pulmonary hypertension",
      "Alpha-blockers (e.g. doxazosin, tamsulosin, alfuzosin)",
      "Another ED medicine / PDE5 inhibitor (sildenafil, tadalafil, vardenafil, avanafil)",
      "Ritonavir (an HIV medicine)",
      "None of List A",
    ],
    next: (a) =>
      hasAnyExceptNone(a, "ed_meds_list_a", "None of List A")
        ? "s_block_meds"
        : "s_meds_b",
  },
  {
    id: "s_meds_b",
    type: "multi",
    step: 14,
    title: "List B — do you take any of these?",
    subtitle: "Tick any that apply. Our prescriber will review these against your chosen treatment.",
    field: "ed_meds_list_b",
    noneOption: "None of List B",
    options: [
      "Antifungals such as ketoconazole or itraconazole",
      "Antibiotics such as erythromycin, clarithromycin or rifampicin",
      "HIV protease inhibitors (e.g. saquinavir), cimetidine, or diltiazem",
      "Finasteride or dutasteride (for prostate or hair loss)",
      "Theophylline (for asthma or COPD)",
      "None of List B",
    ],
    next: () => "s_meds_other",
  },
  {
    id: "s_meds_other",
    type: "textarea",
    step: 15,
    title: "Please list ALL other medicines you take",
    subtitle: "Include anything from a pharmacy, supermarket or online, plus herbal or recreational substances.",
    field: "ed_meds_other",
    placeholder: "List your medicines, or type 'None'…",
    required: false,
    next: () => "s_diabetes",
  },

  // ── General health ───────────────────────────────────────────
  {
    id: "s_diabetes",
    type: "single",
    step: 16,
    title: "Have you ever been diagnosed with diabetes?",
    field: "ed_diabetes",
    options: ["Yes", "No"],
    auto: true,
    next: () => "s_bp",
  },
  {
    id: "s_bp",
    type: "single",
    step: 17,
    title: "Have you ever been diagnosed with high blood pressure?",
    field: "ed_high_bp",
    options: ["Yes", "No"],
    auto: true,
    next: () => "s_cholesterol",
  },
  {
    id: "s_cholesterol",
    type: "single",
    step: 18,
    title: "Have you ever been diagnosed with high cholesterol or heart/circulation disease?",
    field: "ed_cholesterol",
    options: ["Yes", "No"],
    auto: true,
    next: () => "s_factors",
  },
  {
    id: "s_factors",
    type: "multi",
    step: 19,
    title: "Could any of these be affecting you?",
    subtitle: "Tick any that apply — this helps us tailor your advice.",
    field: "ed_contributing_factors",
    noneOption: "None of these",
    options: [
      "Stress or anxiety",
      "Low mood or depression",
      "Relationship difficulties",
      "Alcohol or recreational drug use",
      "Prostate problems or recent pelvic/prostate surgery",
      "A possible side effect of another medicine",
      "None of these",
    ],
    next: () => "s_smoke",
  },
  {
    id: "s_smoke",
    type: "single",
    step: 20,
    title: "Do you smoke?",
    field: "ed_smoke",
    options: ["Yes", "No"],
    auto: true,
    next: () => "s_hw",
  },
  {
    id: "s_hw",
    type: "text",
    step: 20,
    title: "Your height and weight",
    subtitle: "For general health advice (e.g. 5ft 10in, 85kg).",
    field: "ed_height_weight",
    placeholder: "Height and weight…",
    required: false,
    next: () => "s_redflags",
  },
  {
    id: "s_redflags",
    type: "multi",
    step: 21,
    title: "Have you noticed any of these recently?",
    subtitle: "Tick any that apply.",
    field: "ed_red_flags",
    noneOption: "None of these",
    options: [
      "Blood in your urine or semen",
      "Unexplained weight loss",
      "Severe or ongoing pain",
      "Feeling generally unwell",
      "A new lump or swelling",
      "None of these",
    ],
    next: () => "s_treatment",
  },

  // ── Choosing treatment ───────────────────────────────────────
  {
    id: "s_treatment",
    type: "single",
    step: 22,
    title: "Which treatment would you prefer?",
    subtitle: "Your prescriber will confirm what's suitable.",
    field: "ed_treatment_choice",
    options: [
      "Sildenafil — works in about 1 hour, lasts around 4–6 hours",
      "Tadalafil — works in about 30 minutes, can last up to 36 hours",
      "Not sure — please recommend",
    ],
    next: () => "s_strength",
  },
  {
    id: "s_strength",
    type: "single",
    step: 22,
    title: "Preferred strength, if you know it",
    field: "ed_strength",
    options: [
      "Sildenafil 25mg",
      "Sildenafil 50mg (usual starting dose)",
      "Sildenafil 100mg",
      "Tadalafil 10mg (usual starting dose)",
      "Tadalafil 20mg",
      "Not sure",
    ],
    next: () => "s_safety",
  },

  // ── Safety acknowledgements ──────────────────────────────────
  {
    id: "s_safety",
    type: "acknowledge",
    step: 23,
    title: "Important safety information",
    subtitle: "Please confirm you have read and understood each point.",
    field: "ed_safety_ack",
    bullets: [
      "I will take the medicine exactly as directed, and never more than once in any 24 hours.",
      "Sexual stimulation is needed for the medicine to work.",
      "I will not drink grapefruit juice while taking this medicine.",
      "If I get an erection lasting more than 4 hours, I will seek emergency medical help straight away.",
      "If I get sudden vision loss or sudden hearing loss, I will stop the medicine and get urgent medical advice.",
      "If I get chest pain, dizziness or nausea during or after sex, I will seek medical help.",
      "I will read the patient information leaflet, and will not share this medicine with anyone else.",
    ],
    next: () => "s_email",
  },

  // ── Contact + delivery ───────────────────────────────────────
  {
    id: "s_email",
    type: "email",
    step: 23,
    title: "What's the best email for your assessment?",
    subtitle: "We'll use this to follow up about your treatment.",
    field: "email",
    next: () => "s_phone",
  },
  {
    id: "s_phone",
    type: "phone",
    step: 23,
    title: "And your mobile number?",
    field: "consultation_mobile_number_v2",
    next: () => "s_address",
  },
  {
    id: "s_address",
    type: "textarea",
    step: 23,
    title: "Your home / delivery address",
    subtitle: "Including postcode. We need this to supply your medicine and keep a safe record.",
    field: "ed_delivery_address",
    placeholder: "Address and postcode…",
    next: () => "s_gp",
  },
  {
    id: "s_gp",
    type: "gp",
    step: 23,
    title: "Your GP details",
    subtitle: "If you share your GP details, we can inform them about your treatment where clinically appropriate.",
    field: "gp_practice_name",
    next: () => "s_declaration",
  },

  // ── Declaration ──────────────────────────────────────────────
  {
    id: "s_declaration",
    type: "acknowledge",
    step: 24,
    title: "Your declaration",
    field: "ed_declaration",
    bullets: [
      "The information I have given is true, accurate and complete to the best of my knowledge.",
      "I understand that giving incorrect information could put my health at risk.",
      "I consent to a Jood Pharmacy prescriber reviewing my answers and supplying treatment under a Patient Group Direction (PGD) if it is suitable for me.",
    ],
    next: () => "s_success",
  },

  // ── Terminals ────────────────────────────────────────────────
  { id: "s_block_age", type: "block", step: 0, title: "Not suitable at this time", reviewSlideId: "s_dob", body: "This treatment is only available to adults aged 18 or over." },
  { id: "s_block_sex", type: "block", step: 0, title: "Not suitable at this time", reviewSlideId: "s_sex", body: "This ED treatment is licensed for people registered male at birth. Please speak to your GP for advice." },
  { id: "s_block_third_party", type: "block", step: 0, title: "Not suitable at this time", reviewSlideId: "s_for_self", body: "This service is only available for your own personal use." },
  { id: "s_block_heart", type: "block", step: 0, title: "Not suitable today", reviewSlideId: "s_heart_advised", body: "Because sex is a form of exercise, we can't supply ED treatment with your heart or circulation history. Please speak to your GP first." },
  { id: "s_block_conditions", type: "block", step: 0, title: "Not suitable today", reviewSlideId: "s_other_conditions", body: "Based on your medical history, we can't supply this treatment online. Please speak to your GP." },
  { id: "s_block_allergy", type: "block", step: 0, title: "Not suitable today", reviewSlideId: "s_allergy", body: "As you may be allergic to ED medicines, we can't supply this treatment. Please speak to your GP or pharmacist." },
  { id: "s_block_meds", type: "block", step: 0, title: "Not suitable today", reviewSlideId: "s_meds_a", body: "One of the medicines you take is dangerous to combine with ED treatment, so we can't supply today. Please speak to your GP." },

  { id: "s_success", type: "success", step: ED_TOTAL_STEPS, title: "" },
];
