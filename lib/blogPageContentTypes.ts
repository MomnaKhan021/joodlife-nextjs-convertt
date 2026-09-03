/**
 * Shape, shipped copy and validation for the blog listing page at /blogs.
 *
 * Only the page's own furniture lives here — the hero, the section heading,
 * the newsletter block and the closing banner. The articles themselves are
 * the Posts collection and are edited in /cms/blogs.
 *
 * Client-safe (no `server-only`, no Payload import) so the /cms editor can
 * import it. `lib/blogPageContent.ts` is the server-side reader.
 */

export type BlogHero = {
  title: string;
  titleAccent: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  imageAlt: string;
};

export type BlogListIntro = {
  heading: string;
  body: string;
};

export type BlogNewsletter = {
  heading: string;
  headingAccent: string;
  /** The bold line above the body copy. */
  kicker: string;
  body: string;
  placeholder: string;
  submitLabel: string;
  image: string;
  imageAlt: string;
};

export type BlogCta = {
  /** Rendered across two lines, split on the newline. */
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  imageAlt: string;
};

export type BlogPageContent = {
  hero: BlogHero;
  list: BlogListIntro;
  newsletter: BlogNewsletter;
  cta: BlogCta;
};

const LIBRARY_BLURB =
  "Explore expert tips and proven advice to support your weight loss and wellbeing goals. Learn how to create a healthier lifestyle that truly lasts.";

export const BLOG_PAGE_DEFAULT: BlogPageContent = {
  hero: {
    title: "Jood wellness",
    titleAccent: "library",
    body: LIBRARY_BLURB,
    ctaLabel: "Am I eligible?",
    ctaHref: "/consultation",
    image: "/assets/figma/blog/hero.png",
    imageAlt: "A runner training outdoors at golden hour",
  },
  list: {
    heading: "Recent blog posts",
    body: LIBRARY_BLURB,
  },
  newsletter: {
    heading: "Stay updated with results",
    headingAccent: "and expert insights",
    kicker: "Subscribe for a newsletter",
    body: "Get expert advice, treatment updates, and inspiring transformation stories sent to your inbox.",
    placeholder: "Your email here",
    submitLabel: "Submit",
    image: "/assets/figma/blog/newsletter.png",
    imageAlt: "A woman checking her phone in a bright kitchen",
  },
  cta: {
    title: "Feel Better.\nStart Treatment Today",
    body: "Customised care starts here",
    ctaLabel: "Get started",
    ctaHref: "/consultation",
    image: "/assets/figma/blog/cta-banner.png",
    imageAlt: "A woman relaxing at home",
  },
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

/**
 * Merge a stored global over the shipped copy, field by field, so a
 * half-filled global still renders a complete page.
 *
 * Button labels are the one place "" is honoured rather than replaced —
 * emptying one hides the button, which is a plausible thing to want.
 */
export function mergeBlogPage(stored: unknown): BlogPageContent {
  const d = obj(stored);
  const base = BLOG_PAGE_DEFAULT;

  const h = obj(d.hero);
  const l = obj(d.list);
  const n = obj(d.newsletter);
  const c = obj(d.cta);

  return {
    hero: {
      title: str(h.title, base.hero.title),
      titleAccent: str(h.titleAccent, base.hero.titleAccent),
      body: str(h.body, base.hero.body),
      ctaLabel:
        typeof h.ctaLabel === "string" ? h.ctaLabel : base.hero.ctaLabel,
      ctaHref: str(h.ctaHref, base.hero.ctaHref),
      image: str(h.image, base.hero.image),
      imageAlt: altStr(h.imageAlt, base.hero.imageAlt),
    },
    list: {
      heading: str(l.heading, base.list.heading),
      body: str(l.body, base.list.body),
    },
    newsletter: {
      heading: str(n.heading, base.newsletter.heading),
      headingAccent: str(n.headingAccent, base.newsletter.headingAccent),
      kicker: str(n.kicker, base.newsletter.kicker),
      body: str(n.body, base.newsletter.body),
      placeholder: str(n.placeholder, base.newsletter.placeholder),
      submitLabel: str(n.submitLabel, base.newsletter.submitLabel),
      image: str(n.image, base.newsletter.image),
      imageAlt: altStr(n.imageAlt, base.newsletter.imageAlt),
    },
    cta: {
      title: str(c.title, base.cta.title),
      body: str(c.body, base.cta.body),
      ctaLabel: typeof c.ctaLabel === "string" ? c.ctaLabel : base.cta.ctaLabel,
      ctaHref: str(c.ctaHref, base.cta.ctaHref),
      image: str(c.image, base.cta.image),
      imageAlt: altStr(c.imageAlt, base.cta.imageAlt),
    },
  };
}
