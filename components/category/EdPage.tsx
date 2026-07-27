import Image from "next/image";
import Link from "next/link";

import Reveal from "@/components/ui/Reveal";
import EdConfidenceStat from "@/components/category/EdConfidenceStat";

/**
 * Erectile-dysfunction page sections — Figma "Joodlife - Next js (Erectile
 * dysfunction) - 2026, June 02" (node 18:811).
 *
 * Light editorial theme that follows the blue hero: benefits grid, three-step
 * "How it works", the "Confidence in the moments that matter most" split, a
 * "Let's get to know you" pair, FAQ and a closing CTA banner. Every section is
 * fluid: single column on mobile, 2-up on tablet, the Figma grid on desktop.
 */

const CTA_PRIMARY =
  "btn-cta inline-flex h-12 items-center justify-center rounded-lg bg-[#142e2a] px-7 font-ui text-[14px] font-semibold text-white transition-colors hover:bg-[#0c2421] md:h-[50px]";
const CTA_GHOST =
  "btn-cta inline-flex h-12 items-center justify-center rounded-lg border border-[#142e2a]/25 bg-white px-7 font-ui text-[14px] font-semibold text-[#142e2a] transition-colors hover:bg-[#f7f9f2] md:h-[50px]";

const START = "/consultation?product=erectile-dysfunction";

