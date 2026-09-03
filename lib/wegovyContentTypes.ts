/**
 * Shape, shipped copy and validation for the Wegovy Pills page at
 * /wegovy-pills — eleven sections, in the order a reader meets them.
 *
 * Client-safe (no `server-only`, no Payload import) so the /cms editor and
 * the page's client components can import it. `lib/wegovyContent.ts` is the
 * server-side reader.
 *
 * Much of this copy is regulated: efficacy figures, MHRA status, dosing and
 * pricing, and the safety notice. The editor warns about that; this file
 * only guarantees that an empty global renders the page exactly as it ships.
 */

/* ── shared shapes ──────────────────────────────────────── */

export type Cta = { label: string; href: string };

/** Icon keys for the trust marquee — the drawings live in UspBar.tsx. */
export const USP_ICONS = [
  "delivery",
  "medication",
  "cancel",
  "support",
  "customers",
] as const;
export type UspIcon = (typeof USP_ICONS)[number];

export type UspItem = { label: string; icon: UspIcon };

export type ExplainerCard = { title: string; body: string; image: string };

export type ComparisonRow = { label: string; mark: "check" | "minus" | "none" };

export type Dose = {
  mg: string;
  label: string;
  days: string;
  price: string;
  /** Shows the "Start Here" flag. */
  start: boolean;
};

export type Faq = { q: string; a: string };

/* ── per-section shapes ─────────────────────────────────── */

export type WegovyAnnouncement = { text: string };

export type WegovyHero = {
  reviewsLabel: string;
  title: string;
  titleAccent: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  imageAlt: string;
  stats: string[];
};

export type WegovyUspBar = { items: UspItem[] };

export type WegovyWhatIsPill = {
  heading: string;
  headingAccent: string;
  kicker: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  cards: ExplainerCard[];
};

export type WegovyComparison = {
  heading: string;
  headingAccent: string;
  body: string;
  pillTitle: string;
  penTitle: string;
  pillRows: ComparisonRow[];
  penRows: ComparisonRow[];
  ctaLabel: string;
  ctaHref: string;
};

export type WegovyHowItWorks = {
  heading: string;
  headingAccent: string;
  intro: string;
  /** Exactly four, one per corner. Newlines become line breaks. */
  callouts: string[];
  body: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  image: string;
};

export type WegovyRealResults = {
  heading: string;
  headingAccent: string;
  statPrefix: string;
  statValue: number;
  statSuffix: string;
  statCaption: string;
  studyTitle: string;
  studyBody: string;
  panelImage: string;
  photo: string;
  photoAlt: string;
  overlayTitle: string;
  overlayBody: string;
};

export type WegovyDosing = {
  heading: string;
  headingAccent: string;
  body: string;
  image: string;
  imageAlt: string;
  startBadge: string;
  doses: Dose[];
};

export type WegovyWhyChoose = {
  heading: string;
  headingAccent: string;
  benefits: string[];
  safetyTitle: string;
  safetyBody: string;
  image: string;
  imageAlt: string;
};

export type WegovyFaqContent = {
  heading: string;
  headingAccent: string;
  items: Faq[];
};

export type WegovyFinalCta = {
  heading: string;
  headingAccent: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  imageAlt: string;
  disclaimer: string;
};

export type WegovyContent = {
  announcement: WegovyAnnouncement;
  hero: WegovyHero;
  uspBar: WegovyUspBar;
  whatIsPill: WegovyWhatIsPill;
  comparison: WegovyComparison;
  howItWorks: WegovyHowItWorks;
  realResults: WegovyRealResults;
  dosing: WegovyDosing;
  whyChoose: WegovyWhyChoose;
  faq: WegovyFaqContent;
  finalCta: WegovyFinalCta;
};

/* ── shipped copy ───────────────────────────────────────── */

const ASSESS = "/consultation?product=weight-loss";

