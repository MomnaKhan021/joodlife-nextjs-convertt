import type { Metadata } from "next";
import { Outfit, Cairo } from "next/font/google";
import localFont from "next/font/local";

import { CartProvider } from "@/components/cart/CartContext";
import SitePreloader from "@/components/SitePreloader";
import WhatsAppButton from "@/components/ui/WhatsAppButton";

import "../globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["latin"],
  variable: "--font-cairo",
  display: "swap",
  weight: ["400", "500", "600"],
});

// Gilroy — the brand heading font, self-hosted from joodlife.com's own
// licensed webfonts (next/font/local). Full weight range used by the brand.
const gilroy = localFont({
  variable: "--font-gilroy",
  display: "swap",
  src: [
    { path: "../fonts/Gilroy-Light.woff2", weight: "300", style: "normal" },
    { path: "../fonts/Gilroy-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Gilroy-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/Gilroy-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/Gilroy-Bold.woff2", weight: "700", style: "normal" },
    { path: "../fonts/Gilroy-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "../fonts/Gilroy-Black.woff2", weight: "900", style: "normal" },
  ],
});

// ITC Clearface — the serif used for the italicised display accents
// (e.g. "with Wegovy Pills", "works", "toward a better you"). Self-hosted
// from joodlife.com's own licensed webfonts. Keeps the --font-fraunces
// variable name so existing font-serif usages resolve to it.
const clearface = localFont({
  variable: "--font-fraunces",
  display: "swap",
  src: [
    { path: "../fonts/ClearfaceStd-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ClearfaceRegularItalic.woff2", weight: "400", style: "italic" },
  ],
});

export const metadata: Metadata = {
  title: "JoodLife — Innovative weight loss, made just for you",
  description:
    "Innovative weight loss, made just for you. Lose up to 27% body weight with plans tailored to you and guidance for lasting results.",
};

/**
 * Root layout for the marketing site (everything outside /admin and /api).
 * Uses Next.js's "multiple root layouts" pattern: by living inside the
 * `(site)` route group and pairing with a pass-through `app/layout.tsx`,
 * this layout provides its own `<html>`/`<body>` independently of the
 * Payload admin route group, which has its own root in `app/(payload)/
 * layout.tsx`. Without this split, the admin pages get wrapped in the
 * marketing site's body classes and the CMS theme leaks marketing CSS.
 */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${gilroy.variable} ${clearface.variable} ${cairo.variable}`}
      // Belt-and-braces: tell the browser to skip dark-mode defaults at the
      // HTML-element level too. Mac users with system dark mode otherwise see
      // a brief dark flash before our CSS applies.
      style={{ colorScheme: "light", background: "#ffffff" }}
    >
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body
        className="min-h-screen bg-white text-[#142e2a] font-ui antialiased"
        style={{ background: "#ffffff" }}
        suppressHydrationWarning
      >
        <SitePreloader />
        <CartProvider>{children}</CartProvider>
        <WhatsAppButton />
      </body>
    </html>
  );
}
