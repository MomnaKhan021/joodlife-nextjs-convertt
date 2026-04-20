import type { Metadata } from "next";
import { Outfit, DM_Sans, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-gilroy",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "JoodLife 2.0 — Innovative Weight Loss, Made Just For You",
  description: "Lose up to 27% body weight with JoodLife. UK Licensed medication, expert guidance, and personalized support for lasting results.",
  keywords: ["weight loss", "weight loss program", "UK licensed", "medical guidance", "jood", "joodlife"],
  openGraph: {
    title: "JoodLife 2.0 — Innovative Weight Loss",
    description: "Personalized weight loss program with UK licensed medication and expert guidance.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${dmSans.variable} ${playfair.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