export const WEGOVY_DEFAULT: WegovyContent = {
  announcement: { text: "New Wegovy Pills treatment in the UK" },

  hero: {
    reviewsLabel: "4.4 (50+) Reviews",
    title: "A New Era of Weight Loss.",
    titleAccent: "Introducing the Wegovy Tablet.",
    body: "A once-daily prescription treatment for weight loss with personalised clinician-led care. The same trusted active ingredient, now without weekly injections.",
    ctaLabel: "Check Your Eligibility",
    ctaHref: ASSESS,
    image: "/assets/wegovy/hero.png",
    imageAlt: "Woman smiling outdoors holding a glass of water",
    stats: [
      "Average weight loss of up to 16.6% at 64 weeks*",
      "MHRA-approved in the UK",
      "Once-daily oral semaglutide",
    ],
  },

  uspBar: {
    items: [
      { label: "free next-day delivery", icon: "delivery" },
      { label: "clinically proven medication", icon: "medication" },
      { label: "Cancel anytime subscription", icon: "cancel" },
      { label: "Medical support", icon: "support" },
      { label: "Trusted by 100k UK customers", icon: "customers" },
    ],
  },

  whatIsPill: {
    heading: "What is the",
    headingAccent: "Wegovy Tablet?",
    kicker: "Daily oral weight-loss treatment.",
    body: "The Wegovy tablet contains semaglutide, a GLP-1 receptor agonist that works with your body’s natural appetite signals to help reduce hunger, increase fullness and support sustainable weight loss alongside healthy lifestyle changes.",
    ctaLabel: "Start Your Assessment",
    ctaHref: ASSESS,
    cards: [
      {
        title: "Daily Treatment",
        body: "A convenient once-daily tablet for people looking to lose weight without weekly injections.",
        image: "/assets/wegovy/what-pills.png",
      },
      {
        title: "Advanced Tablet Technology",
        body: "Special absorption technology allows semaglutide to be absorbed effectively as a tablet.",
        image: "/assets/wegovy/what-snac.png",
      },
      {
        title: "Clinically Studied",
        body: "Clinical trials have shown meaningful weight loss when combined with diet and physical activity.*",
        image: "/assets/wegovy/what-man.png",
      },
    ],
  },

  comparison: {
    heading: "Wegovy Tablet vs",
    headingAccent: "Wegovy Injection",
    body: "Both treatments contain semaglutide and are prescribed following a clinical assessment. The best option depends on your lifestyle, preferences and clinical suitability.",
    pillTitle: "Wegovy Tablet",
    penTitle: "Wegovy Injection",
    pillRows: [
      { label: "Once daily", mark: "none" },
      { label: "Oral tablet", mark: "check" },
      { label: "Semaglutide", mark: "check" },
      { label: "Clinically studied", mark: "check" },
      { label: "Needle-free", mark: "check" },
    ],
    penRows: [
      { label: "Once weekly", mark: "none" },
      { label: "Injection pen", mark: "check" },
      { label: "Semaglutide", mark: "check" },
      { label: "Clinically studied", mark: "check" },
      { label: "Weekly injection", mark: "minus" },
    ],
    ctaLabel: "Compare Treatments",
    ctaHref: ASSESS,
  },

  howItWorks: {
    heading: "How the",
    headingAccent: "Wegovy Tablet Works",
    intro:
      "The Wegovy tablet contains semaglutide, a GLP-1 receptor agonist that works with your body’s natural appetite hormones to support weight loss. Helps to:",
    callouts: [
      "Reduce food\ncravings",
      "Increase feelings\nof fullness",
      "Slow stomach\nemptying",
      "Help regulate\nappetite",
    ],
    body: "Like the Wegovy injection, the tablet contains semaglutide. The difference is simply how it’s taken — one as a daily tablet and the other as a once-weekly injection.",
    ctaLabel: "Check Your Eligibility",
    ctaHref: ASSESS,
    secondaryLabel: "Learn More",
    secondaryHref: "#faq",
    image: "/assets/wegovy/how-pill.png",
  },

  realResults: {
    heading: "Real Results with the",
    headingAccent: "Wegovy Tablet",
    statPrefix: "Up to",
    statValue: 16.6,
    statSuffix: "%",
    statCaption: "average body weight loss at 64 weeks*",
    studyTitle: "Clinical Study",
    studyBody:
      "Around 1 in 4 participants lost 20% or more of their body weight when combined with lifestyle changes.*",
    panelImage: "/assets/wegovy/why-runner.png",
    photo: "/assets/wegovy/results-woman.png",
    photoAlt: "Women walking outdoors in a sunlit field",
    overlayTitle: "Beyond Weight Loss",
    overlayBody:
      "The Wegovy tablet contains the same active ingredient as the Wegovy injection and may help improve appetite control while supporting long-term weight management alongside healthy lifestyle changes.",
  },

  dosing: {
    heading: "Wegovy Tablet",
    headingAccent: "Dosing & Pricing",
    body: "Simple daily dosing with straightforward pricing. Your clinician will recommend the most appropriate dose based on your stage of treatment.",
    image: "/assets/wegovy/dosing-hand.png",
    imageAlt: "Hand holding a Wegovy pill",
    startBadge: "Start Here",
    doses: [
      {
        mg: "1.5 mg",
        label: "Starter Dose",
        days: "Days 1–30",
        price: "From £149/month",
        start: true,
      },
      {
        mg: "4 mg",
        label: "Dose Increase",
        days: "Days 31–60",
        price: "From £149/month",
        start: false,
      },
      {
        mg: "9 mg",
        label: "Further Increase",
        days: "Available when clinically appropriate",
        price: "Price announced before launch",
        start: false,
      },
      {
        mg: "25 mg",
        label: "Maintenance Dose",
        days: "Available when clinically appropriate",
        price: "Price announced before launch",
        start: false,
      },
    ],
  },

  whyChoose: {
    heading: "Why Choose Jood Life for your",
    headingAccent: "Wegovy journey",
    benefits: [
      "MHRA-approved prescription treatment",
      "UK clinician review",
      "Ongoing support throughout treatment",
      "Fast, discreet UK delivery",
      "Regular progress check-ins",
      "Dedicated patient support",
    ],
    safetyTitle: "Important Safety Information",
    safetyBody:
      "The Wegovy tablet is not suitable for everyone. Before treatment, one of our UK clinicians will review your medical history to ensure it is appropriate for you. Please read the Patient Information Leaflet before starting treatment.",
    image: "/assets/wegovy/why-runner.png",
    imageAlt: "Man running outdoors",
  },

  faq: {
    heading: "Frequently asked",
    headingAccent: "questions",
    items: [
      {
        q: "What is the Wegovy Pill?",
        a: "The Wegovy Pill is a once-daily oral form of semaglutide — the same GLP-1 active ingredient as the Wegovy injection — used to support clinically guided weight loss.",
      },
      {
        q: "How effective is the oral form vs. the injection?",
        a: "In manufacturer studies, adults taking the Wegovy Pill lost an average of ~14% of body weight at 64 weeks. Both the pill and the pen support meaningful weight loss; your prescriber will help you choose the right option.",
      },
      {
        q: "Do I need to take it on an empty stomach?",
        a: "Yes. Oral semaglutide is taken on an empty stomach with a small sip of water, at least 30 minutes before your first food, drink or other medicines of the day.",
      },
      {
        q: "What are the side effects?",
        a: "The most common side effects are gastrointestinal — nausea, diarrhoea, vomiting and constipation — and usually ease as your body adjusts. Our clinical team supports you throughout.",
      },
      {
        q: "Can I switch between pill and injectable?",
        a: "In many cases, yes. Switching is a clinical decision made with your prescriber based on your response, tolerance and preference.",
      },
      {
        q: "Does insurance cover the Wegovy Pill?",
        a: "Jood is a private weight-loss service, so treatment is paid for directly. Transparent monthly pricing is shown in the dosing section above.",
      },
    ],
  },

  finalCta: {
    heading: "Ready to start your",
    headingAccent: "journey?",
    body: "Complete a short online assessment to see if the Wegovy tablet is suitable for you.",
    ctaLabel: "Check Your Eligibility",
    ctaHref: ASSESS,
    image: "/assets/wegovy/cta-woman.png",
    imageAlt: "Woman looking up, smiling",
    disclaimer:
      "*Weight-loss outcomes vary between individuals. Figures are based on published clinical trial data for semaglutide alongside reduced-calorie diet and increased physical activity. Treatment is subject to clinical assessment and is only prescribed where appropriate.",
  },
};

