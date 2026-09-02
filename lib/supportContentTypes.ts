/**
 * Shape, shipped copy and validation for the Support page.
 *
 * Client-safe (no `server-only`, no Payload import) so the /cms editor can
 * import it. `lib/supportContent.ts` is the server-side reader.
 *
 * Every field falls back to the shipped value, so an empty global renders
 * /support exactly as it does today.
 */

export type HelpPoint = { title: string; body: string };

export type SupportHero = {
  title: string;
  titleAccent: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  imageAlt: string;
  /** The little pill above the quick-help list. */
  cardPill: string;
  helpPoints: HelpPoint[];
};

export type FaqItem = { q: string; a: string };

export type FaqSection = {
  /** Filter-pill / anchor id. Kept stable so deep links keep working. */
  id: string;
  /** Short pill label, e.g. "About Jood". */
  pill: string;
  /** Heading, with the accent rendered in serif italic after it. */
  headStart: string;
  headAccent: string;
  items: FaqItem[];
};

export type SupportFaqContent = {
  /** Label on the leading "show everything" pill. */
  allLabel: string;
  /** The button beside each section heading. Shared by all sections. */
  ctaLabel: string;
  ctaHref: string;
  sections: FaqSection[];
};

export type StoryImage = { src: string; alt: string };

export type SupportStories = {
  heading: string;
  headingAccent: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  items: StoryImage[];
};

export type SupportContent = {
  hero: SupportHero;
  faq: SupportFaqContent;
  stories: SupportStories;
};

const WHATSAPP = "https://wa.me/447756099075";

export const SUPPORT_HERO_DEFAULT: SupportHero = {
  title: "Get the support",
  titleAccent: "you need",
  body: "Can’t find what you’re looking for? Get in touch and a member of our team will be happy to assist you.",
  ctaLabel: "Get In Touch",
  ctaHref: WHATSAPP,
  image: "/assets/figma/support/hero.png",
  imageAlt: "A Jood patient checking their treatment updates on their phone",
  cardPill: "How we support you",
  helpPoints: [
    {
      title: "Ongoing clinical support",
      body: "Access expert clinicians and medical advice.",
    },
    {
      title: "Pause or cancel any time",
      body: "You're always in control of your treatment.",
    },
    {
      title: "Free, discreet delivery",
      body: "No names, no logos, no delivery fee.",
    },
  ],
};

