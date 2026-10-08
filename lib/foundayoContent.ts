/**
 * Copy, images and links for the Foundayo landing page at /foundayo (the
 * Meta ads page; /weight-loss-tablet redirects here).
 *
 * Built from the "Foundayo Pill - Next Js (Copy)" Figma, section
 * "AFTER – Jood updated copy" (2003:559): desktop frame 2003:1227 and mobile
 * frame 2003:560. The design's notes: the copy deliberately never names the
 * medicine (UK rules on advertising prescription-only medicines), the page is
 * noindex, and the GLP-1 wording, safety text and footer legal line need the
 * superintendent pharmacist's sign-off.
 *
 * Images are the same files as /foundayo (the AFTER design reuses every one).
 * Prices match the live catalogue: tablet 0.8 / 2.5 / 5.5 / 9 mg at
 * £99 / £109 / £129 / £149, weekly pen from £115.
 *
 * Where the mobile frame words a line differently, the `mobile` value is
 * used below the md breakpoint. Regulated copy — change with care.
 */

export const FOUNDAYO_ASSESS = "/consultation?product=weight-loss";

const IMG = "/assets/foundayo";
// Card art rendered from the Figma cards themselves (2x), so each matches
// the design exactly — including card 3's chart line and card 4's tablet.
const CARD = "/assets/foundayo";

export type FoundayoCard = {
  title: string;
  body: string;
  image: string;
  alt: string;
  badge?: { top: string; value: string };
};
export type FoundayoRow = { label: string; mark: "check" | "minus" };
export type FoundayoStep = { step: string; label: string; days: string; price: string; start: boolean };
export type FoundayoFaq = { q: string; a: string };

import type { UspIcon } from "@/lib/wegovyContentTypes";