/* ── validation ─────────────────────────────────────────── */

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}

/** Button labels and alt text may legitimately be emptied, so "" is kept. */
function optStr(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

function num(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

/** A list of plain strings; blanks are dropped and an empty list falls back. */
function strList(v: unknown, fallback: string[]): string[] {
  if (!Array.isArray(v)) return fallback;
  const out = v.filter((x): x is string => typeof x === "string" && x.trim() !== "");
  return out.length ? out : fallback;
}

/** Map rows through `make`, drop the ones `keep` rejects, fall back if empty. */
function rows<T>(
  v: unknown,
  make: (r: Record<string, unknown>, i: number) => T,
  keep: (r: T) => boolean,
  fallback: T[],
): T[] {
  if (!Array.isArray(v)) return fallback;
  const out = v.map(obj).map(make).filter(keep);
  return out.length ? out : fallback;
}

export function mergeWegovy(stored: unknown): WegovyContent {
  const d = obj(stored);
  const B = WEGOVY_DEFAULT;

  const an = obj(d.announcement);
  const he = obj(d.hero);
  const us = obj(d.uspBar);
  const wh = obj(d.whatIsPill);
  const co = obj(d.comparison);
  const hi = obj(d.howItWorks);
  const rr = obj(d.realResults);
  const dz = obj(d.dosing);
  const wc = obj(d.whyChoose);
  const fq = obj(d.faq);
  const fc = obj(d.finalCta);

  const comparisonRows = (v: unknown, fallback: ComparisonRow[]) =>
    rows<ComparisonRow>(
      v,
      (r) => ({
        label: String(r.label ?? ""),
        mark:
          r.mark === "check" || r.mark === "minus" || r.mark === "none"
            ? r.mark
            : "none",
      }),
      (r) => r.label.trim() !== "",
      fallback,
    );

  return {
    announcement: { text: optStr(an.text, B.announcement.text) },

    hero: {
      reviewsLabel: str(he.reviewsLabel, B.hero.reviewsLabel),
      title: str(he.title, B.hero.title),
      titleAccent: str(he.titleAccent, B.hero.titleAccent),
      body: str(he.body, B.hero.body),
      ctaLabel: optStr(he.ctaLabel, B.hero.ctaLabel),
      ctaHref: str(he.ctaHref, B.hero.ctaHref),
      image: str(he.image, B.hero.image),
      imageAlt: optStr(he.imageAlt, B.hero.imageAlt),
      stats: strList(he.stats, B.hero.stats),
    },

    uspBar: {
      items: rows<UspItem>(
        us.items,
        (r) => ({
          label: String(r.label ?? ""),
          icon: (USP_ICONS as readonly string[]).includes(String(r.icon))
            ? (r.icon as UspIcon)
            : "delivery",
        }),
        (r) => r.label.trim() !== "",
        B.uspBar.items,
      ),
    },

    whatIsPill: {
      heading: str(wh.heading, B.whatIsPill.heading),
      headingAccent: str(wh.headingAccent, B.whatIsPill.headingAccent),
      kicker: str(wh.kicker, B.whatIsPill.kicker),
      body: str(wh.body, B.whatIsPill.body),
      ctaLabel: optStr(wh.ctaLabel, B.whatIsPill.ctaLabel),
      ctaHref: str(wh.ctaHref, B.whatIsPill.ctaHref),
      cards: rows<ExplainerCard>(
        wh.cards,
        (r) => ({
          title: String(r.title ?? ""),
          body: String(r.body ?? ""),
          image: String(r.image ?? ""),
        }),
        (r) => r.title.trim() !== "",
        B.whatIsPill.cards,
      ),
    },

    comparison: {
      heading: str(co.heading, B.comparison.heading),
      headingAccent: str(co.headingAccent, B.comparison.headingAccent),
      body: str(co.body, B.comparison.body),
      pillTitle: str(co.pillTitle, B.comparison.pillTitle),
      penTitle: str(co.penTitle, B.comparison.penTitle),
      pillRows: comparisonRows(co.pillRows, B.comparison.pillRows),
      penRows: comparisonRows(co.penRows, B.comparison.penRows),
      ctaLabel: optStr(co.ctaLabel, B.comparison.ctaLabel),
      ctaHref: str(co.ctaHref, B.comparison.ctaHref),
    },

    howItWorks: {
      heading: str(hi.heading, B.howItWorks.heading),
      headingAccent: str(hi.headingAccent, B.howItWorks.headingAccent),
      intro: str(hi.intro, B.howItWorks.intro),
      // The four callouts are positioned individually around the tablet, so
      // the list is padded or trimmed to exactly four rather than repeated.
      callouts: Array.from({ length: 4 }, (_, i) => {
        const v = Array.isArray(hi.callouts) ? hi.callouts[i] : undefined;
        return typeof v === "string" && v.trim() ? v : B.howItWorks.callouts[i];
      }),
      body: str(hi.body, B.howItWorks.body),
      ctaLabel: optStr(hi.ctaLabel, B.howItWorks.ctaLabel),
      ctaHref: str(hi.ctaHref, B.howItWorks.ctaHref),
      secondaryLabel: optStr(hi.secondaryLabel, B.howItWorks.secondaryLabel),
      secondaryHref: str(hi.secondaryHref, B.howItWorks.secondaryHref),
      image: str(hi.image, B.howItWorks.image),
    },

    realResults: {
      heading: str(rr.heading, B.realResults.heading),
      headingAccent: str(rr.headingAccent, B.realResults.headingAccent),
      statPrefix: str(rr.statPrefix, B.realResults.statPrefix),
      statValue: num(rr.statValue, B.realResults.statValue),
      statSuffix: optStr(rr.statSuffix, B.realResults.statSuffix),
      statCaption: str(rr.statCaption, B.realResults.statCaption),
      studyTitle: str(rr.studyTitle, B.realResults.studyTitle),
      studyBody: str(rr.studyBody, B.realResults.studyBody),
      panelImage: str(rr.panelImage, B.realResults.panelImage),
      photo: str(rr.photo, B.realResults.photo),
      photoAlt: optStr(rr.photoAlt, B.realResults.photoAlt),
      overlayTitle: str(rr.overlayTitle, B.realResults.overlayTitle),
      overlayBody: str(rr.overlayBody, B.realResults.overlayBody),
    },

    dosing: {
      heading: str(dz.heading, B.dosing.heading),
      headingAccent: str(dz.headingAccent, B.dosing.headingAccent),
      body: str(dz.body, B.dosing.body),
      image: str(dz.image, B.dosing.image),
      imageAlt: optStr(dz.imageAlt, B.dosing.imageAlt),
      startBadge: str(dz.startBadge, B.dosing.startBadge),
      doses: rows<Dose>(
        dz.doses,
        (r) => ({
          mg: String(r.mg ?? ""),
          label: String(r.label ?? ""),
          days: String(r.days ?? ""),
          price: String(r.price ?? ""),
          start: r.start === true,
        }),
        (r) => r.mg.trim() !== "",
        B.dosing.doses,
      ),
    },

    whyChoose: {
      heading: str(wc.heading, B.whyChoose.heading),
      headingAccent: str(wc.headingAccent, B.whyChoose.headingAccent),
      benefits: strList(wc.benefits, B.whyChoose.benefits),
      safetyTitle: str(wc.safetyTitle, B.whyChoose.safetyTitle),
      safetyBody: str(wc.safetyBody, B.whyChoose.safetyBody),
      image: str(wc.image, B.whyChoose.image),
      imageAlt: optStr(wc.imageAlt, B.whyChoose.imageAlt),
    },

    faq: {
      heading: str(fq.heading, B.faq.heading),
      headingAccent: str(fq.headingAccent, B.faq.headingAccent),
      items: rows<Faq>(
        fq.items,
        (r) => ({ q: String(r.q ?? ""), a: String(r.a ?? "") }),
        (r) => r.q.trim() !== "" && r.a.trim() !== "",
        B.faq.items,
      ),
    },

    finalCta: {
      heading: str(fc.heading, B.finalCta.heading),
      headingAccent: str(fc.headingAccent, B.finalCta.headingAccent),
      body: str(fc.body, B.finalCta.body),
      ctaLabel: optStr(fc.ctaLabel, B.finalCta.ctaLabel),
      ctaHref: str(fc.ctaHref, B.finalCta.ctaHref),
      image: str(fc.image, B.finalCta.image),
      imageAlt: optStr(fc.imageAlt, B.finalCta.imageAlt),
      // The disclaimer carries the asterisks the efficacy figures depend on,
      // so it falls back rather than being allowed to vanish.
      disclaimer: str(fc.disclaimer, B.finalCta.disclaimer),
    },
  };
}