export const SUPPORT_FAQ_DEFAULT: SupportFaqContent = {
  allLabel: "All",
  ctaLabel: "Get In Touch",
  ctaHref: WHATSAPP,
  sections: [
    {
      id: "about-jood",
      pill: "About Jood",
      headStart: "About",
      headAccent: "Jood",
      items: [
        {
          q: "What is Jood?",
          a: "Jood is a fully remote private weight-loss clinic providing clinically guided care through licensed UK prescribers. Our treatments are dispensed from a GPhC-registered pharmacy and delivered discreetly across the UK.",
        },
        {
          q: "Who is behind Jood?",
          a: "Jood is operated by Jood Pharmacy, a GPhC-registered pharmacy. Consultations and prescribing are overseen by UK-registered prescribers and a superintendent pharmacist, so every part of your treatment is clinically supervised.",
        },
        {
          q: "Is Jood a legitimate clinic?",
          a: "Yes. Jood Pharmacy is registered with the General Pharmaceutical Council (9012990) and all medicines are dispensed and delivered in line with GPhC and MHRA guidance.",
        },
      ],
    },
    {
      id: "medication-treatment",
      pill: "Medication & Treatment",
      headStart: "Medication and",
      headAccent: "treatment",
      items: [
        {
          q: "What treatments do you offer?",
          a: "Jood provides access to licensed GLP-1 medications, including Mounjaro (tirzepatide), the Wegovy injection and the Wegovy Pill (oral semaglutide), prescribed only when clinically appropriate. All treatments are reviewed and dispensed safely under prescriber supervision.",
        },
        {
          q: "How do these medications work?",
          a: "GLP-1 medications mimic a hormone your body releases after eating. They help regulate appetite, slow digestion and reduce cravings, making it easier to eat less and lose weight steadily alongside diet and lifestyle changes.",
        },
        {
          q: "Are these medications safe?",
          a: "The medications we prescribe are MHRA-licensed and are only supplied after a UK-registered prescriber has reviewed your full health assessment. Our clinical team monitors your progress and is available if you have any concerns.",
        },
        {
          q: "What if I experience side effects?",
          a: "Mild side effects such as nausea usually ease as your body adjusts. If symptoms persist or worry you, contact our clinical team and they will review your dose and advise on the safest next step.",
        },
        {
          q: "Can I switch between medications?",
          a: "Yes, if your prescriber agrees it is clinically appropriate. We will help review your progress and recommend the best next step for you.",
        },
      ],
    },
    {
      id: "consultations-eligibility",
      pill: "Consultations & Eligibility",
      headStart: "Consultations and",
      headAccent: "eligibility",
      items: [
        {
          q: "Who is eligible for treatment?",
          a: "You may be eligible if your BMI is 30 or higher, or 27 or higher with certain weight-related health conditions. Eligibility is confirmed after completing your online consultation with a UK-licensed prescriber.",
        },
        {
          q: "Do I need a GP referral?",
          a: "No referral is needed. You complete a secure online consultation and, where appropriate, we may contact your GP to help keep your wider care safe and joined up.",
        },
        {
          q: "How does the consultation work?",
          a: "You answer a short set of medical questions online. A UK-registered prescriber reviews your responses to confirm whether treatment is suitable before anything is prescribed or dispensed.",
        },
        {
          q: "How long does approval take?",
          a: "Most consultations are reviewed within one working day. If the prescriber needs more information, they will get in touch before approving your treatment.",
        },
      ],
    },
    {
      id: "delivery-payments",
      pill: "Delivery & Payments",
      headStart: "Delivery and",
      headAccent: "payments",
      items: [
        {
          q: "How will my medication be delivered?",
          a: "All parcels are sent via DPD, arriving in plain, unbranded packaging for complete privacy. You'll receive live tracking updates once your order is shipped.",
        },
        {
          q: "Is delivery free?",
          a: "Yes. Free, discreet delivery is included with your treatment — no names, no logos and no delivery fee.",
        },
        {
          q: "How much does treatment cost?",
          a: "Pricing depends on the medication and dose your prescriber recommends. You'll see the full cost clearly before you check out, with no hidden fees.",
        },
        {
          q: "Can I cancel or pause my plan?",
          a: "Yes — you're always in control of your treatment. You can pause or cancel at any time from your account, with no cancellation charges.",
        },
        {
          q: "What payment methods do you accept?",
          a: "We accept all major debit and credit cards, as well as Apple Pay and Google Pay. All payments are processed securely.",
        },
      ],
    },
    {
      id: "support-follow-up",
      pill: "Support & Follow-up",
      headStart: "Support and",
      headAccent: "follow-up",
      items: [
        {
          q: "What kind of support will I receive?",
          a: "Your care doesn't stop at delivery. You'll receive ongoing access to Jood clinicians and health coaches for check-ins, motivation and progress tracking.",
        },
        {
          q: "Can I speak to someone directly?",
          a: "Yes. You can message our care team through your account or get in touch by phone and email, and a clinician will respond to any clinical questions.",
        },
        {
          q: "How do I track my progress?",
          a: "You can log your weight and check-ins through your account. Your care team reviews your progress and adjusts your plan where clinically appropriate.",
        },
        {
          q: "What if I miss an injection?",
          a: "Don't worry — contact our clinical team and they'll advise you on the safest way to get back on schedule. It's never a problem we can't solve.",
        },
        {
          q: "Can I continue treatment long-term?",
          a: "Yes. Many patients continue treatment for as long as it remains clinically beneficial. Your prescriber will review this with you at regular intervals.",
        },
        {
          q: "How is my personal information protected?",
          a: "Your data is handled in line with UK GDPR and stored securely. We only share information where clinically necessary and with your knowledge.",
        },
      ],
    },
  ],
};

export const SUPPORT_STORIES_DEFAULT: SupportStories = {
  heading: "Thousands of success stories.",
  headingAccent: "Support at every step.",
  body: "Our dedicated care team provides ongoing guidance, progress monitoring, and personalised adjustments to ensure every patient achieves lasting results.",
  ctaLabel: "Get started",
  ctaHref: "/consultation",
  items: [
    { src: "/assets/figma/support/story-1.png", alt: "Jood patient success story" },
    { src: "/assets/figma/support/story-2.png", alt: "Jood patient success story" },
    { src: "/assets/figma/support/story-3.png", alt: "Jood patient success story" },
    { src: "/assets/figma/support/story-4.png", alt: "Jood patient success story" },
  ],
};

