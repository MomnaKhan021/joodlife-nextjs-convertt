/**
 * Single source of truth for the three care categories that the home
 * page acts as a gateway to. UI components (gateway hero, category
 * preview sections, sub-page heroes) all read from here so copy, routing
 * and theming stay in one place and never drift between surfaces.
 *
 * Routes use condition-based, SEO-friendly slugs:
 *   Weight Loss          → /weight-loss
 *   Men's Health (ED)    → /erectile-dysfunction
 *   Women's Health       → /period-delay
 */

export type CategoryTheme = {
  /** Solid brand hue for the section / accents. */
  base: string;
  /** Lighter companion used for gradients. */
  soft: string;
  /** Very light tint for chips / backgrounds. */
  tint: string;
  /** Foreground colour that reads on top of `base`. */
  onBase: string;
  /** Soft radial glow rendered behind the hero portrait (CSS background). */
  glow: string;
  /**
   * Exact Figma section background, recreated as a CSS `background` value:
   * a vertical gradient sampled pixel-exact from the rendered Figma section.
   * Fully responsive — no raster stretching/letterbox artifacts and no
   * decorative ray lines. Weight loss has none and uses the solid `base`.
   */
  sectionBg?: string;
  /**
   * Figma "sky → solid" hero treatment (the 2026 home-page ED section).
   * The portrait stands on a sky backdrop and dissolves into this solid
   * colour at the content-card line, via a blurred gradient band drawn over
   * the portrait — rather than the portrait showing through frosted cards.
   * Setting it switches CategoryPreview to that layout.
   */
  lowerBg?: string;
  /** Top colour of the blurred band that fades the portrait into `lowerBg`. */
  fadeFrom?: string;
};

export type CategoryKey = "weight-loss" | "erectile-dysfunction" | "period-delay";

export type Category = {
  key: CategoryKey;
  /** Route segment, e.g. "/weight-loss". */
  href: string;
  /**
   * Optional destination for the "Learn More" CTA on the preview section.
   * Defaults to `href` when unset (weight-loss points at the Wegovy pills page).
   */
  learnMoreHref?: string;
  /** Small label above the title on the gateway card. */
  eyebrow: string;
  /** Card title (kept short for the gateway grid). */
  cardTitle: string;
  /** Marketing title used on the preview section + sub-page hero. */
  title: string;
  /** Italicised serif accent that completes the title. */
  titleAccent: string;
  /** Optional label for the primary hero CTA (defaults to "Get Started"). */
  ctaLabel?: string;
  /** One-line supporting sentence. */
  blurb: string;
  /** Up to three short proof points. */
  bullets: string[];
  /** Cut-out portrait used on the gateway card. */
  cardImage: string;
  /** Larger portrait used on the preview section / hero. */
  heroImage: string;
  /** Accessible alt text for the imagery. */
  imageAlt: string;
  /**
   * Optional photographic backdrop covering the top of the hero, fading
   * into the section background (e.g. ED's cloud sky). Decorative only.
   */
  heroBackdrop?: string;
  /**
   * Colour the hero backdrop fades into at its lower edge. Should match the
   * section background at that vertical point so there's no visible band.
   * Defaults to `theme.base`.
   */
  heroBackdropFade?: string;
  /**
   * Optional transparent overlay of floating UI cards rendered *behind*
   * the hero portrait (e.g. PD's Cycle Window / Eligibility cards).
   * Decorative only.
   */
  heroCards?: string;
  /**
   * Optional scale factor applied to the hero portrait so a category can
   * present a more zoomed-in cut-out (e.g. ED's boy, per Figma) without
   * changing the shared layout box. Defaults to 1 (no zoom).
   */
  heroImageScale?: number;
  /**
   * Portrait for viewports below `md`. The Figma crops the ED cut-out
   * tighter on mobile, so it is a separate export rather than a scaled one.
   */
  heroImageMobile?: string;
  /** Exact Figma portrait box per breakpoint (px). Used by the sky layout. */
  heroImageBox?: {
    desktop: { w: number; h: number };
    mobile: { w: number; h: number };
  };
  /** Exact Figma title metrics per breakpoint (px). Used by the sky layout. */
  titleMetrics?: {
    desktop: { size: number; lineHeight: number; tracking: number };
    mobile: { size: number; lineHeight: number; tracking: number };
  };
  theme: CategoryTheme;
};

