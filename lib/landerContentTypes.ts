/**
 * Content for the weight-loss ads landing page at /weight-loss-lander, stored
 * on the "weight-loss-lander" global and edited in /cms/weight-loss-lander.
 *
 * LANDER_DEFAULT is the page as built from the "Ads Landing - Joodlife -
 * Next Js" Figma. Anything missing or emptied in the CMS falls back to it, so
 * an empty global renders the page exactly as it ships. Client-safe (no
 * server imports) — the editor uses the same types and merge.
 */

import { mergeStyles, type SectionStyle } from "@/lib/sectionStyle";

const A = "/assets/lp-weight-loss";
export const LANDER_CTA_HREF = "/consultation?product=weight-loss";
export const TRUSTPILOT_URL = "https://www.trustpilot.com/review/joodlife.com";

/** The lander's sections, in page order — one colour control each. */
export const LANDER_STYLE_KEYS = [
  "hero",
  "trust",
  "stories",
  "results",
  "expertise",
  "steps",
  "journey",
  "reviews",
  "faq",
  "final",
] as const;
export type LanderStyleKey = (typeof LANDER_STYLE_KEYS)[number];

export type LanderCta = { ctaLabel: string; ctaHref: string };
export type LanderHeading = { heading: string; headingAccent: string };

export type LanderHero = LanderCta & {
  topBar: string;
  rating: string;
  title: string;
  titleAccent: string;
  bullets: string[];
  image: string;
  imageAlt: string;
  cardName: string;
  cardChannel: string;
  cardMessage: string;
};

export type LanderTrust = { reviewsLabel: string; rating: string; badges: string[] };

/** A video slide: the image shows until someone presses play. */
export type LanderMedia = { image: string; video: string; alt: string };
export type LanderFeature = { icon: string; title: string; body: string };

export type LanderStories = LanderHeading & {
  subtitle: string;
  items: LanderMedia[];
  features: LanderFeature[];
};

export type LanderResult = {
  name: string;
  before: string;
  after: string;
  beforeLabel: string;
  afterLabel: string;
  lost: string;
  detail: string;
  quote: string;
};
export type LanderResults = LanderHeading & LanderCta & { items: LanderResult[] };

export type LanderExpertise = LanderHeading & {
  body: string;
  leadName: string;
  leadRole: string;
  linkLabel: string;
  linkHref: string;
};

/** One "How the programme works" step; the image is optional per step. */
export type LanderStep = { title: string; body: string; image: string };
export type LanderSteps = LanderHeading & LanderCta & { subtitle: string; items: LanderStep[] };

/**
 * "Your Journey": one video that walks through every step, beside the steps.
 * A step's optional `time` ("0:45") jumps the video there when it's clicked
 * and lights the step up while that part plays.
 */
export type LanderJourneyItem = { badge: string; title: string; body: string; time: string };
export type LanderJourney = LanderHeading &
  LanderCta &
  LanderMedia & { subtitle: string; items: LanderJourneyItem[] };

export type LanderReview = { tag: string; title: string; quote: string; name: string };
export type LanderReviews = LanderHeading & LanderCta & { rating: string; items: LanderReview[] };

export type LanderFaq = { q: string; a: string };
export type LanderFaqs = LanderHeading & { items: LanderFaq[] };

export type LanderFinal = LanderHeading & LanderCta & {
  subtitle: string;
  mobileCtaLabel: string;
  disclaimer: string;
  image: string;
  imageAlt: string;
  benefits: LanderFeature[];
};

export type LanderContent = {
  hero: LanderHero;
  trust: LanderTrust;
  stories: LanderStories;
  results: LanderResults;
  expertise: LanderExpertise;
  steps: LanderSteps;
  journey: LanderJourney;
  reviews: LanderReviews;
  faq: LanderFaqs;
  final: LanderFinal;
  styles: Record<LanderStyleKey, SectionStyle>;
};

const CTA = { ctaLabel: "Start My Weight-Loss Journey", ctaHref: LANDER_CTA_HREF };

