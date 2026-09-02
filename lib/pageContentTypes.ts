/**
 * Home page section content: types and the defaults that shipped in the
 * components.
 *
 * Client-safe on purpose — no `server-only`, no Payload import — so the /cms
 * editors can import these types. `lib/pageContent.ts` is the server-side
 * reader and re-exports everything here.
 *
 * The DEFAULT_* values are what makes this safe to deploy: an empty global
 * renders the page exactly as it does today.
 */

export type Faq = { q: string; a: string };

export const DEFAULT_ANNOUNCEMENT = {
  announcementBadge: "New",
  announcementText:
    "Foundayo® (oral tirzepatide) – a new tablet option for weight management is now available",
  announcementHref: "/wegovy-pills",
  announcementHidden: false,
};

export const DEFAULT_FAQ_HEADING = {
  faqHeading: "Frequently asked",
  faqHeadingEmphasis: "questions",
};

export const DEFAULT_FAQS: Faq[] = [
  {
    q: "How does Jood's weight-loss actually work?",
    a: "Jood combines clinically proven GLP-1 medication with personalised coaching, ongoing clinical support, and evidence-based nutrition and movement guidance to help you achieve lasting results.",
  },
  {
    q: "Is the medication safe and evidence-based?",
    a: "Yes. All medications are MHRA/GPhC licensed and prescribed by UK-registered clinicians after reviewing your full health assessment.",
  },
  {
    q: "What if I miss an injection?",
    a: "Contact our 24/7 clinical team and they'll advise you on the safest way to get back on schedule — it's never a problem we can't solve.",
  },
  {
    q: "What is included with my purchase?",
    a: "Your plan includes the medication, ongoing clinical support, a personalised care plan, and free next-day discreet delivery.",
  },
  {
    q: "Can I pause or cancel my subscription?",
    a: "Yes — you're always in control. You can pause or cancel at any time from your account dashboard.",
  },
];

export type HiwStep = {
  step: string;
  title: string;
  copy: string;
  img: string;
};

export const DEFAULT_HIW_HEADING = {
  hiwHeading: "How it",
  hiwHeadingEmphasis: "works",
};

export const DEFAULT_HIW_STEPS: HiwStep[] = [
  {
    step: "Step 1",
    title: "Complete your assessment",
    copy: "Answer a few quick questions about your health, medical history and treatment goals.",
    img: "/assets/figma/hiw-step1.png",
  },
  {
    step: "Step 2",
    title: "Clinical review",
    copy: "One of our experienced UK clinicians will review your assessment and recommend the most appropriate treatment, where clinically suitable.",
    img: "/assets/figma/hiw-step2.png",
  },
  {
    step: "Step 3",
    title: "Treatment delivered",
    copy: "If approved, your treatment will be prepared by our pharmacy and delivered quickly, discreetly and securely to your door.",
    img: "/assets/figma/hiw-step3-v2.png",
  },
];

export const DEFAULT_CTA = {
  ctaTitle: "Take the first step",
  ctaTitleEmphasis: "toward a better you",
  ctaSubtitle:
    "Simple support for your goals, your routine, and your confidence.",
  ctaImage: "/assets/figma/cta-bg.png",
};

export type HomeContent = { faqs: Faq[]; hiwSteps: HiwStep[] } & typeof DEFAULT_ANNOUNCEMENT &
  typeof DEFAULT_FAQ_HEADING &
  typeof DEFAULT_HIW_HEADING &
  typeof DEFAULT_CTA;

/** Accept only well-formed FAQ rows; anything else falls back. */
export function toFaqs(value: unknown, fallback: Faq[]): Faq[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .filter(
      (v): v is Faq =>
        Boolean(v) &&
        typeof v === "object" &&
        typeof (v as Faq).q === "string" &&
        typeof (v as Faq).a === "string",
    )
    .map((v) => ({ q: v.q, a: v.a }));
  return cleaned.length ? cleaned : fallback;
}

/** Accept only well-formed step rows; anything else falls back. */
export function toHiwSteps(value: unknown, fallback: HiwStep[]): HiwStep[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .filter(
      (v): v is HiwStep =>
        Boolean(v) && typeof v === "object" && typeof (v as HiwStep).title === "string",
    )
    .map((v) => ({
      step: typeof v.step === "string" ? v.step : "",
      title: v.title,
      copy: typeof v.copy === "string" ? v.copy : "",
      img: typeof v.img === "string" ? v.img : "",
    }));
  return cleaned.length ? cleaned : fallback;
}

export function homeFallback(): HomeContent {
  return {
    faqs: DEFAULT_FAQS,
    hiwSteps: DEFAULT_HIW_STEPS,
    ...DEFAULT_ANNOUNCEMENT,
    ...DEFAULT_FAQ_HEADING,
    ...DEFAULT_HIW_HEADING,
    ...DEFAULT_CTA,
  };
}
