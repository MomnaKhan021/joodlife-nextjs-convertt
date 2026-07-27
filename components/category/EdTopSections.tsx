import Image from "next/image";
import Link from "next/link";

import Reveal from "@/components/ui/Reveal";
import TestimonialCarousel, {
  type Testimonial,
} from "@/components/category/TestimonialCarousel";

/**
 * Top-of-page ED sections — Figma "Erectile dysfunction" (node 18:811):
 *   • EdHero    — photo banner with Trustpilot, headline, checklist, CTAs
 *   • EdJourney — teal "What to expect in your journey" timeline, the
 *                 thumbs-up cut-out, the treatment card, goals + testimonial
 *
 * Both are fully responsive: stacked on mobile, the Figma layout on desktop.
 */

const START = "/consultation?product=erectile-dysfunction";

const HERO_CHECKS = [
  "Private online consultation",
  "Clinically approved ED treatments",
  "Discreet next day delivery",
  "Ongoing support from licensed professionals",
];

const JOURNEY = [
  {
    tag: "TODAY",
    title: "Immediate",
    body: "Start with a quick online consultation. A licensed provider reviews your information and your ED medication is delivered discreetly.",
  },
  {
    tag: "1–3 MONTHS",
    title: "Early results",
    body: "Notice gradual improvements in erectile function and increased confidence, with ongoing guidance from your provider.",
  },
  {
    tag: "3–6 MONTHS",
    title: "Continued progress",
    body: "Performance becomes more consistent, anxiety decreases, and your treatment plan may be adjusted for optimal results.",
  },
];

const GOALS = [
  "Address erectile difficulties",
  "Improve sexual confidence",
  "All the above",
];

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "This treatment completely restored my confidence. I no longer worry about performance, and I feel in control.",
    name: "Jordan, 42",
    meta: "2 months into treatment",
  },
  {
    quote:
      "I feel like myself again. My confidence has improved, and intimacy no longer feels stressful.",
    name: "Michael, 46",
    meta: "6 weeks completed",
  },
  {
    quote:
      "I noticed a real difference in my performance and confidence. It's helped me feel more in control again.",
    name: "David, 39",
    meta: "1 month completed",
  },
  {
    quote:
      "This has made a big impact on both my confidence and my relationship. I feel much more relaxed and reassured now.",
    name: "Chris, 51",
    meta: "7 weeks completed",
  },
];

