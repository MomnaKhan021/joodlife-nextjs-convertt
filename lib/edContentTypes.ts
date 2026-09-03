/**
 * Shape, shipped copy and validation for /erectile-dysfunction.
 *
 * Eight bespoke sections, in the order a reader meets them: the photo hero,
 * the review wall, the teal journey block, the treatment-plan benefits, the
 * three steps, the confidence split, "let's get to know you", and the
 * closing banner. The FAQ between the last two comes from the shared
 * category-pages global.
 *
 * Client-safe (no `server-only`, no Payload import) so the /cms editor and
 * the page's client components can import it. `lib/edContent.ts` is the
 * server-side reader.
 */

/* ── shared shapes ──────────────────────────────────────── */

export type EdReview = {
  /** Optional bold line above the quote. */
  title: string;
  body: string;
  name: string;
  /** Two letters shown in the avatar circle. */
  initials: string;
};

export type EdStage = { tag: string; title: string; body: string };

export type EdTestimonial = { quote: string; name: string; meta: string };

/** Icon keys for the benefit cards — the path data lives in EdPage.tsx. */
export const BENEFIT_ICONS = [
  "delivery",
  "support",
  "trusted",
  "effective",
  "consult",
  "progress",
] as const;
export type BenefitIcon = (typeof BENEFIT_ICONS)[number];

export type EdBenefit = { title: string; body: string; icon: BenefitIcon };

export type EdStep = {
  /** The pill above the title, e.g. "Step 1". */
  step: string;
  title: string;
  body: string;
};

/* ── per-section shapes ─────────────────────────────────── */

export type EdHeroContent = {
  reviewsLabel: string;
  title: string;
  titleAccent: string;
  checks: string[];
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  image: string;
  imageAlt: string;
};

export type EdReviewsContent = {
  reviewsLabel: string;
  heading: string;
  headingAccent: string;
  body: string;
  reviews: EdReview[];
};

export type EdJourneyContent = {
  badge: string;
  heading: string;
  headingAccent: string;
  stages: EdStage[];
  image: string;
  imageAlt: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  cardBody: string;
  cardImage: string;
  cardImageAlt: string;
  cardCtaLabel: string;
  cardCtaHref: string;
  goalsHeading: string;
  goals: string[];
  goalsImage: string;
  goalsImageAlt: string;
  testimonials: EdTestimonial[];
};

export type EdPlanContent = {
  heading: string;
  headingAccent: string;
  /** The words after the italic accent, e.g. "around you". */
  headingTail: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  benefits: EdBenefit[];
};

export type EdStepsContent = {
  heading: string;
  headingAccent: string;
  body: string;
  steps: EdStep[];
  ctaLabel: string;
  ctaHref: string;
};

