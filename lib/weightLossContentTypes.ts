/**
 * Shape, shipped copy and validation for /weight-loss.
 *
 * Six bespoke sections, in page order: the hero, the trust strip, the BMI
 * calculator, the journey block, the feature panel and the quiz banner. The
 * reviews, "How it works", FAQs, blog carousel and closing banner on this
 * page are the Home page's own sections and are edited there.
 *
 * Every default below is the wording the page shipped with, so an empty
 * global renders the page exactly as it was.
 *
 * Client-safe (no `server-only`, no Payload import) so the /cms editor and
 * the page's client components can import it. `lib/weightLossContent.ts` is
 * the server-side reader.
 */
import {
  CATEGORY_PAGE_DEFAULT,
  type CategoryFeatureGrid,
  type Feature,
  type UspItem,
} from "@/lib/categoryPageContentTypes";
import {
  WEIGHT_LOSS_STYLE_KEYS,
  mergeStyles,
  type SectionStyle,
  type WeightLossStyleKey,
} from "@/lib/sectionStyle";
import {
  WEIGHT_LOSS_TEXT_KEYS,
  mergeTextStyles,
  type TextStyle,
  type WeightLossTextKey,
} from "@/lib/textStyle";

/* ── per-section shapes ─────────────────────────────────── */

export type WlHeroContent = {
  /** The line beside the Trustpilot stars. */
  reviewsLabel: string;
  titleLead: string;
  /** Serif italic, after the lead. */
  titleAccent: string;
  /** Second line of the heading. */
  titleTail: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  image: string;
  mobileImage: string;
};

export type WlBmiContent = {
  heading: string;
  headingAccent: string;
  headingTail: string;
  body: string;
  calcTitle: string;
  calcSubtitle: string;
  buttonLabel: string;
  image: string;
  imageAlt: string;
  /** The three pills over the photo; their icons stay in place. */
  badges: string[];
  loseTitle: string;
  startTitle: string;
};

export type WlStage = {
  pill: string;
  title: string;
  body: string;
  /** Phones show a slightly longer line for some stages. */
  mobileBody: string;
};

export type WlChip = { label: string; sub: string };

export type WlJourneyContent = {
  badge: string;
  heading: string;
  headingAccent: string;
  mobileHeading: string;
  mobileHeadingAccent: string;
  mobileHeadingTail: string;
  stages: WlStage[];
  image: string;
  imageAlt: string;

  transformTitle: string;
  transformAccent: string;
  transformBody: string;
  transformBodyAccent: string;
  /** Six chips: the first three on the left, the last three on the right. */
  chips: WlChip[];
  transformImage: string;
  transformImageAlt: string;
  transformCtaLabel: string;
  transformCtaHref: string;

  guidanceTitle: string;
  guidanceNote: string;
  guidanceLabel: string;
  guidancePill: string;
  guidanceSide: string;
  guidanceImage: string;
  guidanceImageAlt: string;
  guidanceAccent: string;
  guidanceBody: string;
  guidanceBodyAccent: string;
  guidanceBodyTail: string;
  guidanceCtaLabel: string;
  guidanceCtaHref: string;
};

export type WlQuizContent = {
  heading: string;
  headingAccent: string;
  headingTail: string;
  body: string;
  planLabel: string;
  question: string;
  cardBody: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  imageAlt: string;
  pill: string;
  progressText: string;
  progressLabel: string;
  progressValue: string;
  weightLabels: string[];
};

export type WeightLossContent = {
  /** Per-section background / text colour. */
  styles: Record<WeightLossStyleKey, SectionStyle>;
  /** Per-text size and weight, keyed section.field. */
  textStyles: Record<WeightLossTextKey, TextStyle>;
  hero: WlHeroContent;
  usp: { items: UspItem[] };
  bmi: WlBmiContent;
  journey: WlJourneyContent;
  features: CategoryFeatureGrid;
  quiz: WlQuizContent;
};

/** The timeline is laid out for exactly three stages. */
export const WL_STAGE_COUNT = 3;
/** How many chips the journey card has room for, and icons for. */
export const WL_CHIP_COUNT = 6;
/** How many pills sit over the BMI photo. */
export const WL_BADGE_COUNT = 3;

/* ── shipped copy ───────────────────────────────────────── */

const QUIZ_BODY =
  "Answer a few simple questions so we can match you with the right treatment and support for lasting results.";

