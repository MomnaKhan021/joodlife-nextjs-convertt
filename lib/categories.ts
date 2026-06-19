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
   * Exact Figma section background, recreated as a CSS `background` value
   * (vertical gradient sampled from Figma + a subtle radiating ray fan).
   * Fully responsive — no raster stretching/letterbox artifacts. Weight
   * loss has none and uses the solid `base` colour, as in Figma.
   */
  sectionBg?: string;
};

export type CategoryKey = "weight-loss" | "erectile-dysfunction" | "period-delay";

export type Category = {
  key: CategoryKey;
  /** Route segment, e.g. "/weight-loss". */
  href: string;
  /** Small label above the title on the gateway card. */
  eyebrow: string;
  /** Card title (kept short for the gateway grid). */
  cardTitle: string;
  /** Marketing title used on the preview section + sub-page hero. */
  title: string;
  /** Italicised serif accent that completes the title. */
  titleAccent: string;
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
  theme: CategoryTheme;
};

export const CATEGORIES: Record<CategoryKey, Category> = {
  "weight-loss": {
    key: "weight-loss",
    href: "/weight-loss",
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
    cardTitle: "Erectile\ndysfunction",
    title: "Take control of erectile health",
    titleAccent: "safely and confidently",
    blurb:
      "Clinically approved treatments for erectile dysfunction, delivered discreetly to your door so you can regain confidence and performance.",
    bullets: [
      "Clinically approved treatments",
      "Discreet, next-day delivery",
      "Regain confidence & performance",
    ],
    cardImage: "/assets/category/ed-card.png",
    heroImage: "/assets/category/ed-hero.png",
    imageAlt: "Man considering his options for erectile-dysfunction treatment",
    theme: {
      base: "#1a8ec1",
      soft: "#4eabd2",
      tint: "#c7eeff",
      onBase: "#ffffff",
      glow: "radial-gradient(closest-side, rgba(255,255,255,0.22), rgba(255,255,255,0))",
      sectionBg:
        "repeating-conic-gradient(from 200deg at 82% -8%, rgba(255,255,255,0.05) 0deg 0.28deg, rgba(255,255,255,0) 0.28deg 1.9deg), linear-gradient(180deg, #1e92c4 0%, #4eaad4 30%, #6abade 52%, #94cee8 80%, #aedaec 100%)",
    },
  },
  "period-delay": {
    key: "period-delay",
    href: "/period-delay",
    eyebrow: "Women's health",
    cardTitle: "Period delay",
    title: "Adjust your periods",
    titleAccent: "on your schedule",
    blurb:
      "Whether it's for holidays, weddings or important events, Norethisterone is clinically approved and delivered discreetly to help you stay in control.",
    bullets: [
      "Clinically approved Norethisterone",
      "Delay your period reliably",
      "Discreet delivery, your schedule",
    ],
    cardImage: "/assets/category/pd-card.png",
    heroImage: "/assets/category/period-hero.png",
    imageAlt: "Woman holding a clock and calendar, planning her cycle",
    theme: {
      base: "#ec1f63",
      soft: "#e5abc0",
      tint: "#ffeaf2",
      onBase: "#ffffff",
      glow: "radial-gradient(closest-side, rgba(255,255,255,0.22), rgba(255,255,255,0))",
      sectionBg:
        "repeating-conic-gradient(from 200deg at 82% -8%, rgba(255,255,255,0.06) 0deg 0.28deg, rgba(255,255,255,0) 0.28deg 1.9deg), linear-gradient(180deg, #d59cad 0%, #ddb0c0 35%, #e5bfcb 55%, #efd9df 82%, #f4e2e6 100%)",
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