export type EdConfidenceContent = {
  eyebrow: string;
  heading: string;
  headingAccent: string;
  paragraphs: string[];
  checks: string[];
  image: string;
  imageAlt: string;
  statValue: number;
  statCaption: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

export type EdKnowContent = {
  heading: string;
  headingAccent: string;
  headingTail: string;
  body: string;
  quizBody: string;
  quizCtaLabel: string;
  quizCtaHref: string;
  progressImage: string;
  progressImageAlt: string;
  progressBody: string;
  progressNote: string;
  progressNoteStrong: string;
  /** Fill of the little progress bar, 0–100. */
  progressPercent: number;
  progressStages: string[];
};

export type EdBannerContent = {
  heading: string;
  headingAccent: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  imageAlt: string;
};

export type EdContent = {
  hero: EdHeroContent;
  reviews: EdReviewsContent;
  journey: EdJourneyContent;
  plan: EdPlanContent;
  steps: EdStepsContent;
  confidence: EdConfidenceContent;
  know: EdKnowContent;
  banner: EdBannerContent;
};

/* ── shipped copy ───────────────────────────────────────── */

const START = "/consultation?product=erectile-dysfunction";

export const ED_DEFAULT: EdContent = {
  hero: {
    reviewsLabel: "4.4 (50+) Reviews",
    title: "Regain confidence &",
    titleAccent: "control your performance",
    checks: [
      "Private online consultation",
      "Clinically approved ED treatments",
      "Discreet next day delivery",
      "Ongoing support from licensed professionals",
    ],
    ctaLabel: "Get Started",
    ctaHref: START,
    secondaryLabel: "See If You Are Eligible",
    secondaryHref: START,
    image: "/assets/category/ed-hero-banner.jpg",
    imageAlt: "A man feeling confident outdoors",
  },

  reviews: {
    reviewsLabel: "4.4 (50+) Reviews",
    heading: "3000+ happy",
    headingAccent: "customers",
    body: "Thousands of men have trusted Jood for safe, clinically guided care. Our patients value the expert support, clear communication, and lasting confidence that follows.",
    reviews: [
      {
        title: "A huge improvement overall",
        body: "I no longer worry the way I used to. I feel more in control, more relaxed, and much more confident in intimate situations.",
        name: "Mike",
        initials: "MI",
      },
      {
        title: "",
        body: "Discreet delivery and clear instructions. The consultation was simple and I felt supported the whole way through.",
        name: "David P.",
        initials: "DP",
      },
      {
        title: "Confidence restored",
        body: "The whole process was quick and completely private. Within weeks I felt like myself again — it's made a real difference.",
        name: "James R.",
        initials: "JR",
      },
      {
        title: "",
        body: "My medication always arrives well packaged and promptly, and I don't have to answer hundreds of questions to receive it.",
        name: "Hayley Churchyard",
        initials: "HC",
      },
      {
        title: "Genuinely reassuring",
        body: "The clinician took the time to recommend the right option for me. Reasonable prices and no pressure at any point.",
        name: "Daniel K.",
        initials: "DK",
      },
      {
        title: "",
        body: "Fast, professional and completely discreet. The ongoing support made all the difference to my confidence.",
        name: "Thomas B.",
        initials: "TB",
      },
    ],
  },

  journey: {
    badge: "Timeline",
    heading: "What to expect in",
    headingAccent: "your journey",
    stages: [
      {
        tag: "TODAY",
        title: "Immediate",
        body: "Start with a quick online consultation. A licensed provider reviews your information and your ED medication is delivered discreetly.",
      },
      {
        tag: "1–3 MONTHS",
        title: "Early results",
        body: "Notice gradual improvements in erectile function and increased confidence, with ongoing guidance from your provider.",
      },
      {
        tag: "3–6 MONTHS",
        title: "Continued progress",
        body: "Performance becomes more consistent, anxiety decreases, and your treatment plan may be adjusted for optimal results.",
      },
    ],
    image: "/assets/category/ed-thumbsup.png",
    imageAlt: "A man happy with his treatment results",
    ctaLabel: "Get Started",
    ctaHref: START,
    secondaryLabel: "Learn More",
    secondaryHref: START,
    cardBody:
      "Take control of erectile health safely and discreetly. Clinically approved treatments are delivered to your door, helping you regain confidence and performance.",
    cardImage: "/assets/category/ed-pill.png",
    cardImageAlt: "Clinically approved ED treatment tablet",
    cardCtaLabel: "Get Started",
    cardCtaHref: START,
    goalsHeading: "What are your goals?",
    goals: [
      "Address erectile difficulties",
      "Improve sexual confidence",
      "All the above",
    ],
    goalsImage: "/assets/category/ed-goals.png",
    goalsImageAlt: "Man considering his treatment goals",
    testimonials: [
      {
        quote:
          "This treatment completely restored my confidence. I no longer worry about performance, and I feel in control.",
        name: "Jordan, 42",
        meta: "2 months into treatment",
      },
      {
        quote:
          "I feel like myself again. My confidence has improved, and intimacy no longer feels stressful.",
        name: "Michael, 46",
        meta: "6 weeks completed",
      },
      {
        quote:
          "I noticed a real difference in my performance and confidence. It's helped me feel more in control again.",
        name: "David, 39",
        meta: "1 month completed",
      },
      {
        quote:
          "This has made a big impact on both my confidence and my relationship. I feel much more relaxed and reassured now.",
        name: "Chris, 51",
        meta: "7 weeks completed",
      },
    ],
  },

  plan: {
    heading: "A treatment plan that",
    headingAccent: "works",
    headingTail: "around you",
    body: "Safe, clinically approved treatment delivered privately, so you can plan with confidence.",
    ctaLabel: "Get Started",
    ctaHref: START,
    secondaryLabel: "See If You Are Eligible",
    secondaryHref: START,
    benefits: [
      {
        title: "Discreet, next-day delivery",
        body: "Next-day, unbranded, secure delivery with DPD.",
        icon: "delivery",
      },
      {
        title: "24/7 expert support",
        body: "Access experienced clinicians and coaches whenever you need.",
        icon: "support",
      },
      {
        title: "Trusted by thousands",
        body: "Chosen by patients nationwide for safe, effective care.",
        icon: "trusted",
      },
      {
        title: "Highly effective treatments",
        body: "Modern, evidence-based medication options.",
        icon: "effective",
      },
      {
        title: "Quick, easy consultation",
        body: "Start online in minutes; simple, private, seamless.",
        icon: "consult",
      },
      {
        title: "Track your progress",
        body: "Monitor results and stay on track using our online customer portal.",
        icon: "progress",
      },
    ],
  },

  steps: {
    heading: "How it",
    headingAccent: "works",
    body: "Start with a private health assessment, get reviewed by a licensed provider, and receive treatment discreetly at home.",
    steps: [
      {
        step: "Step 1",
        title: "Health assessment",
        body: "Complete a quick confidential form about your health, symptoms, and treatment goals.",
      },
      {
        step: "Step 2",
        title: "Expert review",
        body: "A licensed provider reviews your answers and recommends a suitable erectile dysfunction treatment.",
      },
      {
        step: "Step 3",
        title: "Get medication",
        body: "If approved, your treatment is delivered discreetly with clear instructions and ongoing support.",
      },
    ],
    ctaLabel: "Get Started",
    ctaHref: START,
  },

  confidence: {
    eyebrow: "Erectile dysfunction",
    heading: "Confidence in the",
    headingAccent: "moments that matter most.",
    paragraphs: [
      "Erectile dysfunction (ED) is the consistent inability to get or keep an erection firm enough for sexual activity. It’s common and can affect men of all ages.",
      "ED can have physical and emotional causes including stress, anxiety, low blood flow, certain health conditions, and lifestyle factors. The good news is that effective treatments are available.",
      "If suitable, we can prescribe proven ED treatments online after a simple consultation, with no appointment needed. Our goal is to help you feel more confident and supported at every step.",
    ],
    checks: ["Clinically approved", "Doctor prescribed", "Discreet & private"],
    image: "/assets/category/ed-confidence.jpg",
    imageAlt: "A man feeling more confident after treatment",
    statValue: 89,
    statCaption: "Members reported improved confidence in intimacy",
    ctaLabel: "Get Started",
    ctaHref: START,
    secondaryLabel: "See If You Are Eligible",
    secondaryHref: START,
  },

  know: {
    heading: "Let’s get to",
    headingAccent: "know",
    headingTail: "you",
    body: "Answer a few simple questions so we can match you with the right treatment and support for lasting results.",
    quizBody:
      "Answer a few simple questions so we can understand your symptoms and match you with the right treatment option.",
    quizCtaLabel: "Start Quiz",
    quizCtaHref: START,
    progressImage: "/assets/category/ed-progress.jpg",
    progressImageAlt: "A man staying active while on treatment",
    progressBody:
      "Monitor your progress and treatment response so you can stay supported and feel more in control.",
    progressNote: "Up to full",
    progressNoteStrong: "performance confidence",
    progressPercent: 62,
    progressStages: ["Low", "Moderate", "Strong", "Sustained"],
  },

  banner: {
    heading: "Take the first step",
    headingAccent: "toward better confidence",
    body: "Simple, discreet support for erectile dysfunction, designed around your health, routine, and privacy.",
    ctaLabel: "Get Started",
    ctaHref: START,
    image: "/assets/category/ed-cta.jpg",
    imageAlt: "A man confident about starting treatment",
  },
};

/* ── validation ─────────────────────────────────────────── */

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}