/* ── Trustpilot rating row ───────────────────────────────────────────── */
function Trustpilot({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 font-ui text-[13px] ${
        dark ? "text-white" : "text-[#142e2a]"
      }`}
    >
      <span className="font-semibold">
        <span className="text-[#00b67a]">★</span> Trustpilot
      </span>
      <span className="flex gap-0.5" aria-label="4.4 out of 5 stars">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="grid h-4 w-4 place-items-center rounded-[3px] bg-[#00b67a] text-[9px] text-white"
            aria-hidden
          >
            ★
          </span>
        ))}
      </span>
      <span className="font-semibold">
        4.4{" "}
        <span className={dark ? "font-normal text-white/70" : "font-normal text-[#142e2a]/60"}>
          (50+) Reviews
        </span>
      </span>
    </div>
  );
}

/* ── 1. Hero photo banner ────────────────────────────────────────────── */
export function EdHero() {
  return (
    <section
      aria-label="Erectile dysfunction treatment"
      className="w-full bg-white px-5 pt-4 md:px-10 md:pt-6 lg:px-[60px]"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="relative overflow-hidden rounded-[16px] md:rounded-[24px]">
          <Image
            src="/assets/category/ed-hero-banner.jpg"
            alt="A man feeling confident outdoors"
            fill
            priority
            quality={85}
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover object-[72%_center]"
          />
          {/* Legibility gradient — strong on the left where the copy sits */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(6,20,26,0.86) 0%, rgba(6,20,26,0.62) 40%, rgba(6,20,26,0.15) 66%, rgba(6,20,26,0) 82%)",
            }}
          />

          <div className="relative min-h-[440px] max-w-[640px] p-6 py-10 md:min-h-[560px] md:p-12">
            <Reveal as="div" direction="down">
              <Trustpilot dark />
            </Reveal>
            <Reveal as="div" delay={60}>
              <h1 className="mt-5 max-w-[16ch] font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.025em] text-white md:text-[54px]">
                Regain confidence &amp;{" "}
                <em className="font-serif font-normal italic">
                  control your performance
                </em>
              </h1>
            </Reveal>
            <Reveal as="div" delay={140} className="mt-6">
              <ul className="flex flex-col gap-2.5">
                {HERO_CHECKS.map((c) => (
                  <li key={c} className="flex items-center gap-2.5 font-ui text-[13.5px] text-white/90 md:text-[15px]">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#1a8ec1] text-[10px] text-white">
                      ✓
                    </span>
                    {c}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal as="div" delay={220} className="mt-7 flex flex-wrap gap-3">
              <Link
                href={START}
                className="btn-cta inline-flex h-12 items-center justify-center rounded-lg bg-white px-8 font-ui text-[14px] font-semibold text-[#142e2a] shadow-lg transition-colors hover:bg-white/90"
              >
                Get Started
              </Link>
              <Link
                href={START}
                className="btn-cta inline-flex h-12 items-center justify-center rounded-lg border border-white/70 bg-white/10 px-8 font-ui text-[14px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                See If You Are Eligible
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 2. "What to expect in your journey" (teal) ──────────────────────── */
export function EdJourney() {
  return (
    <section
      aria-labelledby="ed-journey"
      className="w-full bg-white px-5 py-6 md:px-10 lg:px-[60px]"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <div
          className="relative overflow-hidden rounded-[16px] px-6 py-10 md:rounded-[24px] md:px-12 md:py-14"
          style={{
            background:
              "linear-gradient(180deg, #3ba7d6 0%, #2f8fc0 52%, #2a83b4 100%)",
          }}
        >
          {/* Radiating ray fan, faint */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              background:
                "repeating-conic-gradient(from 90deg at 50% 120%, rgba(255,255,255,0.9) 0deg 1deg, transparent 1deg 7deg)",
            }}
          />

          <div className="relative">
            <Reveal as="div">
              <span className="inline-flex items-center rounded-full bg-white/20 px-3.5 py-1.5 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
                Timeline
              </span>
              <h2
                id="ed-journey"
                className="mt-4 font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] text-white md:text-[44px]"
              >
                What to expect in{" "}
                <em className="font-serif font-normal italic">your journey</em>
              </h2>
            </Reveal>

            {/* Timeline */}
            <div className="relative mt-10">
              <div
                aria-hidden
                className="absolute left-1 right-1 top-[9px] hidden border-t-2 border-dashed border-white/40 md:block"
              />
              <ul className="grid gap-8 md:grid-cols-3 md:gap-6">
                {JOURNEY.map((j, i) => (
                  <Reveal as="li" key={j.tag} delay={i * 110} className="relative">
                    <span
                      aria-hidden
                      className="grid h-5 w-5 place-items-center rounded-full bg-white/30 ring-4 ring-[#3ba7d6]"
                    >
                      <span className="h-2 w-2 rounded-full bg-white" />
                    </span>
                    <span className="mt-4 inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 font-ui text-[10px] font-semibold uppercase tracking-[0.06em] text-white">
                      {j.tag}
                    </span>
                    <h3 className="mt-2.5 font-display text-[19px] font-semibold text-white md:text-[21px]">
                      {j.title}
                    </h3>
                    <p className="mt-1.5 max-w-[38ch] font-ui text-[13px] leading-[19px] text-white/80">
                      {j.body}
                    </p>
                  </Reveal>
                ))}
              </ul>
            </div>

            {/* Thumbs-up cut-out + wavy curve + CTAs */}
            <div className="relative mt-6 flex justify-center md:mt-4">
              <svg
                aria-hidden
                viewBox="0 0 1200 260"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-x-0 top-1/2 h-[180px] w-full -translate-y-1/2 opacity-70"
              >
                <path
                  d="M0 210 C 220 210, 300 60, 520 90 S 900 220, 1200 60"
                  fill="none"
                  stroke="rgba(255,255,255,0.55)"
                  strokeWidth="2"
                  strokeDasharray="2 10"
                  strokeLinecap="round"
                />
              </svg>

              <div className="relative h-[320px] w-[280px] md:h-[380px] md:w-[330px]">
                <Image
                  src="/assets/category/ed-thumbsup.png"
                  alt="A man happy with his treatment results"
                  fill
                  quality={90}
                  sizes="(max-width: 768px) 280px, 330px"
                  className="object-contain object-bottom"
                />
              </div>

              <div className="absolute bottom-[14%] left-1/2 z-10 flex w-[92%] max-w-[360px] -translate-x-1/2 gap-2.5">
                <Link
                  href={START}
                  className="btn-cta inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-white px-5 font-ui text-[13px] font-semibold text-[#142e2a] shadow-lg transition-colors hover:bg-white/90"
                >
                  Get Started
                </Link>
                <Link
                  href={START}
                  className="btn-cta inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-white/70 bg-white/10 px-5 font-ui text-[13px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* Treatment card */}
            <Reveal
              as="div"
              className="relative mt-2 grid items-center gap-5 rounded-[16px] bg-white/12 px-5 py-6 backdrop-blur-[14px] md:grid-cols-[1.4fr_auto_auto] md:gap-8 md:px-8 md:py-7"
            >
              <p className="max-w-[46ch] font-ui text-[14px] leading-relaxed text-white/90">
                Take control of erectile health safely and discreetly. Clinically
                approved treatments are delivered to your door, helping you regain
                confidence and performance.
              </p>
              <div className="relative mx-auto h-[70px] w-[150px]">
                <Image
                  src="/assets/category/ed-pill.png"
                  alt="Clinically approved ED treatment tablet"
                  fill
                  quality={90}
                  sizes="150px"
                  className="object-contain"
                />
              </div>
              <Link
                href={START}
                className="btn-cta inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#0c2a3a] px-7 font-ui text-[14px] font-semibold text-white transition-colors hover:bg-[#08222f] md:w-auto"
              >
                Get Started
              </Link>
            </Reveal>

            {/* Goals + testimonial */}
            <div className="mt-5 grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2">
              <Reveal
                as="div"
                className="relative min-h-[360px] min-w-0 overflow-hidden rounded-[16px] md:min-h-[400px] md:rounded-[24px]"
              >
                <Image
                  src="/assets/category/ed-goals.png"
                  alt="Man considering his treatment goals"
                  fill
                  quality={90}
                  sizes="(max-width: 1024px) 90vw, 620px"
                  className="object-cover object-center"
                />
                <div aria-hidden className="absolute inset-0 bg-black/25" />
                <div className="absolute inset-0 flex flex-col p-6 md:p-8">
                  <h3 className="font-display text-[24px] font-semibold leading-tight text-white md:text-[28px]">
                    What are your goals?
                  </h3>
                  <ul className="mt-auto flex flex-col items-start gap-2 md:mt-0 md:flex-1 md:items-end md:justify-center md:gap-2.5">
                    {GOALS.map((g) => (
                      <li
                        key={g}
                        className="max-w-full rounded-full bg-white/15 px-3 py-1.5 text-left font-ui text-[12px] font-medium text-white backdrop-blur-sm md:px-4 md:py-2 md:text-right md:text-[13px]"
                      >
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <Reveal as="div" delay={120} className="min-w-0">
                <TestimonialCarousel items={TESTIMONIALS} />
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