export const LANDER_DEFAULT: LanderContent = {
  hero: {
    ...CTA,
    topBar: "The Jood Weight Loss Programme",
    rating: "4.4",
    title: "Lose weight with a programme",
    titleAccent: "designed around you.",
    bullets: ["UK-registered clinicians", "Personalised plan", "24/7 WhatsApp support"],
    image: `${A}/hero-4.png`,
    imageAlt: "Woman in sportswear standing confidently outdoors",
    cardName: "Jood clinical team",
    cardChannel: "· WhatsApp",
    cardMessage: "Hi Sarah, I've reviewed your answers. Shall we book your video call?",
  },
  trust: {
    reviewsLabel: "1,085 Reviews",
    rating: "4.4",
    badges: ["GPhC registered", "LegitScript certified", "3,000+ patients"],
  },
  stories: {
    heading: "Real Stories From People",
    headingAccent: "Like You",
    subtitle: "Real stories from people who've been through it.",
    items: [
      { image: `${A}/story-1-poster.jpg`, video: "", alt: "Patient sharing her weight-loss story" },
      { image: `${A}/story-2-poster.jpg`, video: "", alt: "Patient: I thought getting help with weight loss would be a massive faff" },
      { image: `${A}/story-3-poster.jpg`, video: "", alt: "Patient describing her experience with Jood" },
    ],
    features: [
      { icon: `${A}/icon-video.svg`, title: "Clinician Video Review", body: "A one-to-one video call with a UK-registered clinician before you start." },
      { icon: `${A}/icon-plan.svg`, title: "Personalised Plan", body: "Built around your health, routine and goals, and adjusted as you go." },
      { icon: `${A}/icon-calendar.svg`, title: "Monthly Check-Ins", body: "Regular reviews with your clinical team to keep your plan on track." },
      { icon: `${A}/icon-pause.svg`, title: "Pause Or Cancel", body: "No lock-in. Change or stop your plan whenever you need to." },
    ],
  },
  results: {
    ...CTA,
    heading: "Real patients,",
    headingAccent: "real journeys.",
    items: [
      {
        name: "Amanda, 43",
        before: `${A}/ba-amanda-before.png`,
        after: `${A}/ba-amanda-after.png`,
        beforeLabel: "Week 0",
        afterLabel: "Week 4",
        lost: "−17kg",
        detail: "38 lbs in 4 weeks",
        quote: "“In just four months, I've managed to shed a bit over 38 pounds. Jood's 24/7 support helped me a lot through my journey.”",
      },
      {
        name: "Kimberly, 39",
        before: `${A}/ba-kim-before-b.png`,
        after: `${A}/ba-kim-after-b.png`,
        beforeLabel: "Week 0",
        afterLabel: "Week 4",
        lost: "−8kg",
        detail: "18 lbs in 4 weeks",
        quote: "“In just over four weeks, I've already lost a little more than 18 pounds. I feel much healthier now.”",
      },
    ],
  },
  expertise: {
    heading: "Weight Loss,",
    headingAccent: "Backed By Medical Expertise.",
    body: "Your programme is supported by qualified clinicians who assess your individual needs and guide your treatment.",
    leadName: "Led by Zahhaad Khalil,",
    leadRole: "Superintendent Pharmacist (GPhC 2228969), and a small UK clinical team.",
    linkLabel: "Meet the team",
    linkHref: "/support",
  },
  steps: {
    ...CTA,
    heading: "How The Programme",
    headingAccent: "Works",
    subtitle: "Four simple steps, all online, all led by UK clinicians.",
    items: [
      { title: "Complete your assessment", body: "Tell us about your goals and health.", image: `${A}/step-img-2.png` },
      { title: "Meet your clinician", body: "A one-to-one video call with a UK-registered clinician to talk through your options.", image: `${A}/step-2-clinician.jpg` },
      { title: "Start your programme", body: "If it's right for you, your treatment is prescribed and delivered to your door.", image: `${A}/step-3-pen.jpg` },
      { title: "Track your progress", body: "Regular check-ins with your clinical team keep your plan on track.", image: `${A}/step-4-progress.jpg` },
    ],
  },
  journey: {
    ...CTA,
    heading: "Your",
    headingAccent: "Journey",
    subtitle: "What the Jood process is like, from day one to month twelve and beyond.",
    image: `${A}/journey-cover.jpg`,
    video: "",
    alt: "A Jood clinician explains the programme, step by step",
    items: [
      { badge: "Day 1", title: "Your online assessment", body: "A full look at your health history and goals, reviewed by a licensed clinician." },
      { badge: "Next", title: "Prescribed and delivered", body: "If it's right for you, your treatment is prescribed and delivered to your door." },
      { badge: "Months 1-6", title: "The real work, supported", body: "Steady progress with clinical support checking in along the way, not radio silence." },
      { badge: "Months 6-12", title: "Keeping it off", body: "Less about losing weight, more about keeping it off, with guidance there 24/7." },
    ].map((s) => ({ ...s, time: "" })),
  },
  reviews: {
    ...CTA,
    heading: "Verified Patient",
    headingAccent: "Reviews",
    rating: "4.4",
    items: [
      {
        tag: "6 stone lost · 18 months",
        title: "Life changing",
        quote: "“I've been using it for 18 months and lost 6 stones… it's life changing. Great service from Kelly at Jood.”",
        name: "Susan Mayes",
      },
      {
        tag: "",
        title: "Felt at ease",
        quote: "“Amazing fast service… very helpful & friendly… felt at ease… did video call.”",
        name: "Linsey Robinson",
      },
      {
        tag: "",
        title: "Real people on WhatsApp",
        quote: "“Great service, very prompt with the orders coming out. Having a WhatsApp chat is fantastic.”",
        name: "Mr & Mrs Gamble",
      },
    ],
  },
  faq: {
    heading: "Frequently asked",
    headingAccent: "questions",
    items: [
      { q: "Am I eligible?", a: "The programme is for adults aged 18 and over. Eligibility depends on your BMI and medical history, which you share in a short online assessment. A UK-registered clinician reviews every answer before anything is prescribed." },
      { q: "What happens after I apply?", a: "A clinician reviews your assessment and, where needed, books a one-to-one video call. If treatment is right for you, it's prescribed and delivered to your door, and your clinical team checks in along the way." },
      { q: "What's in the programme?", a: "Your clinician video review, a personalised plan built around your health and goals, monthly check-ins with your clinical team and 24/7 WhatsApp support." },
      { q: "Is it private?", a: "Yes. Your assessment and medical details are only seen by our clinical team, and your treatment arrives in discreet packaging." },
      { q: "Can I pause or cancel?", a: "Yes. There's no lock-in — you can change, pause or stop your plan whenever you need to." },
      { q: "Can I switch?", a: "If you're already on a weight-loss treatment elsewhere, tell us in your assessment. Your clinician will review it and advise whether switching to Jood is right for you." },
    ],
  },
  final: {
    ...CTA,
    heading: "Ready to find out if the",
    headingAccent: "programme is open to you?",
    subtitle: "About three minutes, free, no obligation.",
    mobileCtaLabel: "Check Your Eligibility →",
    disclaimer: "All treatments subject to approval by a UK-registered clinician following an online consultation. For adults 18+",
    image: `${A}/final-women.png`,
    imageAlt: "Two smiling women in sportswear",
    benefits: [
      { icon: `${A}/icon-user-check.svg`, title: "UK-registered clinicians", body: "Your suitability is reviewed by qualified prescribers." },
      { icon: `${A}/icon-file-text.svg`, title: "Personalised treatment plans", body: "Care tailored to your goals and medical history." },
      { icon: `${A}/icon-message.svg`, title: "Ongoing support", body: "Guidance from our clinical team throughout your journey." },
      { icon: `${A}/icon-sliders.svg`, title: "Flexible treatment", body: "Pause or cancel anytime when you need to." },
    ],
  },
  styles: mergeStyles(null, LANDER_STYLE_KEYS),
};