/** Button labels, alt text and optional lines may be emptied on purpose. */
function optStr(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

function clampPct(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, n));
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

export function mergeEd(stored: unknown): EdContent {
  const d = obj(stored);
  const B = ED_DEFAULT;

  const he = obj(d.hero);
  const rv = obj(d.reviews);
  const jo = obj(d.journey);
  const pl = obj(d.plan);
  const st = obj(d.steps);
  const cf = obj(d.confidence);
  const kn = obj(d.know);
  const bn = obj(d.banner);

  return {
    hero: {
      reviewsLabel: str(he.reviewsLabel, B.hero.reviewsLabel),
      title: str(he.title, B.hero.title),
      titleAccent: str(he.titleAccent, B.hero.titleAccent),
      checks: strList(he.checks, B.hero.checks),
      ctaLabel: optStr(he.ctaLabel, B.hero.ctaLabel),
      ctaHref: str(he.ctaHref, B.hero.ctaHref),
      secondaryLabel: optStr(he.secondaryLabel, B.hero.secondaryLabel),
      secondaryHref: str(he.secondaryHref, B.hero.secondaryHref),
      image: str(he.image, B.hero.image),
      imageAlt: optStr(he.imageAlt, B.hero.imageAlt),
    },

    reviews: {
      reviewsLabel: str(rv.reviewsLabel, B.reviews.reviewsLabel),
      heading: str(rv.heading, B.reviews.heading),
      headingAccent: str(rv.headingAccent, B.reviews.headingAccent),
      body: str(rv.body, B.reviews.body),
      reviews: rows<EdReview>(
        rv.reviews,
        (r) => ({
          title: optStr(r.title, ""),
          body: String(r.body ?? ""),
          name: String(r.name ?? ""),
          initials: String(r.initials ?? ""),
        }),
        (r) => r.body.trim() !== "" && r.name.trim() !== "",
        B.reviews.reviews,
      ),
    },

    journey: {
      badge: str(jo.badge, B.journey.badge),
      heading: str(jo.heading, B.journey.heading),
      headingAccent: str(jo.headingAccent, B.journey.headingAccent),
      stages: rows<EdStage>(
        jo.stages,
        (r) => ({
          tag: String(r.tag ?? ""),
          title: String(r.title ?? ""),
          body: String(r.body ?? ""),
        }),
        (r) => r.title.trim() !== "",
        B.journey.stages,
      ),
      image: str(jo.image, B.journey.image),
      imageAlt: optStr(jo.imageAlt, B.journey.imageAlt),
      ctaLabel: optStr(jo.ctaLabel, B.journey.ctaLabel),
      ctaHref: str(jo.ctaHref, B.journey.ctaHref),
      secondaryLabel: optStr(jo.secondaryLabel, B.journey.secondaryLabel),
      secondaryHref: str(jo.secondaryHref, B.journey.secondaryHref),
      cardBody: str(jo.cardBody, B.journey.cardBody),
      cardImage: str(jo.cardImage, B.journey.cardImage),
      cardImageAlt: optStr(jo.cardImageAlt, B.journey.cardImageAlt),
      cardCtaLabel: optStr(jo.cardCtaLabel, B.journey.cardCtaLabel),
      cardCtaHref: str(jo.cardCtaHref, B.journey.cardCtaHref),
      goalsHeading: str(jo.goalsHeading, B.journey.goalsHeading),
      goals: strList(jo.goals, B.journey.goals),
      goalsImage: str(jo.goalsImage, B.journey.goalsImage),
      goalsImageAlt: optStr(jo.goalsImageAlt, B.journey.goalsImageAlt),
      testimonials: rows<EdTestimonial>(
        jo.testimonials,
        (r) => ({
          quote: String(r.quote ?? ""),
          name: String(r.name ?? ""),
          meta: optStr(r.meta, ""),
        }),
        (r) => r.quote.trim() !== "" && r.name.trim() !== "",
        B.journey.testimonials,
      ),
    },

    plan: {
      heading: str(pl.heading, B.plan.heading),
      headingAccent: str(pl.headingAccent, B.plan.headingAccent),
      headingTail: optStr(pl.headingTail, B.plan.headingTail),
      body: str(pl.body, B.plan.body),
      ctaLabel: optStr(pl.ctaLabel, B.plan.ctaLabel),
      ctaHref: str(pl.ctaHref, B.plan.ctaHref),
      secondaryLabel: optStr(pl.secondaryLabel, B.plan.secondaryLabel),
      secondaryHref: str(pl.secondaryHref, B.plan.secondaryHref),
      benefits: rows<EdBenefit>(
        pl.benefits,
        (r) => ({
          title: String(r.title ?? ""),
          body: String(r.body ?? ""),
          icon: (BENEFIT_ICONS as readonly string[]).includes(String(r.icon))
            ? (r.icon as BenefitIcon)
            : "delivery",
        }),
        (r) => r.title.trim() !== "",
        B.plan.benefits,
      ),
    },

    steps: {
      heading: str(st.heading, B.steps.heading),
      headingAccent: str(st.headingAccent, B.steps.headingAccent),
      body: str(st.body, B.steps.body),
      steps: rows<EdStep>(
        st.steps,
        (r) => ({
          step: String(r.step ?? ""),
          title: String(r.title ?? ""),
          body: String(r.body ?? ""),
        }),
        (r) => r.title.trim() !== "",
        B.steps.steps,
      ),
      ctaLabel: optStr(st.ctaLabel, B.steps.ctaLabel),
      ctaHref: str(st.ctaHref, B.steps.ctaHref),
    },

    confidence: {
      eyebrow: str(cf.eyebrow, B.confidence.eyebrow),
      heading: str(cf.heading, B.confidence.heading),
      headingAccent: str(cf.headingAccent, B.confidence.headingAccent),
      paragraphs: strList(cf.paragraphs, B.confidence.paragraphs),
      checks: strList(cf.checks, B.confidence.checks),
      image: str(cf.image, B.confidence.image),
      imageAlt: optStr(cf.imageAlt, B.confidence.imageAlt),
      statValue: clampPct(cf.statValue, B.confidence.statValue),
      statCaption: str(cf.statCaption, B.confidence.statCaption),
      ctaLabel: optStr(cf.ctaLabel, B.confidence.ctaLabel),
      ctaHref: str(cf.ctaHref, B.confidence.ctaHref),
      secondaryLabel: optStr(cf.secondaryLabel, B.confidence.secondaryLabel),
      secondaryHref: str(cf.secondaryHref, B.confidence.secondaryHref),
    },

    know: {
      heading: str(kn.heading, B.know.heading),
      headingAccent: str(kn.headingAccent, B.know.headingAccent),
      headingTail: optStr(kn.headingTail, B.know.headingTail),
      body: str(kn.body, B.know.body),
      quizBody: str(kn.quizBody, B.know.quizBody),
      quizCtaLabel: optStr(kn.quizCtaLabel, B.know.quizCtaLabel),
      quizCtaHref: str(kn.quizCtaHref, B.know.quizCtaHref),
      progressImage: str(kn.progressImage, B.know.progressImage),
      progressImageAlt: optStr(kn.progressImageAlt, B.know.progressImageAlt),
      progressBody: str(kn.progressBody, B.know.progressBody),
      progressNote: optStr(kn.progressNote, B.know.progressNote),
      progressNoteStrong: optStr(
        kn.progressNoteStrong,
        B.know.progressNoteStrong,
      ),
      progressPercent: clampPct(kn.progressPercent, B.know.progressPercent),
      progressStages: strList(kn.progressStages, B.know.progressStages),
    },

    banner: {
      heading: str(bn.heading, B.banner.heading),
      headingAccent: str(bn.headingAccent, B.banner.headingAccent),
      body: str(bn.body, B.banner.body),
      ctaLabel: optStr(bn.ctaLabel, B.banner.ctaLabel),
      ctaHref: str(bn.ctaHref, B.banner.ctaHref),
      image: str(bn.image, B.banner.image),
      imageAlt: optStr(bn.imageAlt, B.banner.imageAlt),
    },
  };
}
