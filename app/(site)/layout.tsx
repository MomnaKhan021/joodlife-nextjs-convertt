import type { Metadata } from "next";
import { Outfit, Inter, Plus_Jakarta_Sans, DM_Sans } from "next/font/google";

import { CartProvider } from "@/components/cart/CartContext";

import "../globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-gilroy",
  display: "swap",
});

const saans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-saans",
  display: "swap",
});

const sofia = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sofia",
  display: "swap",
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
      className={`${outfit.variable} ${inter.variable} ${plusJakarta.variable} ${saans.variable} ${sofia.variable}`}
    >
      <body
        className="min-h-screen bg-white text-[#142e2a] font-ui antialiased"
        suppressHydrationWarning
      >
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