/* ---- merge helpers ---------------------------------------------------- */

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec => (v && typeof v === "object" && !Array.isArray(v) ? (v as Rec) : {});
/** Required text: empty falls back to the shipped wording. */
const str = (v: unknown, fb: string) => (typeof v === "string" && v.trim() ? v : fb);
/** Optional text: an empty string is kept (hides a label, clears an image). */
const opt = (v: unknown, fb: string) => (typeof v === "string" ? v : fb);

/**
 * A list the editor can add to, remove from and reorder. A stored list
 * replaces the shipped one; an empty or missing list keeps the shipped one.
 */
function list<T>(v: unknown, fb: T[], make: (r: Rec, d: T) => T, keep: (t: T) => boolean): T[] {
  if (!Array.isArray(v)) return fb;
  const out = v.map((x, i) => make(rec(x), fb[i] ?? fb[0])).filter(keep);
  return out.length ? out : fb;
}

const strings = (v: unknown, fb: string[]) => {
  if (!Array.isArray(v)) return fb;
  const out = v.filter((x): x is string => typeof x === "string" && !!x.trim());
  return out.length ? out : fb;
};

const cta = (r: Rec, d: LanderCta): LanderCta => ({
  ctaLabel: opt(r.ctaLabel, d.ctaLabel),
  ctaHref: str(r.ctaHref, d.ctaHref),
});
const heading = (r: Rec, d: LanderHeading): LanderHeading => ({
  heading: str(r.heading, d.heading),
  headingAccent: opt(r.headingAccent, d.headingAccent),
});
// Slides added in the CMS have no shipped twin, so media never borrows
// another slide's picture — an empty image stays empty.
const media = (r: Rec): LanderMedia => ({
  image: opt(r.image, ""),
  video: opt(r.video, ""),
  alt: opt(r.alt, ""),
});
const feature = (r: Rec, d: LanderFeature): LanderFeature => ({
  icon: opt(r.icon, d.icon),
  title: opt(r.title, ""),
  body: opt(r.body, ""),
});
const hasText = (f: { title: string }) => !!f.title.trim();