export const CATEGORIES: Record<CategoryKey, Category> = {
  "weight-loss": {
    key: "weight-loss",
    href: "/weight-loss",
    learnMoreHref: "/wegovy-pills",
    eyebrow: "Weight loss",
    cardTitle: "Weight loss,\nmade for you.",
    title: "Lose weight safely,",
    titleAccent: "with expert support",
    blurb:
      "Clinically guided GLP-1 treatment plans tailored to your body, with guidance for results that last.",
    bullets: [
      "Lose up to 27% body weight",
      "Plans tailored to you",
      "Guidance for lasting results",
    ],
    cardImage: "/assets/figma/hero-two-women-desktop.png",
    heroImage: "/assets/category/wl-hero.png",
    heroImageScale: 1.18,
    imageAlt: "A woman laughing after a successful weight-loss journey",
    theme: {
      base: "#142e2a",
      soft: "#2d544c",
      tint: "#d3dabe",
      onBase: "#ffffff",
      glow: "radial-gradient(closest-side, rgba(150,40,52,0.55), rgba(150,40,52,0))",
    },
  },
  "erectile-dysfunction": {
    key: "erectile-dysfunction",
    href: "/erectile-dysfunction",
    eyebrow: "Men's health",
    cardTitle: "Erectile dysfunction",
    // Home-page section copy — Figma "Home Page - 2026" Component 295/296.
    title: "Take control of erectile health",
    titleAccent: "safely and confidently",
    ctaLabel: "Get Started",
    blurb:
      "Take control of erectile health safely and discreetly. Clinically approved treatments are delivered to your door, helping you regain confidence and performance.",
    bullets: [
      "Clinically approved treatments",
      "Discreet, next-day delivery",
      "Regain confidence & performance",
    ],
    cardImage: "/assets/home/hero-ed-man.png",
    // Cut-outs exported from the Figma fill at its exact crop transforms:
    // desktop shows the figure to the waist (622×584); mobile crops tighter
    // and includes the full lower edge (376×428 of a 376×503 box).
    heroImage: "/assets/category/ed-man-d.webp",
    heroImageMobile: "/assets/category/ed-man-m.webp",
    heroImageBox: { desktop: { w: 622, h: 584 }, mobile: { w: 376, h: 428 } },
    // The Figma sky is a non-exportable fill; this is the section render with
    // the headline/portrait regions filled from the surrounding sky (both sit
    // under real content in the build).
    heroBackdrop: "/assets/category/ed-sky.jpg",
    titleMetrics: {
      desktop: { size: 48, lineHeight: 57, tracking: -2.14 },
      mobile: { size: 36, lineHeight: 39, tracking: -1 },
    },
    imageAlt: "Man giving a thumbs up, happy with his erectile-dysfunction treatment",
    theme: {
      base: "#1a8ec1",
      soft: "#4eabd2",
      tint: "#c7eeff",
      onBase: "#ffffff",
      glow: "radial-gradient(closest-side, rgba(255,255,255,0.22), rgba(255,255,255,0))",
      sectionBg:
        "linear-gradient(180deg, #2293c6 0%, #3ea4ce 28%, #5eb3d7 58%, #74bedd 100%)",
      // Figma: solid #5fb3d7 below the card line, with a #b5cfe0→#5fb3d7
      // band (layer blur 54 desktop / 16 mobile) dissolving the portrait.
      lowerBg: "#5fb3d7",
      fadeFrom: "#b5cfe0",
    },
  },
  "period-delay": {
    key: "period-delay",
    href: "/period-delay",
    eyebrow: "Women's health",
    cardTitle: "Period delay",
    title: "Delay Your Period",
    titleAccent: "On Your Schedule",
    ctaLabel: "Start Your Assessment",
    blurb:
      "Delay your period safely and discreetly when you need to. Whether you're travelling, attending a special event or planning ahead, our UK clinicians can assess whether norethisterone is appropriate for you.",
    bullets: [
      "Clinically approved Norethisterone",
      "Delay your period reliably",
      "Discreet delivery, your schedule",
    ],
    cardImage: "/assets/home/hero-pd-woman.png",
    heroImage: "/assets/category/period-hero.png",
    heroImageScale: 1.18,
    heroCards: "/assets/category/pd-cards.png",
    heroBackdrop: "/assets/category/pd-backdrop.png",
    heroBackdropFade: "#e3a6bb",
    imageAlt: "Woman holding a clock and calendar, planning her cycle",
    theme: {
      base: "#ec1f63",
      soft: "#e5abc0",
      tint: "#ffeaf2",
      onBase: "#ffffff",
      glow: "radial-gradient(closest-side, rgba(255,255,255,0.22), rgba(255,255,255,0))",
      sectionBg:
        "linear-gradient(180deg, #df8eaa 0%, #e29ab2 35%, #e3a6bb 68%, #e7b1c3 100%)",
    },
  },
};

/** Ordered list for rendering the gateway + previews top-to-bottom. */
export const CATEGORY_ORDER: CategoryKey[] = [
  "weight-loss",
  "erectile-dysfunction",
  "period-delay",
];

export const CATEGORY_LIST: Category[] = CATEGORY_ORDER.map((k) => CATEGORIES[k]);
