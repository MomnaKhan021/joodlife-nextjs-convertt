import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

/**
 * "How do Wegovy pills work?" — Figma node 1:1725.
 * 1440×889, r=32. IMAGE bg + GRADIENT overlay: transparent → rgba(104,114,86,0.6).
 * Heading + subtitle centred at top; 4 callouts with L-shaped connectors;
 * description + two buttons centred at bottom.
 */

type Callout = {
  label: string;
  pos: string;
  align: "text-left" | "text-right";
  connector: React.ReactNode;
};

/* SVG L-shaped connectors matching Figma Vector 30-33 (white, ~1.2px stroke) */
const ConnectorRight = () => (
  <svg width="120" height="30" viewBox="0 0 120 30" fill="none" className="block">
    <path d="M0 4 H80 L118 28" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="118" cy="28" r="3" fill="white" />
  </svg>
);

const ConnectorLeft = () => (
  <svg width="120" height="30" viewBox="0 0 120 30" fill="none" className="block">
    <path d="M120 4 H40 L2 28" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="2" cy="28" r="3" fill="white" />
  </svg>
);

const ConnectorRightUp = () => (
  <svg width="120" height="30" viewBox="0 0 120 30" fill="none" className="block">
    <path d="M0 26 H80 L118 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="118" cy="2" r="3" fill="white" />
  </svg>
);

const ConnectorLeftUp = () => (
  <svg width="120" height="30" viewBox="0 0 120 30" fill="none" className="block">
    <path d="M120 26 H40 L2 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="2" cy="2" r="3" fill="white" />
  </svg>
);

const CALLOUTS: Callout[] = [
  {
    label: "Reduces cravings",
    pos: "left-[3%] top-[24%]",
    align: "text-left",
    connector: <ConnectorRight />,
  },
  {
    label: "Slow down\nyour digestion",
    pos: "right-[3%] top-[24%]",
    align: "text-right",
    connector: <ConnectorLeft />,
  },
  {
    label: "Regulate your blood\nsugar⁵.",
    pos: "left-[3%] bottom-[17%]",
    align: "text-left",
    connector: <ConnectorRightUp />,
  },
  {
    label: "Regulate your\nappetite⁴",
    pos: "right-[3%] bottom-[17%]",
    align: "text-right",
    connector: <ConnectorLeftUp />,
  },
];

export default function HowItWorks() {
  return (
    <section
      aria-label="How Wegovy pills work"
      className="relative w-full overflow-hidden rounded-[32px]"
      style={{ minHeight: 600 }}
    >
      {/* Background pill image */}
      <Image
        src="/assets/wegovy/how-pill.png"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center"
        aria-hidden
      />

      {/* Olive gradient overlay — transparent top → rgba(104,114,86,0.6) bottom */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, rgba(104,114,86,0) 0%, rgba(104,114,86,0.6) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 px-[60px] py-[60px]">

        {/* Heading + subtitle — centred, max-w 580px */}
        <Reveal as="div" className="mx-auto max-w-[580px] text-center">
          <h2 className="font-display text-[36px] font-semibold leading-[1.1] tracking-[-0.02em] text-white md:text-[48px] md:leading-[52px]">
            How Do{" "}
            <em className="font-serif italic font-normal">Wegovy Pills Work?</em>
          </h2>
          <p className="mx-auto mt-4 font-ui text-[14px] leading-[22px] text-white md:text-[16.3px] md:leading-[24px]">
            The Wegovy pill contains semaglutide, which is known as a GLP-1
            receptor agonist. This means it works by mimicking the natural GLP-1
            hormone found in your gut. The hormone's job is to help:
          </p>
        </Reveal>

        {/* Callouts with connectors — desktop only */}
        <div className="relative mx-auto hidden h-[340px] max-w-full md:block">
          {CALLOUTS.map((c) => (
            <div
              key={c.label}
              className={`absolute ${c.pos} flex max-w-[220px] flex-col gap-1 ${c.align === "text-right" ? "items-end" : "items-start"}`}
            >
              <p
                className="whitespace-pre-line font-ui text-[20px] font-semibold leading-[26px] text-white md:text-[25px] md:leading-[32px]"
              >
                {c.label}
              </p>
              {c.connector}
            </div>
          ))}
        </div>

        {/* Mobile callouts */}
        <ul className="mx-auto mt-8 flex max-w-[320px] flex-col gap-2 md:hidden">
          {CALLOUTS.map((c) => (
            <li
              key={c.label}
              className="rounded-full bg-white/20 px-4 py-2 text-center font-ui text-[15px] font-semibold text-white"
            >
              {c.label.replace("\n", " ")}
            </li>
          ))}
        </ul>

        {/* Description + buttons — centred, max-w 690px */}
        <Reveal as="div" className="mx-auto mt-8 max-w-[690px] text-center" delay={120}>
          <p className="font-ui text-[14px] leading-[22px] text-white/90 md:text-[16.3px] md:leading-[24px]">
            The tablet works the same as the Wegovy injection. However, instead
            of semaglutide entering the bloodstream directly via a needle, the
            pill goes via your stomach in a protective coating that can't be
            dissolved by stomach acid and into the bloodstream through the walls
            of the small intestine.
          </p>
          <div className="mt-7 flex items-center justify-center gap-4">
            <a
              href="/consultation"
              className="inline-flex h-[50px] items-center justify-center rounded-lg bg-[#142e2a] px-9 font-ui text-[16.3px] font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-[#0c2421]"
            >
              Get Started
            </a>
            <a
              href="#faq"
              className="inline-flex h-[50px] items-center justify-center rounded-lg bg-white/[0.06] px-9 font-ui text-[16.3px] font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-white/10"
            >
              Learn More
            </a>
          </div>
        </Reveal>

      </div>
    </section>
  );
}