/**
 * The journey used to have a video per card. Content saved that way carries
 * its video on the steps instead of the section, so the first step's video
 * becomes the section's until the editor sets one.
 */
function journeyOf(jn: Rec, d: LanderJourney): LanderJourney {
  const rawItems = Array.isArray(jn.items) ? jn.items.map(rec) : [];
  const legacy = rawItems.find((r) => typeof r.video === "string" && r.video.trim()) ?? {};
  return {
    ...heading(jn, d),
    ...cta(jn, d),
    subtitle: opt(jn.subtitle, d.subtitle),
    video: opt(jn.video, typeof legacy.video === "string" ? legacy.video : d.video),
    // The old per-card covers were low-res crops, so they aren't carried over.
    image: opt(jn.image, d.image),
    alt: opt(jn.alt, d.alt),
    items: list(
      jn.items,
      d.items,
      (r) => ({ badge: opt(r.badge, ""), title: opt(r.title, ""), body: opt(r.body, ""), time: opt(r.time, "") }),
      hasText,
    ),
  };
}

/** "1:05" / "65" / "0:01:05" → seconds; anything else → null. */
export function parseTime(t: string): number | null {
  const m = t.trim().match(/^(?:(\d+):)?(\d+)(?::(\d+))?$/);
  if (!m) return null;
  const parts = t.trim().split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n))) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

