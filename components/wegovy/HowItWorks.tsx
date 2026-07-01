import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

/**
 * "How do Wegovy pills work?" — Figma node 1:1725.
 * 1440×889, r=32. Full-bleed gradient bg. Heading weight=400, centred.
 * 4 absolute callouts with L-connectors: left at 18%, right at ~86%.
 * Mobile: same overlay layout, scaled height.
 */

type Callout = {
  label: string;
  pos: string;
  mobilePos: string;
  align: "text-left" | "text-right";
  connector: React.ReactNode;
  mobileConnector: React.ReactNode;
};

/* Desktop L-connectors (white, 1.2px stroke, dot at bend) */
const ConnectorRightDown = () => (
  <svg width="200" height="30" viewBox="0 0 200 30" fill="none" className="block">
    <path d="M0 4 H140 L192 28" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="192" cy="28" r="3" fill="white" />
  </svg>
);
const ConnectorRightUp = () => (
  <svg width="200" height="30" viewBox="0 0 200 30" fill="none" className="block">
    <path d="M0 26 H140 L192 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="192" cy="2" r="3" fill="white" />
  </svg>
);
const ConnectorLeftDown = () => (
  <svg width="200" height="30" viewBox="0 0 200 30" fill="none" className="block">
    <path d="M200 4 H60 L8 28" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="8" cy="28" r="3" fill="white" />
  </svg>
);
const ConnectorLeftUp = () => (
  <svg width="200" height="30" viewBox="0 0 200 30" fill="none" className="block">
    <path d="M200 26 H60 L8 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="8" cy="2" r="3" fill="white" />
  </svg>
);

/* Mobile connectors (shorter) */
const MobileConnectorRightDown = () => (
  <svg width="90" height="24" viewBox="0 0 90 24" fill="none" className="block">
    <path d="M0 4 H58 L86 22" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="86" cy="22" r="3" fill="white" />
  </svg>
);
const MobileConnectorRightUp = () => (
  <svg width="90" height="24" viewBox="0 0 90 24" fill="none" className="block">
    <path d="M0 20 H58 L86 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="86" cy="2" r="3" fill="white" />
  </svg>
);
const MobileConnectorLeftDown = () => (
  <svg width="90" height="24" viewBox="0 0 90 24" fill="none" className="block">
    <path d="M90 4 H32 L4 22" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="4" cy="22" r="3" fill="white" />
  </svg>
);
const MobileConnectorLeftUp = () => (
  <svg width="90" height="24" viewBox="0 0 90 24" fill="none" className="block">
    <path d="M90 20 H32 L4 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="4" cy="2" r="3" fill="white" />
  </svg>
);

const CALLOUTS: Callout[] = [
  {
    label: "Reduces cravings",
    /* Figma: x=18.7%, y=24.6% — top-left */
    pos: "left-[18%] top-[24%]",
    mobilePos: "left-[2%] top-[22%]",
    align: "text-left",
    connector: <ConnectorRightDown />,
    mobileConnector: <MobileConnectorRightDown />,
  },
  {
    label: "Slow down\nyour digestion",
    /* Figma: right text at x=74%, y=24.5% — top-right */
    pos: "right-[14%] top-[24%]",
    mobilePos: "right-[2%] top-[22%]",
    align: "text-right",
    connector: <ConnectorLeftDown />,
    mobileConnector: <MobileConnectorLeftDown />,
  },
  {
    label: "Regulate your blood\nsugar⁵.",
    /* Figma: x=18.7%, y=58% — bottom-left */
    pos: "left-[18%] bottom-[18%]",
    mobilePos: "left-[2%] bottom-[16%]",
    align: "text-left",
    connector: <ConnectorRightUp />,
    mobileConnector: <MobileConnectorRightUp />,
  },
  {
    label: "Regulate your\nappetite⁴",
    /* Figma: right text at x=71%, y=58% — bottom-right */
    pos: "right-[14%] bottom-[18%]",
    mobilePos: "right-[2%] bottom-[16%]",
    align: "text-right",
    connector: <ConnectorLeftUp />,
    mobileConnector: <MobileConnectorLeftUp />,
  },
];

export default function HowItWorks() {
  return (
    <section
      aria-label="How Wegovy pills work"
      className="relative w-full overflow-hidden rounded-[32px] min-h-[600px] md:min-h-[889px]"
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

      {/* Olive gradient overlay */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, rgba(104,114,86,0) 0%, rgba(104,114,86,0.6) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col px-[40px] py-[60px] md:px-[60px]">

        {/* Heading + subtitle — centred, max-w 580px */}
        <Reveal as="div" className="mx-auto max-w-[640px] text-center">
          <h2 className="font-display text-[30px] font-normal leading-[1.15] tracking-[-0.02em] text-white md:text-[48px] md:leading-[52px]">
            How Do{" "}
            <em className="font-serif italic">Wegovy Pills Work?</em>
          </h2>
          <p className="mx-auto mt-4 max-w-[580px] font-ui text-[13px] leading-[20px] text-white/90 md:text-[16.3px] md:leading-[24px]">
            The Wegovy pill contains semaglutide, which is known as a GLP-1
            receptor agonist. This means it works by mimicking the natural GLP-1
            hormone found in your gut. The hormone's job is to help:
          </p>
        </Reveal>

        {/* Callout overlay — shown on ALL screen sizes */}
        <div className="relative mx-auto w-full flex-1" style={{ minHeight: 300 }}>
          {CALLOUTS.map((c) => (
            <div
              key={c.label}
              className={`absolute ${c.pos} hidden max-w-[220px] flex-col gap-0 md:flex ${
                c.align === "text-right" ? "items-end" : "items-start"
              }`}
            >
              <p className="whitespace-pre-line font-ui text-[20px] font-semibold leading-[26px] text-white md:text-[25px] md:leading-[30px]">
                {c.label}
              </p>
              {c.connector}
            </div>
          ))}

          {/* Mobile callouts — same overlay but scaled */}
          {CALLOUTS.map((c) => (
            <div
              key={`m-${c.label}`}
              className={`absolute ${c.mobilePos} flex max-w-[120px] flex-col gap-0 md:hidden ${
                c.align === "text-right" ? "items-end" : "items-start"
              }`}
            >
              <p className={`whitespace-pre-line font-ui text-[11px] font-semibold leading-[14px] text-white ${c.align}`}>
                {c.label}
              </p>
              {c.mobileConnector}
            </div>
          ))}
        </div>

        {/* Description + buttons — centred */}
        <Reveal as="div" className="mx-auto mt-4 max-w-[690px] text-center" delay={120}>
          <p className="font-ui text-[13px] leading-[20px] text-white/90 md:text-[16.3px] md:leading-[24px]">
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
              className="inline-flex h-[50px] items-center justify-center rounded-lg border border-white/40 bg-white/[0.08] px-9 font-ui text-[16.3px] font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-white/15"
            >
              Learn More
            </a>
          </div>
        </Reveal>

      </div>
    </section>
  );
}
