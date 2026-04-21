import type { Metadata } from "next";
import { Outfit, Inter, Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
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
        {children}
      </body>
    </html>
  );
}
