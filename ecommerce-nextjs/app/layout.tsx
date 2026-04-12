import type { Metadata } from 'next';
import { Outfit, DM_Sans, Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google';
import { QueryProvider } from '@/lib/query-client';
import './globals.css';

const outfit = Outfit({
  variable: '--font-outfit-family',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

const dmSans = DM_Sans({
  variable: '--font-saans-family',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-gilroy-family',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const playfair = Playfair_Display({
  variable: '--font-clearface-family',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'Jood - Innovative Weight Loss, Made Just For You',
  description:
    'Clinically proven treatments, medically supervised guidance, and real transformation. Start your weight loss journey with Jood today.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${dmSans.variable} ${plusJakarta.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
