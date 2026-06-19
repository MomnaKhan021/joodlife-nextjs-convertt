/**
 * Period Delay consultation flow — Jood Pharmacy.
 * Source: "Jood Period Delay Questionnaire Workflow" (Norethisterone 5mg under
 * the ECG PGD v004). Hard exclusions become `block` screens (recorded as a
 * draft so the exclusion + advice is logged, per the PGD). "Prescriber review"
 * items continue through and are evaluated server-side from the saved answers.
 *
 * Reuses the weight-loss flow's height/weight + calcBmi for the BMI gate, and
 * the same slide engine. Saved with productSlug = "period-delay".
 */
import { type Answers, type SlideDef } from "./flow";

export const PD_TOTAL_STEPS = 25;

const anyExceptNone = (a: Answers, key: string, none: string): boolean => {
  const v = a[key];
  return Array.isArray(v) && v.some((x) => x !== none);
};

export const PD_SLIDES: SlideDef[] = [
  // Section A — Getting started
  {
    id: "s0",
    type: "consent",
    step: 0,
    title: "Let's see if period delay treatment is right for you",
    subtitle:
      "Answer a few short questions so our prescribers can check this treatment is safe and suitable for you. It takes about 3 minutes, and everything you tell us is confidential.",
    bullets: [],
    field: "pd_consent_confirmed",
    next: () => "s_sex",
  },
  {
    id: "s_sex",
    type: "single",
    step: 1,
    title: "What was your sex assigned at birth?",
    field: "pd_sex_at_birth",
    options: ["Female", "Male"],
    auto: true,
    next: (a) => (a.pd_sex_at_birth === "Male" ? "s_block_sex" : "s_age"),
  },
  {
    id: "s_age",
    type: "single",
    step: 2,
    title: "How old are you?",
    field: "pd_age_band",
    options: ["Under 18", "18–55", "Over 55"],
    auto: true,
    next: (a) => (a.pd_age_band === "Under 18" ? "s_block_age" : "s_pregnancy"),
  },
  {
    id: "s_pregnancy",
    type: "single",
    step: 3,
    title: "Are you pregnant, breastfeeding, or trying to conceive?",
    field: "pd_pregnancy",
    options: ["Yes", "No"],
    auto: true,
    next: (a) => (a.pd_pregnancy === "Yes" ? "s_block_pregnancy" : "s_recent_use"),
  },
  {
    id: "s_recent_use",
    type: "single",
    step: 4,
    title: "Have you used period delay medication in the last 6 months?",
    field: "pd_recent_use",
    options: ["Yes", "No"],
    auto: true,
    next: (a) => (a.pd_recent_use === "Yes" ? "s_block_recent" : "s_cycle"),
  },

  // Section B — About your period
  {
    id: "s_cycle",
    type: "single",
    step: 5,
    title: "Is your menstrual cycle regular — can you usually predict when your period is due?",
    field: "pd_cycle_regular",
    options: ["Yes", "No"],
    auto: true,
    next: () => "s_last_period",
  },
  {
    id: "s_last_period",
    type: "single",
    step: 6,
    title: "When did your last period start?",
    field: "pd_last_period",
    options: ["Within the last 28 days", "More than 28 days ago"],
    auto: true,
    next: (a) =>
      a.pd_last_period === "More than 28 days ago" ? "s_last_period_normal" : "s_delay_length",
  },
  {
    id: "s_last_period_normal",
    type: "single",
    step: 6,
    title: "Is that normal for you?",
    field: "pd_last_period_normal",
    options: ["Yes", "No"],
    auto: true,
    next: (a) => (a.pd_last_period_normal === "No" ? "s_block_pregnancy_test" : "s_delay_length"),
  },
  {
    id: "s_delay_length",
    type: "single",
    step: 7,
    title: "How long do you need to delay your period for?",
    field: "pd_delay_length",
    options: ["Up to 1 week", "1–2 weeks", "2–4 weeks", "More than 4 weeks"],
    auto: true,
    next: (a) => (a.pd_delay_length === "More than 4 weeks" ? "s_block_duration" : "s_ack_timing"),
  },
  {
    id: "s_ack_timing",
    type: "acknowledge",
    step: 8,
    title: "Just so you know…",
    field: "pd_ack_timing",
    bullets: [
      "You need to start this medication about 3 days before your period is due. If you start it later it may not work. Your period usually returns 2–3 days after you finish the course.",
    ],
    next: () => "s_exclusions",
  },

  // Section C — Your health
  {
    id: "s_exclusions",
    type: "multi",
    step: 9,
    title: "Have you ever had any of the following?",
    subtitle: "Tick all that apply.",
    field: "pd_exclusion_conditions",
    noneOption: "None of the above",
    options: [
      "Unexplained or irregular vaginal bleeding",
      "Breast cancer (current or past), or cancer of the genital tract",
      "A blood clot — DVT or pulmonary embolism (PE), now or in the past",
      "Heart attack, angina, stroke or other arterial blood-clot disease",
      "Liver disease or reduced liver function",
      "Jaundice, severe itching, or a pregnancy skin rash during a previous pregnancy",
      "Porphyria (a rare metabolic disorder)",
      "Thickening of the womb lining (endometrial hyperplasia)",
      "Dubin–Johnson or Rotor syndrome",
      "None of the above",
    ],
    next: (a) =>
      anyExceptNone(a, "pd_exclusion_conditions", "None of the above")
        ? "s_block_conditions"
        : "s_family_clot",
  },
  {
    id: "s_family_clot",
    type: "single",
    step: 10,
    title: "Do you, or a close family member, have a history of blood clots or a clotting disorder?",
    field: "pd_family_clot",
    options: ["Yes — me", "Yes — a close family member", "No"],
    auto: true,
    // "Me" maps to the Screen 10 exclusion; family history → prescriber review (continue)
    next: (a) => (a.pd_family_clot === "Yes — me" ? "s_block_conditions" : "s_conditions"),
  },
  {
    id: "s_conditions",
    type: "multi",
    step: 11,
    title: "Have you ever been diagnosed with any of the following?",
    subtitle: "Tick all that apply. These don't automatically rule you out — a prescriber will review.",
    field: "pd_conditions",
    noneOption: "None of the above",
    options: [
      "Diabetes",
      "High blood pressure (hypertension)",
      "Migraines or severe headaches",
      "Kidney problems",
      "Liver problems",
      "Heart problems (other than those listed earlier)",
      "Systemic lupus erythematosus (SLE / lupus)",
      "Depression or another mental health condition",
      "Eye / vision problems",
      "Epilepsy or asthma",
      "None of the above",
    ],
    next: (a) =>
      anyExceptNone(a, "pd_conditions", "None of the above")
        ? "s_conditions_detail"
        : "s_bp",
  },
  {
    id: "s_conditions_detail",
    type: "textarea",
    step: 11,
    title: "Please tell us a little more",
    subtitle: "Include anything still being investigated.",
    field: "pd_conditions_detail",
    placeholder: "Tell us more…",
    required: false,
    next: () => "s_bp",
  },
  {
    id: "s_bp",
    type: "single",
    step: 12,
    title: "Has your blood pressure been measured in the last 12 months?",
    field: "pd_bp",
    options: ["Yes — it was below 140/90", "Yes — it was 140/90 or above", "No / not sure"],
    auto: true,
    next: () => "s_height",
  },
  {
    id: "s_height",
    type: "height",
    step: 13,
    title: "What is your height?",
    field: "height_cm",
    next: () => "s_weight",
  },
  {
    id: "s_weight",
    type: "weight",
    step: 13,
    title: "What is your weight?",
    subtitle: "A higher BMI can increase the risk of blood clots, so a prescriber may take a closer look.",
    field: "current_weight_kg",
    next: () => "s_smoke", // BMI≥30 → prescriber review (continues; flagged server-side)
  },
  {
    id: "s_smoke",
    type: "single",
    step: 14,
    title: "Do you smoke?",
    field: "pd_smoke",
    options: ["No", "Yes — occasionally", "Yes — daily"],
    auto: true,
    next: () => "s_allergy",
  },
  {
    id: "s_allergy",
    type: "multi",
    step: 15,
    title: "Are you allergic to, or have you ever reacted badly to, any of the following?",
    field: "pd_allergy",
    noneOption: "No known allergies",
    options: [
      "Norethisterone",
      "Other progesterone medicines",
      "Lactose",
      "Any other medicine or substance",
      "No known allergies",
    ],
    next: (a) => {
      const v = (a.pd_allergy as string[]) ?? [];
      const stop = v.some((x) =>
        ["Norethisterone", "Other progesterone medicines", "Lactose"].includes(x)
      );
      if (stop) return "s_block_allergy";
      if (v.includes("Any other medicine or substance")) return "s_allergy_detail";
      return "s_contraception";
    },
  },
  {
    id: "s_allergy_detail",
    type: "textarea",
    step: 15,
    title: "What are you allergic to, and what happens?",
    field: "pd_allergy_detail",
    placeholder: "Describe the allergy/reaction…",
    next: () => "s_contraception",
  },

  // Section D — Your medication
  {
    id: "s_contraception",
    type: "single",
    step: 16,
    title: "Are you currently using any hormonal contraception?",
    field: "pd_contraception",
    options: [
      "Combined pill",
      "Progesterone-only pill",
      "Patch",
      "Implant",
      "Injection (depot)",
      "Hormonal coil (IUS)",
      "No",
    ],
    next: (a) => (a.pd_contraception && a.pd_contraception !== "No" ? "s_block_contraception" : "s_hrt"),
  },
  {
    id: "s_hrt",
    type: "single",
    step: 17,
    title: "Are you using HRT (hormone replacement therapy) for menopause symptoms?",
    field: "pd_hrt",
    options: ["Yes", "No"],
    auto: true,
    next: (a) => (a.pd_hrt === "Yes" ? "s_block_hrt" : "s_other_meds"),
  },
  {
    id: "s_other_meds",
    type: "single",
    step: 18,
    title: "Are you taking any other medication — prescription, over-the-counter, herbal or recreational?",
    field: "pd_other_meds",
    options: ["Yes", "No"],
    next: (a) => (a.pd_other_meds === "Yes" ? "s_other_meds_detail" : "s_gp_registered"),
  },
  {
    id: "s_other_meds_detail",
    type: "textarea",
    step: 18,
    title: "Please list the name, strength and how often you take it",
    field: "pd_other_meds_detail",
    placeholder: "e.g. Ibuprofen 400mg as needed…",
    next: () => "s_interactions",
  },
  {
    id: "s_interactions",
    type: "multi",
    step: 18,
    title: "Do you take any of these?",
    subtitle: "Tick all that apply — our prescriber will review these.",
    field: "pd_interactions",
    noneOption: "None of these",
    options: [
      "Medicines for epilepsy (e.g. phenytoin, carbamazepine, phenobarbital)",
      "Antibiotics such as rifampicin, tetracyclines or co-trimoxazole",
      "Rifamycin, or the antifungal griseofulvin",
      "HIV antiviral medicines (e.g. ritonavir, nelfinavir)",
      "Anticoagulants (blood thinners) such as warfarin",
      "Ciclosporin",
      "Anti-cancer / cytotoxic medicines, or aminoglutethimide",
      "Regular NSAID painkillers (e.g. ibuprofen, naproxen)",
      "St John's Wort or other herbal remedies",
      "None of these",
    ],
    next: () => "s_gp_registered",
  },

  // Section E — GP, details & consent
  {
    id: "s_gp_registered",
    type: "single",
    step: 19,
    title: "Are you registered with a GP in the UK?",
    field: "pd_gp_registered",
    options: ["Yes", "No"],
    next: (a) => (a.pd_gp_registered === "No" ? "s_gp_no_reason" : "s_gp"),
  },
  {
    id: "s_gp_no_reason",
    type: "textarea",
    step: 19,
    title: "Can you tell us why not?",
    field: "pd_gp_no_reason",
    placeholder: "Tell us a little more…",
    next: () => "s_gp",
  },
  {
    id: "s_gp",
    type: "gp",
    step: 20,
    title: "Can we let your GP know about this supply?",
    subtitle: "We strongly recommend keeping your GP informed. Share their details and we'll write to them about this treatment.",
    field: "gp_practice_name",
    next: () => "s_anything_else",
  },
  {
    id: "s_anything_else",
    type: "textarea",
    step: 21,
    title: "Is there anything else our prescriber should know?",
    subtitle: "Family medical history, recent weight changes, or anything else that might affect your treatment.",
    field: "pd_anything_else",
    placeholder: "Add a note, or leave blank…",
    required: false,
    next: () => "s_name",
  },
  {
    id: "s_name",
    type: "name",
    step: 22,
    title: "Who is this treatment for?",
    subtitle: "Please double-check your name — we check it to confirm you're over 18, so even small spelling mistakes can delay your order.",
    next: () => "s_dob",
  },
  {
    id: "s_dob",
    type: "dob",
    step: 22,
    title: "What is your date of birth?",
    field: "date_of_birth_consultation",
    next: () => "s_email",
  },
  {
    id: "s_email",
    type: "email",
    step: 22,
    title: "Your email address",
    field: "email",
    next: () => "s_phone",
  },
  {
    id: "s_phone",
    type: "phone",
    step: 22,
    title: "Your mobile number",
    field: "consultation_mobile_number_v2",
    next: () => "s_address",
  },
  {
    id: "s_address",
    type: "textarea",
    step: 22,
    title: "Your home address",
    subtitle: "For delivery and records. Including postcode.",
    field: "pd_delivery_address",
    placeholder: "Address and postcode…",
    next: () => "s_safety",
  },

  // Section F — Safety netting & declarations
  {
    id: "s_safety",
    type: "acknowledge",
    step: 23,
    title: "Important safety information",
    subtitle: "Please read before you continue.",
    field: "pd_safety_ack",
    bullets: [
      "I understand I should take one tablet three times a day, starting about 3 days before my period is due, for no longer than the course supplied.",
      "I understand that if my period does not return after finishing the course, I should take a pregnancy test.",
      "I will stop the medicine and seek urgent help if I get chest pain, breathlessness, or swelling/pain in one leg — possible signs of a blood clot.",
      "I will seek medical advice if I get sudden vision changes, double vision, bulging of an eye, or a severe migraine.",
      "I understand possible side effects include spotting, breast tenderness, headaches, mood changes, bloating and nausea, and I will seek advice if I'm concerned.",
    ],
    next: () => "s_declaration",
  },
  {
    id: "s_declaration",
    type: "acknowledge",
    step: 24,
    title: "Before we finish, please confirm",
    field: "pd_declaration",
    bullets: [
      "I confirm I am 18 or over and this treatment is for me.",
      "I give my informed consent to this treatment.",
      "I have answered all questions honestly and accurately, and I understand inaccurate answers can put my health at risk.",
      "I will read the Patient Information Leaflet supplied with my medicine.",
      "I understand the final decision to prescribe rests with the prescriber, and requesting treatment does not guarantee a prescription.",
      "I understand medicines cannot be returned once dispensed.",
      "I agree to Jood's terms & conditions and privacy policy.",
    ],
    next: () => "s_success",
  },

  // Terminals
  { id: "s_block_sex", type: "block", step: 0, title: "Not suitable for this service", reviewSlideId: "s_sex", body: "This treatment is for women of childbearing age. Please speak to your GP for advice." },
  { id: "s_block_age", type: "block", step: 0, title: "Not suitable at this time", reviewSlideId: "s_age", body: "This treatment isn't available under 18 through this service. Please speak to your GP." },
  { id: "s_block_pregnancy", type: "block", step: 0, title: "Not suitable at this time", reviewSlideId: "s_pregnancy", body: "Because there isn't enough safety information, this treatment can't be used while pregnant, breastfeeding, or trying to conceive. Please speak to your GP." },
  { id: "s_block_recent", type: "block", step: 0, title: "Not suitable at this time", reviewSlideId: "s_recent_use", body: "This treatment is intended for occasional use. As you've used it within the last 6 months, please speak to your GP or family planning clinic." },
  { id: "s_block_pregnancy_test", type: "block", step: 0, title: "Not suitable at this time", reviewSlideId: "s_last_period", body: "We can't rule out pregnancy. Please take a pregnancy test and speak to your GP." },
  { id: "s_block_duration", type: "block", step: 0, title: "Not suitable at this time", reviewSlideId: "s_delay_length", body: "This treatment can only safely delay your period for up to 4 weeks. Please speak to your GP about longer-term options." },
  { id: "s_block_conditions", type: "block", step: 0, title: "Not suitable at this time", reviewSlideId: "s_exclusions", body: "Based on your medical history, this treatment isn't suitable. Please speak to your GP." },
  { id: "s_block_allergy", type: "block", step: 0, title: "Not suitable at this time", reviewSlideId: "s_allergy", body: "As you may react to norethisterone or its ingredients, this treatment isn't suitable. Please speak to your GP or pharmacist." },
  { id: "s_block_contraception", type: "block", step: 0, title: "Let our clinical team help", reviewSlideId: "s_contraception", body: "You may not need a separate medicine to delay your period — for example, the combined pill can often be tailored. A member of our clinical team will reach out to advise." },
  { id: "s_block_hrt", type: "block", step: 0, title: "Let our clinical team help", reviewSlideId: "s_hrt", body: "As you're using HRT, a member of our clinical team will review the best option for you. Please also speak to your prescriber." },

  { id: "s_success", type: "success", step: PD_TOTAL_STEPS, title: "" },
];