export const FOUNDAYO = {
  meta: {
    title: "Weight Loss Tablet UK | Pharmacist-Led GLP-1 Care | Jood",
    description:
      "A daily weight loss tablet option, assessed by a GPhC-registered pharmacist. WhatsApp support 7 days a week and free next-day delivery. Check eligibility.",
    path: "/foundayo",
  },

  announcement: {
    text: "New: a once daily weight loss tablet, now available in the UK",
    mobile: "New: daily weight loss tablet, now in the UK",
  },

  hero: {
    title: "Tried every diet?",
    titleAccent: "Willpower was never the whole story.",
    body: "A GPhC-registered pharmacist builds your plan and stays one WhatsApp message away.",
    reviewsLabel: "(50+) Reviews",
    ctaLabel: "Check Your Eligibility",
    ctaHref: FOUNDAYO_ASSESS,
    reassurance: "Free assessment · No payment until approved",
    image: `${IMG}/hero.jpg`,
    imageAlt: "Woman at home taking a daily weight loss tablet",
    // The desktop frame reads "24/7 days"; the mobile frame and every other
    // line on the page say 7 days a week, so 7 days is used throughout.
    bullets: ["Pharmacist on WhatsApp, 7 days", "Tablet or pen, chosen together", "Free next-day delivery"],
  },

  usp: [
    { label: "free next-day delivery", icon: "delivery" },
    { label: "Pharmacist-assessed", icon: "medication" },
    { label: "Cancel anytime", icon: "cancel" },
    { label: "WhatsApp support", icon: "support" },
    { label: "Rated 4.4 on Trustpilot", icon: "customers", href: "https://www.trustpilot.com/review/joodlife.com" },
  ] as { label: string; icon: UspIcon }[],

  whatIs: {
    heading: "What is the",
    headingAccent: "daily weight loss tablet?",
    ctaLabel: "Check Your Eligibility",
    ctaHref: FOUNDAYO_ASSESS,
    cards: [
      {
        title: "MHRA licensed",
        body: "A prescription-only GLP-1 treatment, clinically studied for weight management in adults.",
        image: `${CARD}/card-1.webp`,
        alt: "Daily weight loss tablets",
      },
      {
        title: "More flexibility",
        body: "One tablet a day. No injections, no pens and nothing to keep in the fridge.",
        image: `${CARD}/card-2.webp`,
        alt: "Hand holding a daily weight loss tablet",
      },
      {
        title: "Real support",
        body: "A pharmacist checks your progress and dose, so you're never left guessing on your own.",
        image: `${CARD}/card-3.webp`,
        alt: "Woman in activewear smiling",
        badge: { top: "Every step", value: "↓ Supported" },
      },
      {
        title: "Quieter food noise",
        body: "Works with your natural appetite signals, so you feel full sooner and snack less.",
        image: `${CARD}/card-4.webp`,
        alt: "Close-up of a daily weight loss tablet",
      },
    ] as FoundayoCard[],
  },

  comparison: {
    heading: "Daily tablet",
    headingAccent: "or weekly injection?",
    pillTitle: "Daily tablet",
    penTitle: "Weekly pen",
    pillPrice: { prefix: "Starting from ", amount: "£99/mo", suffix: " billed monthly, membership required*" },
    penPrice: { prefix: "Starting from ", amount: "£115/mo", suffix: " billed monthly, membership required*" },
    takenLabel: "Taken", // shown on mobile only, as in the Figma
    pillTaken: "Once daily",
    penTaken: "Once weekly",
    pillRows: [
      { label: "GLP-1 treatment", mark: "check" },
      { label: "Clinically studied", mark: "check" },
      { label: "Needle-free", mark: "check" },
      { label: "Pharmacist-supervised", mark: "check" },
    ] as FoundayoRow[],
    penRows: [
      { label: "GLP-1 treatment", mark: "check" },
      { label: "Clinically studied", mark: "check" },
      { label: "Weekly injection", mark: "minus" },
      // The Figma shows a dash here, but every Jood pen is pharmacist-
      // supervised too — a dash would say otherwise, so it is a tick.
      { label: "Pharmacist-supervised", mark: "check" },
    ] as FoundayoRow[],
    footnote:
      "Not sure which is right for you? Your pharmacist helps you choose, based on your health, your routine and how you feel about needles.",
    ctaLabel: "Help Me Choose",
    ctaHref: FOUNDAYO_ASSESS,
  },

  howItWorks: {
    heading: "How does",
    headingAccent: "GLP-1 work?",
    intro:
      "GLP-1 is a hormone your gut releases after every meal to tell your brain you've had enough. GLP-1 treatment works on the same signals to help:",
    callouts: ["Quiet your\nfood noise", "Slow down your\ndigestion", "Feel fuller for longer", "Regulate your\nappetite"],
    body: "Most diets fail because hunger wins. Quieten the hunger and healthier choices start to feel easy, with a pharmacist one WhatsApp message away whenever you need them.",
    ctaLabel: "Get Started",
    ctaHref: FOUNDAYO_ASSESS,
    secondaryLabel: "Learn More",
    secondaryHref: "#faq",
    image: `${IMG}/how-pill-hd.webp`, // 1400px AI-upscaled (Real-ESRGAN) from the only 474px source
    background: `${IMG}/how-bg.jpg`,
  },

  reviews: {
    heading: "Loved for the",
    headingAccent: "support",
    intro:
      "Fast WhatsApp replies, real pharmacists and quick, discreet delivery. That's what our patients mention most on Trustpilot.",
  },

  realResults: {
    heading: "Real results",
    headingAccent: "need real support",
    lead: "A pharmacist,",
    big: "7 Days",
    tail: "a week, on WhatsApp.",
    body: "Side effects, a stalled scale or a dose question? Message your pharmacist any day of the week and talk to a real person, not a chatbot.",
    tabletTitle: "One tablet a day",
    tabletBody: "no needles, no pens, no fridge",
    bokeh: `${IMG}/results-bokeh.jpg`,
    photo: `${IMG}/results-woman.jpg`,
    photoAlt: "Woman on a coastal path at sunset",
    overlayTitle: "Beyond the scales",
    overlayBody:
      "Treatment works best alongside better habits. Your pharmacist helps with food, movement and what to do when progress slows, so this time it sticks.",
  },

  dosing: {
    heading: "Simple",
    headingAccent: "dosing & pricing",
    body: "Start low and step up gradually so your body can adjust. Your pharmacist approves every step, and your exact price is confirmed before you pay a penny.",
    image: `${IMG}/hand-pill.webp`,
    imageAlt: "Hand holding a daily weight loss tablet",
    startBadge: "Starting Dose",
    startBadgeMobile: "Start here",
    steps: [
      { step: "Step 1", label: "Starting Dose", days: "Days 1–30", price: "£99", start: true },
      { step: "Step 2", label: "Step-Up Dosing", days: "Days 31–60", price: "£109", start: false },
      { step: "Step 3", label: "Step-Up Dosing", days: "Days 61–90", price: "£129", start: false },
      { step: "Step 4", label: "Step-Up Dosing", days: "Days 91+", price: "£149", start: false },
    ] as FoundayoStep[],
    commitTitle: "Commit And Save Plan",
    commitBody: "sign up to a 6 month plan and we'll take £20 off every month",
    commitCta: "Check If I'm Eligible",
    commitHref: FOUNDAYO_ASSESS,
  },

  whyChoose: {
    heading: "Why choose Jood",
    headingAccent: "for weight loss",
    benefits: ["MHRA-licensed treatment", "GPhC-registered pharmacists", "WhatsApp support, 7 days a week"],
    safety:
      "Weight loss treatment is prescription-only and isn't suitable for everyone, including if you're pregnant, planning a pregnancy or breastfeeding, or already taking another GLP-1 medicine. Tell your pharmacist about any history of pancreatitis, gallbladder or kidney problems. A GPhC-registered pharmacist reviews your medical history before anything is supplied.",
    safetyMobile:
      "Not suitable for everyone, including during pregnancy, breastfeeding or with some medical conditions. A GPhC-registered pharmacist checks your medical history first.",
    image: `${IMG}/why-man.jpg`,
    imageAlt: "Man walking along a riverside path in the city",
  },

  faq: {
    heading: "Frequently asked",
    headingAccent: "questions",
    items: [
      {
        q: "What is a GLP-1 weight loss tablet?",
        a: "A once-daily, prescription-only tablet that works like GLP-1, a hormone your gut releases after eating. It helps you feel full sooner and less hungry, and is used alongside a reduced-calorie diet and more activity.",
      },
      {
        q: "Am I eligible?",
        a: "Usually adults with a BMI of 30 or more, or 27 or more with a weight-related condition such as high blood pressure, type 2 diabetes or sleep apnoea. Your free assessment confirms whether treatment is right for you.",
      },
      {
        q: "Is a tablet as effective as an injection?",
        a: "It depends on the treatment. In clinical trials, average weight loss has varied between treatments, and some weekly injections have shown greater average loss than daily tablets. The best option is one that suits your health and that you can stick with, so your pharmacist talks you through both.",
      },
      {
        q: "Do I need to take it on an empty stomach?",
        a: "It depends on the tablet. Some must be taken first thing on an empty stomach with a small sip of water, then you wait 30 minutes before eating or drinking. Others can be taken at any time of day, with or without food. Your pharmacist will explain exactly how to take yours.",
      },
      {
        q: "What are the side effects?",
        a: "The most common are nausea, diarrhoea, vomiting, constipation and stomach discomfort. They're usually mild, happen most when your dose increases, and ease over time. Rarely, treatment can cause pancreatitis or gallbladder problems, so get urgent medical help for severe, lasting stomach pain.",
      },
      {
        q: "Who shouldn't take it?",
        a: "It isn't suitable if you're pregnant, trying to get pregnant or breastfeeding, under 18, or already taking another GLP-1 medicine. Past pancreatitis, gallbladder, kidney or severe stomach problems need extra checks, which your pharmacist covers in your assessment.",
      },
      {
        q: "Can I switch from an injection to a tablet?",
        a: "Often, yes. Your pharmacist reviews your current dose and how you've been getting on, then advises when to stop your injection and which tablet dose to start on. You should never take two GLP-1 treatments at the same time.",
      },
      {
        q: "What happens if I stop?",
        a: "Studies show many people regain some of the weight within a year of stopping. That's why treatment works best alongside lasting habit changes, and why your pharmacist plans any change to your treatment with you.",
      },
      {
        q: "Can I get it on the NHS?",
        a: "NHS access to weight loss treatment is limited to people who meet strict clinical criteria, usually through specialist weight management services, and waiting times can be long. Jood is a private service, so you'll see your monthly price before you pay.",
      },
    ] as FoundayoFaq[],
  },

  finalCta: {
    heading: "Ready to stop",
    headingAccent: "starting over?",
    body: "A quick online assessment. No obligation, and no payment until a pharmacist approves you.",
    ctaLabel: "Check If I'm Eligible",
    ctaHref: FOUNDAYO_ASSESS,
    image: `${IMG}/cta-woman.webp`,
    imageAlt: "Woman looking up and smiling",
  },
};