/* ── Benefit icons (inline so they stay crisp and themeable) ─────────── */
function Icon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[22px] w-[22px] shrink-0 text-[#142e2a]"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

const BENEFITS = [
  {
    title: "Discreet, next-day delivery",
    body: "Next-day, unbranded, secure delivery with DPD.",
    d: "M21 8V6a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 6v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4M3.3 7 12 12l8.7-5M12 22V12",
  },
  {
    title: "24/7 expert support",
    body: "Access experienced clinicians and coaches whenever you need.",
    d: "M12 6v6l4 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  },
  {
    title: "Trusted by thousands",
    body: "Chosen by patients nationwide for safe, effective care.",
    d: "M16 21v-2a4 4 0 0 0-8 0v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  },
  {
    title: "Highly effective treatments",
    body: "Modern, evidence-based medication options.",
    d: "M10.5 20.5 3.5 13.5a5 5 0 0 1 7-7l1 1 1-1a5 5 0 0 1 7 7l-7 7a2 2 0 0 1-2 0z",
  },
  {
    title: "Quick, easy consultation",
    body: "Start online in minutes; simple, private, seamless.",
    d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  },
  {
    title: "Track your progress",
    body: "Monitor results and stay on track using our online customer portal.",
    d: "M3 3v18h18M7 15l4-4 3 3 5-6",
  },
];

const STEPS = [
  {
    step: "Step 1",
    n: "01",
    title: "Health assessment",
    body: "Complete a quick confidential form about your health, symptoms, and treatment goals.",
  },
  {
    step: "Step 2",
    n: "02",
    title: "Expert review",
    body: "A licensed provider reviews your answers and recommends a suitable erectile dysfunction treatment.",
  },
  {
    step: "Step 3",
    n: "03",
    title: "Get medication",
    body: "If approved, your treatment is delivered discreetly with clear instructions and ongoing support.",
  },
];

/** Assessment-card mockup (step 01 + the quiz card). Built in CSS in the same
 *  visual language as the home-page "How it works" illustrations — a cream
 *  progress card behind a white assessment card with a dark-green arrow. */
function AssessmentMock() {
  return (
    <div className="relative mx-auto h-[210px] w-[260px]" aria-hidden>
      {/* Progress card behind (cream) */}
      <div className="absolute right-0 top-1 w-[150px] rotate-[7deg] rounded-[16px] bg-[#eef2e6] p-3 shadow-[0_10px_24px_rgba(20,46,42,0.10)]">
        <p className="font-ui text-[10px] font-semibold text-[#142e2a]/70">
          Your Progress
        </p>
        <svg viewBox="0 0 120 60" className="mt-1 h-[54px] w-full" aria-hidden>
          <polyline
            points="4,50 30,44 56,30 84,22 116,8"
            fill="none"
            stroke="#142e2a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {/* White assessment card (front) */}
      <div className="absolute left-0 top-10 w-[184px] rounded-[16px] bg-white p-4 shadow-[0_16px_34px_rgba(20,46,42,0.16)]">
        <p className="font-display text-[16px] font-semibold leading-[20px] text-[#142e2a]">
          Erectile Health
          <br />
          Assessment
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-ui text-[11px] font-semibold text-[#142e2a]/60">
            Get Started
          </span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#142e2a] text-[13px] text-white">
            →
          </span>
        </div>
      </div>
    </div>
  );
}

/** Visual at the top of each "How it works" step card. Steps 02 / 03 reuse the
 *  home-page illustrations (same clinician + "Ready to Get Medication?" art) so
 *  the ED page stays consistent with the rest of the site; step 01 is the CSS
 *  assessment mock in the same palette. */
function StepVisual({ i }: { i: number }) {
  if (i === 0) {
    return (
      <div className="flex h-[240px] w-full items-center justify-center">
        <AssessmentMock />
      </div>
    );
  }
  const src =
    i === 1 ? "/assets/figma/hiw-step2.png" : "/assets/figma/hiw-step3-v2.png";
  const alt =
    i === 1
      ? "A UK-registered clinician who reviews your assessment"
      : "Your personalised treatment prepared and delivered";
  return (
    <div className="relative h-[240px] w-full">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 90vw, 380px"
        className="object-contain"
      />
    </div>
  );
}

/* ── 1. Benefits: "A treatment plan that works around you" ──────────── */
function TreatmentPlan() {
  return (
    <section aria-labelledby="ed-plan" className="w-full bg-white px-5 py-12 md:px-10 md:py-16 lg:px-[60px]">
      <div className="mx-auto grid w-full max-w-[1200px] items-start gap-8 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-12">
        <Reveal as="div">
          <h2
            id="ed-plan"
            className="font-display text-[30px] font-semibold leading-[1.14] tracking-[-0.02em] text-[#142e2a] md:text-[40px] md:leading-[1.1]"
          >
            A treatment plan that{" "}
            <em className="font-serif font-normal italic">works</em> around you
          </h2>
          <p className="mt-3 max-w-[42ch] font-ui text-[14px] leading-[22px] text-[#142e2a]/70 md:text-[15px]">
            Safe, clinically approved treatment delivered privately, so you can
            plan with confidence.
          </p>
          <div className="mt-6 hidden flex-wrap gap-3 lg:flex">
            <Link href={START} className={CTA_PRIMARY}>
              Get Started
            </Link>
            <Link href={START} className={CTA_GHOST}>
              See If You Are Eligible
            </Link>
          </div>
        </Reveal>

        <Reveal as="div" delay={120}>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <li
                key={b.title}
                className="rounded-[14px] border border-[#142e2a]/10 bg-[#f7f9f2] p-5"
              >
                <Icon d={b.d} />
                <p className="mt-3 font-ui text-[14px] font-bold leading-[19px] text-[#142e2a]">
                  {b.title}
                </p>
                <p className="mt-1.5 font-ui text-[12.5px] leading-[18px] text-[#142e2a]/65">
                  {b.body}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3 lg:hidden">
            <Link href={START} className={`${CTA_PRIMARY} flex-1 min-w-[150px]`}>
              Get Started
            </Link>
            <Link href={START} className={`${CTA_GHOST} flex-1 min-w-[150px]`}>
              See If You Are Eligible
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 2. How it works (3 steps) ──────────────────────────────────────── */
function EdHowItWorks() {
  return (
    <section aria-labelledby="ed-how" className="w-full bg-white px-5 pb-12 md:px-10 md:pb-16 lg:px-[60px]">
      <div className="mx-auto w-full max-w-[1200px]">
        <Reveal as="div" className="text-center">
          <h2
            id="ed-how"
            className="font-display text-[30px] font-semibold leading-[1.14] tracking-[-0.02em] text-[#142e2a] md:text-[40px] md:leading-[1.1]"
          >
            How it <em className="font-serif font-normal italic">works</em>
          </h2>
          <p className="mx-auto mt-2.5 max-w-[54ch] font-ui text-[14px] leading-[21px] text-[#142e2a]/70 md:text-[15px]">
            Start with a private health assessment, get reviewed by a licensed
            provider, and receive treatment discreetly at home.
          </p>
        </Reveal>

        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 110}>
              <div className="flex h-full flex-col items-center gap-6 rounded-[20px] bg-[#f7f9f2] px-6 pt-6 md:px-8 md:pt-8">
                <StepVisual i={i} />
                <div className="flex flex-col items-center gap-3 pb-8 text-center">
                  <span className="inline-flex items-center rounded-full bg-[#142e2a]/[0.06] px-4 py-1.5 font-ui text-[13px] font-medium text-[#142e2a]">
                    {s.step}
                  </span>
                  <h3 className="font-display text-[20px] font-semibold leading-[26px] text-[#142e2a] md:text-[23px]">
                    {s.title}
                  </h3>
                  <p className="max-w-[34ch] font-ui text-[14px] leading-[20px] text-[#142e2a]/75 md:text-[15px]">
                    {s.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </ul>

        <div className="mt-7 flex justify-center">
          <Link href={START} className={`${CTA_PRIMARY} w-full max-w-[320px] md:w-auto`}>
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── 3. "Confidence in the moments that matter most" ────────────────── */
function EdConfidence() {
  const checks = ["Clinically approved", "Doctor prescribed", "Discreet & private"];
  return (
    <section aria-labelledby="ed-conf" className="w-full bg-white px-5 pb-12 md:px-10 md:pb-16 lg:px-[60px]">
      <div className="mx-auto grid w-full max-w-[1200px] items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <Reveal as="div" className="relative order-2 lg:order-1">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[16px] md:aspect-[16/11]">
            <Image
              src="/assets/category/ed-confidence.jpg"
              alt="A man feeling more confident after treatment"
              fill
              sizes="(max-width: 1024px) 92vw, 560px"
              className="object-cover object-top"
            />
            {/* 89% stat overlay — animates up on scroll */}
            <EdConfidenceStat />
          </div>
        </Reveal>

        <Reveal as="div" delay={120} className="order-1 lg:order-2">
          <span className="inline-flex items-center gap-2 font-ui text-[11px] font-bold uppercase tracking-[0.08em] text-[#1a8ec1]">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#1a8ec1] text-[10px] text-white">
              ♂
            </span>
            Erectile dysfunction
          </span>
          <h2
            id="ed-conf"
            className="mt-3 font-display text-[30px] font-semibold leading-[1.2] tracking-[-0.02em] text-[#142e2a] md:text-[40px] md:leading-[1.1]"
          >
            Confidence in the{" "}
            <em className="font-serif font-normal italic">
              moments that matter most.
            </em>
          </h2>
          <div className="mt-4 flex flex-col gap-3 font-ui text-[13.5px] leading-[21px] text-[#142e2a]/75 md:text-[14.5px] md:leading-[23px]">
            <p>
              Erectile dysfunction (ED) is the consistent inability to get or
              keep an erection firm enough for sexual activity. It&rsquo;s common
              and can affect men of all ages.
            </p>
            <p>
              ED can have physical and emotional causes including stress,
              anxiety, low blood flow, certain health conditions, and lifestyle
              factors. The good news is that effective treatments are available.
            </p>
            <p>
              If suitable, we can prescribe proven ED treatments online after a
              simple consultation, with no appointment needed. Our goal is to
              help you feel more confident and supported at every step.
            </p>
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {checks.map((c) => (
              <li
                key={c}
                className="flex items-center gap-1.5 font-ui text-[12.5px] font-semibold text-[#142e2a]"
              >
                <span className="grid h-4 w-4 place-items-center rounded-full bg-[#1a8ec1] text-[9px] text-white">
                  ✓
                </span>
                {c}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={START} className={`${CTA_PRIMARY} flex-1 min-w-[150px] md:flex-none`}>
              Get Started
            </Link>
            <Link href={START} className={`${CTA_GHOST} flex-1 min-w-[150px] md:flex-none`}>
              See If You Are Eligible
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 4. "Let's get to know you" ─────────────────────────────────────── */
function EdGetToKnow() {
  const stages = ["Low", "Moderate", "Strong", "Sustained"];
  return (
    <section aria-labelledby="ed-know" className="w-full bg-white px-5 pb-12 md:px-10 md:pb-16 lg:px-[60px]">
      <div className="mx-auto w-full max-w-[1200px]">
        <Reveal as="div" className="text-center">
          <h2
            id="ed-know"
            className="font-display text-[30px] font-semibold leading-[1.14] tracking-[-0.02em] text-[#142e2a] md:text-[40px] md:leading-[1.1]"
          >
            Let&rsquo;s get to{" "}
            <em className="font-serif font-normal italic">know</em> you
          </h2>
          <p className="mx-auto mt-2.5 max-w-[52ch] font-ui text-[14px] leading-[21px] text-[#142e2a]/70 md:text-[15px]">
            Answer a few simple questions so we can match you with the right
            treatment and support for lasting results.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-4 md:grid-cols-2 md:gap-5">
          {/* Quiz card */}
          <Reveal as="div">
            <div className="flex h-full flex-col items-center justify-between rounded-[16px] bg-[#142e2a] p-6 text-center md:p-8">
              <AssessmentMock />
              <p className="mt-6 max-w-[38ch] font-ui text-[13px] leading-[19px] text-white/80">
                Answer a few simple questions so we can understand your symptoms
                and match you with the right treatment option.
              </p>
              <Link
                href={START}
                className="btn-cta mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-white px-7 font-ui text-[13px] font-semibold text-[#142e2a] transition-colors hover:bg-white/90"
              >
                Start Quiz
              </Link>
            </div>
          </Reveal>

          {/* Progress card */}
          <Reveal as="div" delay={120}>
            <div className="relative h-full min-h-[300px] overflow-hidden rounded-[16px] md:min-h-[340px]">
              <Image
                src="/assets/category/ed-progress.jpg"
                alt="A man staying active while on treatment"
                fill
                sizes="(max-width: 768px) 92vw, 560px"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0d1f2a] via-[#0d1f2a]/75 to-transparent p-5 pt-14">
                <div className="flex items-end justify-between gap-4">
                  <p className="max-w-[26ch] font-ui text-[12.5px] leading-[18px] text-white/85">
                    Monitor your progress and treatment response so you can stay
                    supported and feel more in control.
                  </p>
                  <p className="shrink-0 text-right font-ui text-[11px] leading-[15px] text-white/70">
                    Up to full
                    <br />
                    <strong className="font-bold text-white">
                      performance confidence
                    </strong>
                  </p>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                  <span className="block h-full w-[62%] rounded-full bg-[#4eabd2]" />
                </div>
                <ul className="mt-2 flex justify-between font-ui text-[10.5px] text-white/70">
                  {stages.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── 5. Closing CTA banner ──────────────────────────────────────────── */
function EdCtaBanner() {
  return (
    <section className="w-full bg-white px-5 pb-14 md:px-10 md:pb-16 lg:px-[60px]">
      <div className="mx-auto w-full max-w-[1200px]">
        <Reveal as="div">
          <div
            className="relative overflow-hidden rounded-[16px] md:rounded-[20px]"
            style={{
              background:
                "linear-gradient(100deg, #7cc6dc 0%, #a9ddd6 50%, #d9f1ea 100%)",
            }}
          >
            <div className="grid items-center gap-6 md:grid-cols-2 md:gap-0">
              <div className="p-6 md:p-10 lg:p-12">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#142e2a] text-white">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                    <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" />
                  </svg>
                </span>
                <h2 className="mt-4 font-display text-[28px] font-semibold leading-[1.16] tracking-[-0.02em] text-[#142e2a] md:text-[40px] md:leading-[1.08]">
                  Take the first step{" "}
                  <em className="font-serif font-normal italic">
                    toward better confidence
                  </em>
                </h2>
                <p className="mt-3 max-w-[42ch] font-ui text-[14px] leading-[21px] text-[#142e2a]/70 md:text-[15px]">
                  Simple, discreet support for erectile dysfunction, designed
                  around your health, routine, and privacy.
                </p>
                <Link
                  href={START}
                  className="btn-cta mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-[#142e2a] px-8 font-ui text-[14px] font-semibold text-white transition-colors hover:bg-[#0c2421]"
                >
                  Get Started
                </Link>
              </div>
              <div className="relative h-[260px] w-full self-end md:h-[340px]">
                <Image
                  src="/assets/category/ed-cta.jpg"
                  alt="A man confident about starting treatment"
                  fill
                  sizes="(max-width: 768px) 92vw, 560px"
                  className="object-contain object-bottom md:object-[center_bottom]"
                />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** All new light-theme ED sections, in Figma order. */
export default function EdPage() {
  return (
    <>
      <TreatmentPlan />
      <EdHowItWorks />
      <EdConfidence />
      <EdGetToKnow />
    </>
  );
}

export { EdCtaBanner };