export const WL_DEFAULT: WeightLossContent = {
  // Nothing set, so every section and text keeps its designed look.
  styles: mergeStyles(null, WEIGHT_LOSS_STYLE_KEYS),
  textStyles: mergeTextStyles(null, WEIGHT_LOSS_TEXT_KEYS),
  hero: {
    reviewsLabel: "4.4 (50+) Reviews",
    titleLead: "Innovative",
    titleAccent: "weight loss,",
    titleTail: "made just for you.",
    bullets: [
      "Lose up to 27% body weight",
      "Plans tailored to you",
      "Guidance for lasting results",
    ],
    ctaLabel: "Get started",
    ctaHref: "/consultation",
    secondaryLabel: "See if you are eligible",
    secondaryHref: "#eligibility",
    image: "/assets/hero/hero-desktop.png",
    mobileImage: "/assets/hero/hero-mobile.png",
  },

  usp: { items: CATEGORY_PAGE_DEFAULT.uspStrip.items },

  bmi: {
    heading: "Everyone’s talking about",
    headingAccent: "jood life",
    headingTail: "because it works.",
    body: "Clinically proven treatments, medically supervised guidance, and thousand of real transformation all one powerful program.",
    calcTitle: "Check your",
    calcSubtitle: "Enter your height and weight below",
    buttonLabel: "Calculate BMI",
    image: "/assets/figma/happy-woman-2.png",
    imageAlt: "Happy customer showing results",
    badges: ["Affordable pricing", "Personalised support", "24/7 live support"],
    loseTitle: "You could lose:",
    startTitle: "Starting weight:",
  },

  journey: {
    badge: "Timeline",
    heading: "What to expect in",
    headingAccent: "your journey",
    mobileHeading: "What to expect",
    mobileHeadingAccent: "in your first month",
    mobileHeadingTail: "with Jood",
    stages: [
      {
        pill: "Today",
        title: "Simple assessment",
        body: "Quick online consultation with prescription and delivery if eligible.",
        mobileBody:
          "Quick online consultation with prescription and delivery if eligible and coaches through the app.",
      },
      {
        pill: "1 - 6 Months",
        title: "Healthy weight loss",
        body: "Steady weight loss with ongoing clinical support.",
        mobileBody: "Steady weight loss with ongoing clinical support.",
      },
      {
        pill: "6 - 12 Months",
        title: "Lasting change",
        body: "Maintain results with continued guidance and care.",
        mobileBody: "Maintain results with continued guidance and care.",
      },
    ],
    image: "/assets/figma/journey-woman-desktop.png",
    imageAlt: "Smiling customer",

    transformTitle: "It’s more than treatment,",
    transformAccent: "it’s transformation",
    transformBody:
      "A provider licensed in your state will review your information, so that they can",
    transformBodyAccent: "design a plan around your body’s needs.",
    chips: [
      { label: "Medication", sub: "Name" },
      { label: "Support", sub: "On going" },
      { label: "Result", sub: "Loss upto 26 %" },
      { label: "Delivery", sub: "Next Day" },
      { label: "Guidance", sub: "For lasting result" },
      { label: "Whatapp", sub: "24/7 support" },
    ],
    transformImage: "/assets/figma/journey-transformation-photo.png",
    transformImageAlt: "Personalised plan patient",
    transformCtaLabel: "Get personalised plan",
    transformCtaHref: "#get-personalized",

    guidanceTitle: "Continuous, Expert Guidance",
    guidanceNote: "Free Consultation Every Month",
    guidanceLabel: "Monthly Check-in",
    guidancePill: "Treatment Check-in",
    guidanceSide: "Health Assessment",
    guidanceImage: "/assets/figma/journey-expert-phone.png",
    guidanceImageAlt: "Treatment check-in dashboard",
    guidanceAccent: "at Every Step",
    guidanceBody:
      "Get access to qualified medical professionals who are here to support you",
    guidanceBodyAccent: "throughout your journey",
    guidanceBodyTail: "whenever you need advice.",
    guidanceCtaLabel: "Get started",
    guidanceCtaHref: "/consultation",
  },

  features: CATEGORY_PAGE_DEFAULT.featureGrid,

  quiz: {
    heading: "Let’s get to",
    headingAccent: "know",
    headingTail: "you",
    body: QUIZ_BODY,
    planLabel: "Your weight- loss plan",
    question: "What is your desired weight?",
    cardBody: QUIZ_BODY,
    ctaLabel: "Start Quiz",
    ctaHref: "#quiz",
    image: "/assets/figma/quiz-feel-energetic.png",
    imageAlt: "Energetic customer enjoying a daily walk",
    pill: "Feel Energetic",
    progressText:
      "Makeing sure you are moving in the right direction by tracking your progress",
    progressLabel: "loos up to",
    progressValue: "20kg",
    weightLabels: ["140kg", "130kg", "120kg", "110kg", "100kg"],
  },
};

