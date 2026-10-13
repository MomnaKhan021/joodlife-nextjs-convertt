import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import Header from "@/components/layout/Header";
import LpTrustStrip from "@/components/lp/LpTrustStrip";
import { LP_BODY, LP_GRADIENT, LP_GUTTER, LpHeading } from "@/components/lp/shared";
import Reveal from "@/components/ui/Reveal";
import { getLanderContent } from "@/lib/landerContent";
import Footer from "@/sections/home/Footer";

const SITE = (process.env.NEXT_PUBLIC_SERVER_URL || "https://www.joodlife.com").replace(/\/$/, "");
const PAGE_URL = `${SITE}/services`;
const WHATSAPP_URL = "https://wa.me/447756099075";

const TITLE = "Jood — weight loss, erectile dysfunction & period delay, online";
const DESCRIPTION =
  "Online assessments reviewed by UK clinicians, with discreet delivery to your door. Weight loss, erectile dysfunction and period delay — all in one place.";

/**
 * /services — the "everything we offer" page for social posts and adverts.
 *
 * UK law doesn't allow prescription-only medicines to be advertised to the
 * public, so this page (the one ads point at) talks about the services and
 * the clinical process, never named medicines or results claims; those stay
 * on the treatment pages behind "Learn more". Kept out of search like the
 * other ad landing pages.
 */
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/services" },
  robots: { index: false, follow: true },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: "JoodLife",
    type: "website",
    images: [
      {
        url: `${SITE}/assets/services/og-services.jpg`,
        width: 1200,
        height: 630,
        alt: "Jood: weight loss, erectile dysfunction and period delay, assessed online by UK clinicians",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE}/assets/services/og-services.jpg`],
  },
};

// The trust strip reads the lander's CMS copy, like /a7g64pt.
export const dynamic = "force-dynamic";

type Service = {
  id: string;
  eyebrow: string;
  title: string;
  blurb: string;
  bullets: string[];
  start: string;
  more: string;
  image: string;
  imageAlt: string;
  /** Panel background, text colour on it, and the bullet tick colour. */
  bg: string;
  tick: string;
  /** Where the cut-out sits in its panel. */
  imageClass: string;
};

const SERVICES: Service[] = [
  {
    id: "weight-loss",
    eyebrow: "Clinician-led programme",
    title: "Weight loss",
    blurb:
      "A medical weight loss programme designed around you, with a personalised plan from UK clinicians and support at every step.",
    bullets: [
      "Personalised plan from UK clinicians",
      "Regular check-ins and 24/7 WhatsApp support",
      "Discreet delivery to your door",
    ],
    start: "/consultation?product=weight-loss",
    more: "/weight-loss",
    image: "/assets/figma/hero-two-women-desktop.png",
    imageAlt: "Two women smiling, part of the Jood weight loss programme",
    bg: "linear-gradient(180deg, #2d544c 0%, #142e2a 100%)",
    tick: "#b4ff9f",
    imageClass: "object-cover object-[78%_0%]",
  },
  {
    id: "erectile-dysfunction",
    eyebrow: "Men's health",
    title: "Erectile dysfunction",
    blurb:
      "A private online assessment for erectile dysfunction. A UK clinician reviews your answers and, if treatment is suitable, it's delivered discreetly.",
    bullets: [
      "Private assessment, no face-to-face appointment",
      "Reviewed by UK clinicians",
      "Plain, discreet packaging",
    ],
    start: "/consultation?product=erectile-dysfunction",
    more: "/erectile-dysfunction",
    image: "/assets/home/hero-ed-man.png",
    imageAlt: "A man sitting and thinking",
    bg: "linear-gradient(180deg, #1f88b9 0%, #136a92 100%)",
    tick: "#ffffff",
    imageClass: "object-cover object-[75%_0%]",
  },
  {
    id: "period-delay",
    eyebrow: "Women's health",
    title: "Period delay",
    blurb:
      "Holiday, wedding or big event coming up? Our clinicians can check whether delaying your period is suitable for you.",
    bullets: [
      "Quick online assessment",
      "Reviewed by UK clinicians",
      "Discreet delivery, planned around you",
    ],
    start: "/consultation?product=period-delay",
    more: "/period-delay",
    image: "/assets/home/hero-pd-woman.png",
    imageAlt: "A woman thinking about her plans",
    bg: "linear-gradient(180deg, #d92b67 0%, #b8144a 100%)",
    tick: "#ffffff",
    imageClass: "object-contain object-bottom",
  },
];

const STEPS = [
  { n: "1", title: "Complete a short online assessment", body: "Answer a few questions about your health. It takes about 3 minutes." },
  { n: "2", title: "A UK clinician reviews it", body: "They check your answers and confirm whether treatment is suitable for you." },
  { n: "3", title: "Delivered discreetly", body: "If it's approved, your treatment arrives in plain packaging." },
];

function Tick({ colour }: { colour: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden className="mt-[2px] shrink-0">
      <circle cx="9" cy="9" r="9" fill={colour} fillOpacity="0.22" />
      <path d="M5.2 9.3l2.5 2.5 5.1-5.3" stroke={colour} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ServiceCard({ s, flip }: { s: Service; flip: boolean }) {
  return (
    <article
      id={s.id}
      className="grid scroll-mt-[96px] overflow-hidden rounded-[22px] text-white md:grid-cols-2"
      style={{ background: s.bg }}
    >
      <div className={`flex flex-col justify-center gap-[18px] p-[24px] md:p-[44px] ${flip ? "md:order-2" : ""}`}>
        <span className="w-fit rounded-full bg-white/15 px-[14px] py-[4px] font-ui text-[13px] font-medium">{s.eyebrow}</span>
        <h3 className="font-display text-[32px] !font-semibold leading-[36px] tracking-[-1px] md:text-[40px] md:leading-[44px]">
          {s.title}
        </h3>
        <p className={`${LP_BODY} text-white/90`}>{s.blurb}</p>
        <ul className="flex flex-col gap-[10px]">
          {s.bullets.map((b) => (
            <li key={b} className="flex items-start gap-[10px] font-ui text-[15.5px] leading-[21px]">
              <Tick colour={s.tick} />
              {b}
            </li>
          ))}
        </ul>
        <div className="mt-[6px] flex flex-col gap-[10px] sm:flex-row">
          <Link
            href={s.start}
            className="btn-cta inline-flex h-[50px] items-center justify-center rounded-[8px] bg-white px-[24px] font-ui text-[16px] font-medium text-[#142e2a]"
          >
            Start assessment
          </Link>
          <Link
            href={s.more}
            className="inline-flex h-[50px] items-center justify-center rounded-[8px] border border-white/50 px-[24px] font-ui text-[16px] font-medium text-white transition-colors hover:bg-white/10"
          >
            Learn more
          </Link>
        </div>
      </div>
      <div className={`relative h-[300px] md:h-auto md:min-h-[440px] ${flip ? "md:order-1" : ""}`}>
        <Image src={s.image} alt={s.imageAlt} fill sizes="(min-width: 768px) 50vw, 100vw" className={s.imageClass} />
      </div>
    </article>
  );
}

export default async function ServicesPage() {
  const c = await getLanderContent();
  return (
    <main className="flex min-h-screen flex-col overflow-x-clip bg-white">
      <Header compact />

      {/* Hero */}
      <section className="bg-[#f7f9f2]">
        <div className={`mx-auto flex max-w-[1440px] flex-col items-center gap-[22px] py-[56px] text-center lg:py-[80px] ${LP_GUTTER}`}>
          <Reveal>
            <span className="rounded-full bg-[#b4ff9f] px-[14px] py-[5px] font-ui text-[13px] font-medium text-[#13332b]">
              Online care from UK clinicians
            </span>
          </Reveal>
          <Reveal delay={60}>
            <LpHeading as="h1" lead="Healthcare that" accent="fits your life." className="md:!text-[60px] md:!leading-[64px]" />
          </Reveal>
          <Reveal delay={120}>
            <p className={`${LP_BODY} mx-auto max-w-[600px] text-[#3d5a54]`}>
              Weight loss, erectile dysfunction and period delay. Complete a short online assessment, a UK clinician
              reviews it, and suitable treatment is delivered discreetly to your door.
            </p>
          </Reveal>
          <Reveal delay={180} className="w-full">
            <nav aria-label="Our services" className="flex flex-wrap justify-center gap-[10px]">
              {SERVICES.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="btn-cta inline-flex h-[46px] items-center rounded-full border border-[#142e2a]/15 bg-white px-[20px] font-ui text-[15px] font-medium text-[#142e2a]"
                >
                  {s.title}
                </a>
              ))}
            </nav>
          </Reveal>
        </div>
      </section>

      <LpTrustStrip content={c.trust} />

      {/* Services */}
      <section aria-label="Our services" className="bg-white py-[56px] lg:py-[80px]">
        <div className={`mx-auto flex max-w-[1440px] flex-col gap-[20px] lg:gap-[28px] ${LP_GUTTER}`}>
          <Reveal className="mb-[8px] text-center">
            <LpHeading lead="Everything we" accent="offer." />
          </Reveal>
          {SERVICES.map((s, i) => (
            <Reveal key={s.id} delay={60}>
              <ServiceCard s={s} flip={i % 2 === 1} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section aria-label="How it works" className="bg-[#f7f9f2] py-[56px] lg:py-[80px]">
        <div className={`mx-auto flex max-w-[1440px] flex-col items-center gap-[32px] ${LP_GUTTER}`}>
          <Reveal className="text-center">
            <LpHeading lead="How it" accent="works." />
          </Reveal>
          <ol className="grid w-full gap-[16px] md:grid-cols-3">
            {STEPS.map((st, i) => (
              <Reveal key={st.n} as="li" delay={i * 80} className="flex flex-col gap-[12px] rounded-[22px] bg-white p-[24px]">
                <span
                  className="grid size-[40px] place-items-center rounded-full font-display text-[18px] !font-semibold text-white"
                  style={{ backgroundImage: LP_GRADIENT }}
                >
                  {st.n}
                </span>
                <h3 className="font-display text-[22px] !font-semibold leading-[26px] tracking-[-0.5px] text-[#142e2a]">{st.title}</h3>
                <p className={`${LP_BODY} text-[#3d5a54]`}>{st.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Closing */}
      <section className="bg-white py-[56px] lg:py-[80px]">
        <div className={`mx-auto max-w-[1440px] ${LP_GUTTER}`}>
          <Reveal>
            <div
              className="flex flex-col items-center gap-[18px] rounded-[22px] px-[24px] py-[44px] text-center text-white md:py-[64px]"
              style={{ backgroundImage: LP_GRADIENT }}
            >
              <h2 className="font-display text-[32px] !font-semibold leading-[36px] tracking-[-1px] md:text-[44px] md:leading-[48px]">
                Not sure where to <em className="font-serif font-normal italic">start?</em>
              </h2>
              <p className={`${LP_BODY} max-w-[520px] text-white/85`}>
                Message our team on WhatsApp. We&apos;re here 24/7 to answer your questions in confidence.
              </p>
              <div className="flex w-full flex-col justify-center gap-[10px] sm:w-auto sm:flex-row">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-cta inline-flex h-[50px] items-center justify-center rounded-[8px] bg-white px-[24px] font-ui text-[16px] font-medium text-[#142e2a]"
                >
                  Message us on WhatsApp
                </a>
                <a
                  href="#weight-loss"
                  className="inline-flex h-[50px] items-center justify-center rounded-[8px] border border-white/50 px-[24px] font-ui text-[16px] font-medium text-white transition-colors hover:bg-white/10"
                >
                  See our services
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