export const SUPPORT_DEFAULT: SupportContent = {
  hero: SUPPORT_HERO_DEFAULT,
  faq: SUPPORT_FAQ_DEFAULT,
  stories: SUPPORT_STORIES_DEFAULT,
};

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}

/** An alt attribute may legitimately be empty (decorative), so "" is kept. */
function altStr(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

/** Keep only rows where both halves survived; an empty list falls back. */
function pairs<T>(
  value: unknown,
  keys: [keyof T & string, keyof T & string],
  fallback: T[],
): T[] {
  if (!Array.isArray(value)) return fallback;
  const [a, b] = keys;
  const out = value
    .map(obj)
    .map((r) => ({ [a]: String(r[a] ?? ""), [b]: String(r[b] ?? "") }) as T)
    .filter(
      (r) =>
        String(r[a]).trim() !== "" &&
        String(r[b]).trim() !== "",
    );
  return out.length ? out : fallback;
}

function toHero(value: unknown): SupportHero {
  const d = obj(value);
  const base = SUPPORT_HERO_DEFAULT;
  return {
    title: str(d.title, base.title),
    titleAccent: str(d.titleAccent, base.titleAccent),
    body: str(d.body, base.body),
    ctaLabel: str(d.ctaLabel, base.ctaLabel),
    ctaHref: str(d.ctaHref, base.ctaHref),
    image: str(d.image, base.image),
    imageAlt: altStr(d.imageAlt, base.imageAlt),
    cardPill: str(d.cardPill, base.cardPill),
    helpPoints: pairs<HelpPoint>(d.helpPoints, ["title", "body"], base.helpPoints),
  };
}

/**
 * A section keeps its id so the filter pills and #anchors stay stable; a new
 * section with no id gets one derived from its pill label.
 */
function toFaqSections(value: unknown): FaqSection[] {
  if (!Array.isArray(value)) return SUPPORT_FAQ_DEFAULT.sections;
  const out = value
    .map(obj)
    .map((s, i) => {
      const pill = String(s.pill ?? "");
      const id =
        str(s.id, "") ||
        pill
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") ||
        `section-${i + 1}`;
      return {
        id,
        pill,
        headStart: String(s.headStart ?? ""),
        headAccent: String(s.headAccent ?? ""),
        items: pairs<FaqItem>(s.items, ["q", "a"], []),
      };
    })
    .filter((s) => s.pill.trim() && s.items.length);
  return out.length ? out : SUPPORT_FAQ_DEFAULT.sections;
}

function toFaq(value: unknown): SupportFaqContent {
  const d = obj(value);
  const base = SUPPORT_FAQ_DEFAULT;
  return {
    allLabel: str(d.allLabel, base.allLabel),
    ctaLabel: str(d.ctaLabel, base.ctaLabel),
    ctaHref: str(d.ctaHref, base.ctaHref),
    sections: toFaqSections(d.sections),
  };
}

function toStories(value: unknown): SupportStories {
  const d = obj(value);
  const base = SUPPORT_STORIES_DEFAULT;
  const items = Array.isArray(d.items)
    ? d.items
        .map(obj)
        .map((r) => ({ src: String(r.src ?? ""), alt: altStr(r.alt, "") }))
        .filter((r) => r.src.trim())
    : [];
  return {
    heading: str(d.heading, base.heading),
    headingAccent: str(d.headingAccent, base.headingAccent),
    body: str(d.body, base.body),
    // The button may be emptied deliberately, so "" is honoured and hides it.
    ctaLabel: typeof d.ctaLabel === "string" ? d.ctaLabel : base.ctaLabel,
    ctaHref: str(d.ctaHref, base.ctaHref),
    items: items.length ? items : base.items,
  };
}

/**
 * Merge a stored global over the shipped copy, field by field, so a
 * half-filled global still renders a complete page.
 */
export function mergeSupport(stored: unknown): SupportContent {
  const d = obj(stored);
  return {
    hero: toHero(d.hero),
    faq: toFaq(d.faq),
    stories: toStories(d.stories),
  };
}