/* ── validation ─────────────────────────────────────────── */

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}

/** Button labels, alt text and optional halves may be emptied on purpose. */
function optStr(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

function strList(v: unknown, fallback: string[]): string[] {
  if (!Array.isArray(v)) return fallback;
  const out = v.filter((x): x is string => typeof x === "string" && x.trim() !== "");
  return out.length ? out : fallback;
}

function rows<T>(
  v: unknown,
  make: (r: Record<string, unknown>) => T,
  keep: (r: T) => boolean,
  fallback: T[],
): T[] {
  if (!Array.isArray(v)) return fallback;
  const out = v.map(obj).map(make).filter(keep);
  return out.length ? out : fallback;
}

/**
 * A list with a fixed number of slots, each falling back on its own.
 *
 * The chips and badges each carry an icon drawn in code, matched by
 * position, so the count cannot change - only the words in each slot.
 */
function slots<T>(
  v: unknown,
  fallback: T[],
  make: (r: Record<string, unknown>, base: T) => T,
): T[] {
  const list = Array.isArray(v) ? v : [];
  return fallback.map((base, i) => make(obj(list[i]), base));
}

function fixedStrings(v: unknown, fallback: string[]): string[] {
  const list = Array.isArray(v) ? v : [];
  return fallback.map((base, i) => str(list[i], base));
}

export function mergeWeightLoss(stored: unknown): WeightLossContent {
  const d = obj(stored);
  const B = WL_DEFAULT;

  const he = obj(d.hero);
  const us = obj(d.usp);
  const bm = obj(d.bmi);
  const jo = obj(d.journey);
  const fe = obj(d.features);
  const qu = obj(d.quiz);

  return {
    styles: mergeStyles(d.styles, WEIGHT_LOSS_STYLE_KEYS),
    textStyles: mergeTextStyles(d.textStyles, WEIGHT_LOSS_TEXT_KEYS),
    hero: {
      reviewsLabel: str(he.reviewsLabel, B.hero.reviewsLabel),
      titleLead: str(he.titleLead, B.hero.titleLead),
      titleAccent: optStr(he.titleAccent, B.hero.titleAccent),
      titleTail: optStr(he.titleTail, B.hero.titleTail),
      bullets: strList(he.bullets, B.hero.bullets),
      ctaLabel: optStr(he.ctaLabel, B.hero.ctaLabel),
      ctaHref: str(he.ctaHref, B.hero.ctaHref),
      secondaryLabel: optStr(he.secondaryLabel, B.hero.secondaryLabel),
      secondaryHref: str(he.secondaryHref, B.hero.secondaryHref),
      image: str(he.image, B.hero.image),
      mobileImage: str(he.mobileImage, B.hero.mobileImage),
    },

    usp: {
      items: rows<UspItem>(
        us.items,
        (r) => ({ icon: String(r.icon ?? ""), label: String(r.label ?? "") }),
        (r) => r.label.trim() !== "",
        B.usp.items,
      ),
    },

    bmi: {
      heading: str(bm.heading, B.bmi.heading),
      headingAccent: optStr(bm.headingAccent, B.bmi.headingAccent),
      headingTail: optStr(bm.headingTail, B.bmi.headingTail),
      body: str(bm.body, B.bmi.body),
      calcTitle: str(bm.calcTitle, B.bmi.calcTitle),
      calcSubtitle: optStr(bm.calcSubtitle, B.bmi.calcSubtitle),
      buttonLabel: str(bm.buttonLabel, B.bmi.buttonLabel),
      image: str(bm.image, B.bmi.image),
      imageAlt: optStr(bm.imageAlt, B.bmi.imageAlt),
      badges: fixedStrings(bm.badges, B.bmi.badges),
      loseTitle: str(bm.loseTitle, B.bmi.loseTitle),
      startTitle: str(bm.startTitle, B.bmi.startTitle),
    },

    journey: {
      badge: optStr(jo.badge, B.journey.badge),
      heading: str(jo.heading, B.journey.heading),
      headingAccent: optStr(jo.headingAccent, B.journey.headingAccent),
      mobileHeading: str(jo.mobileHeading, B.journey.mobileHeading),
      mobileHeadingAccent: optStr(
        jo.mobileHeadingAccent,
        B.journey.mobileHeadingAccent,
      ),
      mobileHeadingTail: optStr(jo.mobileHeadingTail, B.journey.mobileHeadingTail),
      stages: slots<WlStage>(jo.stages, B.journey.stages, (r, base) => {
        const body = str(r.body, base.body);
        return {
          pill: str(r.pill, base.pill),
          title: str(r.title, base.title),
          body,
          // Phone wording falls back to the stage's own shipped phone line,
          // unless the desktop line was changed - then to the new line, so
          // a phone never shows text the editor has replaced.
          mobileBody: str(
            r.mobileBody,
            body === base.body ? base.mobileBody : body,
          ),
        };
      }),
      image: str(jo.image, B.journey.image),
      imageAlt: optStr(jo.imageAlt, B.journey.imageAlt),

      transformTitle: str(jo.transformTitle, B.journey.transformTitle),
      transformAccent: optStr(jo.transformAccent, B.journey.transformAccent),
      transformBody: str(jo.transformBody, B.journey.transformBody),
      transformBodyAccent: optStr(
        jo.transformBodyAccent,
        B.journey.transformBodyAccent,
      ),
      chips: slots<WlChip>(jo.chips, B.journey.chips, (r, base) => ({
        label: str(r.label, base.label),
        sub: optStr(r.sub, base.sub),
      })),
      transformImage: str(jo.transformImage, B.journey.transformImage),
      transformImageAlt: optStr(jo.transformImageAlt, B.journey.transformImageAlt),
      transformCtaLabel: optStr(jo.transformCtaLabel, B.journey.transformCtaLabel),
      transformCtaHref: str(jo.transformCtaHref, B.journey.transformCtaHref),

      guidanceTitle: str(jo.guidanceTitle, B.journey.guidanceTitle),
      guidanceNote: optStr(jo.guidanceNote, B.journey.guidanceNote),
      guidanceLabel: optStr(jo.guidanceLabel, B.journey.guidanceLabel),
      guidancePill: optStr(jo.guidancePill, B.journey.guidancePill),
      guidanceSide: optStr(jo.guidanceSide, B.journey.guidanceSide),
      guidanceImage: str(jo.guidanceImage, B.journey.guidanceImage),
      guidanceImageAlt: optStr(jo.guidanceImageAlt, B.journey.guidanceImageAlt),
      guidanceAccent: optStr(jo.guidanceAccent, B.journey.guidanceAccent),
      guidanceBody: str(jo.guidanceBody, B.journey.guidanceBody),
      guidanceBodyAccent: optStr(
        jo.guidanceBodyAccent,
        B.journey.guidanceBodyAccent,
      ),
      guidanceBodyTail: optStr(jo.guidanceBodyTail, B.journey.guidanceBodyTail),
      guidanceCtaLabel: optStr(jo.guidanceCtaLabel, B.journey.guidanceCtaLabel),
      guidanceCtaHref: str(jo.guidanceCtaHref, B.journey.guidanceCtaHref),
    },

    features: {
      heading: str(fe.heading, B.features.heading),
      headingAccent: str(fe.headingAccent, B.features.headingAccent),
      body: str(fe.body, B.features.body),
      ctaLabel: optStr(fe.ctaLabel, B.features.ctaLabel),
      ctaHref: str(fe.ctaHref, B.features.ctaHref),
      secondaryLabel: optStr(fe.secondaryLabel, B.features.secondaryLabel),
      secondaryHref: str(fe.secondaryHref, B.features.secondaryHref),
      features: rows<Feature>(
        fe.features,
        (r) => ({
          icon: String(r.icon ?? ""),
          title: String(r.title ?? ""),
          copy: String(r.copy ?? ""),
        }),
        (r) => r.title.trim() !== "",
        B.features.features,
      ),
    },

    quiz: {
      heading: str(qu.heading, B.quiz.heading),
      headingAccent: optStr(qu.headingAccent, B.quiz.headingAccent),
      headingTail: optStr(qu.headingTail, B.quiz.headingTail),
      body: str(qu.body, B.quiz.body),
      planLabel: optStr(qu.planLabel, B.quiz.planLabel),
      question: optStr(qu.question, B.quiz.question),
      cardBody: str(qu.cardBody, B.quiz.cardBody),
      ctaLabel: optStr(qu.ctaLabel, B.quiz.ctaLabel),
      ctaHref: str(qu.ctaHref, B.quiz.ctaHref),
      image: str(qu.image, B.quiz.image),
      imageAlt: optStr(qu.imageAlt, B.quiz.imageAlt),
      pill: optStr(qu.pill, B.quiz.pill),
      progressText: optStr(qu.progressText, B.quiz.progressText),
      progressLabel: optStr(qu.progressLabel, B.quiz.progressLabel),
      progressValue: optStr(qu.progressValue, B.quiz.progressValue),
      weightLabels: strList(qu.weightLabels, B.quiz.weightLabels),
    },
  };
}
