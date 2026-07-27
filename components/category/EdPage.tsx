import Image from "next/image";
import Link from "next/link";

import Reveal from "@/components/ui/Reveal";

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
    step: "Step 01",
    n: "01",
    title: "Health assessment",
    body: "Complete a quick confidential form about your health, symptoms, and treatment goals.",
  },
  {
    step: "Step 02",
    n: "02",
    title: "Expert review",
    body: "A licensed provider reviews your answers and recommends a suitable erectile dysfunction treatment.",
  },
  {
    step: "Step 03",
    n: "03",
    title: "Get medication",
    body: "If approved, your treatment is delivered discreetly with clear instructions and ongoing support.",
  },
];

/** Assessment-card mockup used by the step cards and the quiz card. Built in
 *  CSS rather than a flat export so it stays sharp at every breakpoint. */
function AssessmentMock({ tone = "light" }: { tone?: "light" | "dark" }) {
  const cardBg = tone === "dark" ? "bg-white" : "bg-white";
  return (
    <div className="relative mx-auto h-[150px] w-[190px]" aria-hidden>
      <span className="absolute right-0 top-1 h-[104px] w-[112px] rotate-[10deg] rounded-[12px] bg-[#dfe9d8]" />
      <div
        className={`absolute left-0 top-4 w-[130px] rounded-[12px] ${cardBg} p-3 shadow-[0_8px_20px_rgba(20,46,42,0.14)]`}
      >
        <p className="font-ui text-[11px] font-bold leading-[14px] text-[#142e2a]">
          Erectile Health
          <br />
          Assessment
        </p>
        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#142e2a] px-2 py-1 font-ui text-[9px] font-semibold text-white">
          Get Started
          <span className="grid h-3 w-3 place-items-center rounded-full bg-[#4eabd2] text-[7px]">
            →
          </span>
        </span>
      </div>
      <span className="absolute bottom-2 right-3 font-serif text-[30px] italic leading-none text-[#142e2a]">
        ♂
      </span>
    </div>
  );
}

/** Step-02 "expert review" mock — a clinician note card with the Certified
 *  badge. Composed in CSS so it stays sharp and needs no extra photography. */
function ReviewMock() {
  return (
    <div className="relative mx-auto h-[150px] w-[190px]" aria-hidden>
      <span className="absolute left-2 top-2 h-[110px] w-[120px] -rotate-[8deg] rounded-[12px] bg-[#dfe9d8]" />
      <div className="absolute right-0 top-3 w-[136px] rounded-[12px] bg-white p-3 shadow-[0_8px_20px_rgba(20,46,42,0.14)]">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#eef3e6] font-ui text-[11px] font-bold text-[#142e2a]">
            Dr
          </span>
          <div className="flex-1">
            <span className="block h-1.5 w-full rounded-full bg-[#142e2a]/15" />
            <span className="mt-1 block h-1.5 w-2/3 rounded-full bg-[#142e2a]/10" />
          </div>
        </div>
        <p className="mt-2.5 font-ui text-[9.5px] font-semibold leading-[13px] text-[#142e2a]">
          Clinical review complete
        </p>
        <span className="mt-1 block h-1.5 w-full rounded-full bg-[#142e2a]/10" />
        <span className="mt-1 block h-1.5 w-4/5 rounded-full bg-[#142e2a]/10" />
      </div>
      <span className="absolute bottom-2 left-3 inline-flex items-center gap-1 rounded-full bg-[#1a8ec1] px-2 py-1 font-ui text-[9px] font-bold text-white">
        ✓ Certified
      </span>
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
            className="font-display text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] text-[#142e2a] md:text-[38px]"
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
            className="font-display text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] text-[#142e2a] md:text-[38px]"
          >
            How it <em className="font-serif font-normal italic">works</em>
          </h2>
          <p className="mx-auto mt-2.5 max-w-[54ch] font-ui text-[14px] leading-[21px] text-[#142e2a]/70 md:text-[15px]">
            Start with a private health assessment, get reviewed by a licensed
            provider, and receive treatment discreetly at home.
          </p>
        </Reveal>

        <ul className="mt-8 grid gap-4 md:grid-cols-3 md:gap-5">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 110}>
              <div className="flex h-full flex-col rounded-[16px] border border-[#142e2a]/10 bg-[#f7f9f2] p-5 md:p-6">
                <div className="flex items-center justify-center rounded-[12px] bg-white/70 py-4">
                  {i === 1 ? <ReviewMock /> : <AssessmentMock />}
                </div>
                <span className="mt-5 inline-flex w-fit items-center rounded-full bg-[#142e2a] px-3 py-1 font-ui text-[11px] font-semibold text-white">
                  {s.step}
                </span>
                <p className="mt-3 font-display text-[19px] font-semibold leading-[1.2] text-[#142e2a]">
                  {s.title}
                </p>
                <p className="mt-2 font-ui text-[13px] leading-[19px] text-[#142e2a]/70">
                  {s.body}
                </p>
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
            {/* 89% stat overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0d1f2a] via-[#0d1f2a]/70 to-transparent p-5 pt-12">
              <div className="mb-2 flex items-center justify-between font-ui text-[10px] text-white/70">
                <span>0%</span>
                <span>100%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                <span className="block h-full w-[89%] rounded-full bg-[#b4ff9f]" />
              </div>
              <p className="mt-3 font-display text-[30px] font-bold leading-none text-white md:text-[34px]">
                89%
              </p>
              <p className="mt-1 max-w-[24ch] font-ui text-[12px] leading-[17px] text-white/80">
                Members reported improved confidence in intimacy
              </p>
            </div>
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
            className="mt-3 font-display text-[28px] font-semibold leading-[1.14] tracking-[-0.02em] text-[#142e2a] md:text-[38px]"
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
            className="font-display text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] text-[#142e2a] md:text-[38px]"
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
              <AssessmentMock tone="dark" />
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
          <div className="relative overflow-hidden rounded-[16px] bg-[#5eb3d7] md:rounded-[20px]">
            <div className="grid items-end gap-6 md:grid-cols-2">
              <div className="p-6 md:p-10">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white/25 text-white">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                    <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" />
                  </svg>
                </span>
                <h2 className="mt-4 font-display text-[28px] font-semibold leading-[1.14] tracking-[-0.02em] text-white md:text-[36px]">
                  Take the first step{" "}
                  <em className="font-serif font-normal italic">
                    toward better confidence
                  </em>
                </h2>
                <p className="mt-3 max-w-[40ch] font-ui text-[13.5px] leading-[20px] text-white/85">
                  Simple, discreet support for erectile dysfunction, designed
                  around your health, routine, and privacy.
                </p>
                <Link
                  href={START}
                  className="btn-cta mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-white px-8 font-ui text-[14px] font-semibold text-[#142e2a] transition-colors hover:bg-white/90"
                >
                  Get Started
                </Link>
              </div>
              <div className="relative h-[240px] w-full md:h-[320px]">
                <Image
                  src="/assets/category/ed-cta.jpg"
                  alt="A man confident about starting treatment"
                  fill
                  sizes="(max-width: 768px) 92vw, 560px"
                  className="object-cover object-top"
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