export function mergeLander(stored: unknown): LanderContent {
  const s = rec(stored);
  const D = LANDER_DEFAULT;

  const h = rec(s.hero);
  const t = rec(s.trust);
  const st = rec(s.stories);
  const rs = rec(s.results);
  const ex = rec(s.expertise);
  const sp = rec(s.steps);
  const jn = rec(s.journey);
  const rv = rec(s.reviews);
  const fq = rec(s.faq);
  const fn = rec(s.final);

  return {
    hero: {
      ...cta(h, D.hero),
      topBar: opt(h.topBar, D.hero.topBar),
      rating: str(h.rating, D.hero.rating),
      title: str(h.title, D.hero.title),
      titleAccent: opt(h.titleAccent, D.hero.titleAccent),
      bullets: strings(h.bullets, D.hero.bullets),
      image: str(h.image, D.hero.image),
      imageAlt: opt(h.imageAlt, D.hero.imageAlt),
      cardName: opt(h.cardName, D.hero.cardName),
      cardChannel: opt(h.cardChannel, D.hero.cardChannel),
      cardMessage: opt(h.cardMessage, D.hero.cardMessage),
    },
    trust: {
      reviewsLabel: opt(t.reviewsLabel, D.trust.reviewsLabel),
      rating: str(t.rating, D.trust.rating),
      badges: strings(t.badges, D.trust.badges),
    },
    stories: {
      ...heading(st, D.stories),
      subtitle: opt(st.subtitle, D.stories.subtitle),
      items: list(st.items, D.stories.items, (r) => media(r), (m) => !!(m.image || m.video)),
      features: list(st.features, D.stories.features, feature, hasText),
    },
    results: {
      ...heading(rs, D.results),
      ...cta(rs, D.results),
      items: list(
        rs.items,
        D.results.items,
        (r, d) => ({
          name: opt(r.name, ""),
          before: opt(r.before, ""),
          after: opt(r.after, ""),
          beforeLabel: opt(r.beforeLabel, d.beforeLabel),
          afterLabel: opt(r.afterLabel, d.afterLabel),
          lost: opt(r.lost, ""),
          detail: opt(r.detail, ""),
          quote: opt(r.quote, ""),
        }),
        (r) => !!(r.name.trim() || r.quote.trim()),
      ),
    },
    expertise: {
      ...heading(ex, D.expertise),
      body: opt(ex.body, D.expertise.body),
      leadName: opt(ex.leadName, D.expertise.leadName),
      leadRole: opt(ex.leadRole, D.expertise.leadRole),
      linkLabel: opt(ex.linkLabel, D.expertise.linkLabel),
      linkHref: str(ex.linkHref, D.expertise.linkHref),
    },
    steps: {
      ...heading(sp, D.steps),
      ...cta(sp, D.steps),
      subtitle: opt(sp.subtitle, D.steps.subtitle),
      items: list(
        sp.items,
        D.steps.items,
        (r) => ({ title: opt(r.title, ""), body: opt(r.body, ""), image: opt(r.image, "") }),
        hasText,
      ),
    },
    journey: journeyOf(jn, D.journey),
    reviews: {
      ...heading(rv, D.reviews),
      ...cta(rv, D.reviews),
      rating: str(rv.rating, D.reviews.rating),
      items: list(
        rv.items,
        D.reviews.items,
        (r) => ({ tag: opt(r.tag, ""), title: opt(r.title, ""), quote: opt(r.quote, ""), name: opt(r.name, "") }),
        (r) => !!(r.title.trim() || r.quote.trim()),
      ),
    },
    faq: {
      ...heading(fq, D.faq),
      items: list(fq.items, D.faq.items, (r) => ({ q: opt(r.q, ""), a: opt(r.a, "") }), (f) => !!f.q.trim()),
    },
    final: {
      ...heading(fn, D.final),
      ...cta(fn, D.final),
      subtitle: opt(fn.subtitle, D.final.subtitle),
      mobileCtaLabel: opt(fn.mobileCtaLabel, D.final.mobileCtaLabel),
      disclaimer: opt(fn.disclaimer, D.final.disclaimer),
      image: str(fn.image, D.final.image),
      imageAlt: opt(fn.imageAlt, D.final.imageAlt),
      benefits: list(fn.benefits, D.final.benefits, feature, hasText),
    },
    styles: mergeStyles(s.styles, LANDER_STYLE_KEYS),
  };
}
