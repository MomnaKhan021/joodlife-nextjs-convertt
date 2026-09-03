import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import {
  WEGOVY_DEFAULT,
  type WegovyHowItWorks,
} from "@/lib/wegovyContentTypes";

/**
 * "How do Wegovy pills work?" — Figma node 1:1725.
 * 1440×889, r=32. Full-bleed gradient bg. Heading weight=400, centred.
 * 4 absolute callouts with L-connectors: left at 18%, right at ~86%.
 * Mobile: same overlay layout, scaled height.
 */

/** Position and connector art for one corner. The words come from the CMS. */
type Callout = {
  pos: string;
  mobilePos: string;
  align: "text-left" | "text-right";
  connector: React.ReactNode;
  mobileConnector: React.ReactNode;
  /** Bottom callouts: render connector above text so line points UP toward pill */
  connectorFirst?: boolean;
};

/* Desktop L-connectors — clean right-angle bend (vertical + horizontal),
   dot at the pill end, matching Figma. */
const ConnectorRightDown = () => (
  <svg width="200" height="46" viewBox="0 0 200 46" fill="none" className="block">
    <path d="M1 2 V32 H188" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="188" cy="32" r="2.5" fill="white" />
  </svg>
);
const ConnectorRightUp = () => (
  <svg width="200" height="46" viewBox="0 0 200 46" fill="none" className="block">
    <path d="M1 44 V14 H188" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="188" cy="14" r="2.5" fill="white" />
  </svg>
);
const ConnectorLeftDown = () => (
  <svg width="200" height="46" viewBox="0 0 200 46" fill="none" className="block">
    <path d="M199 2 V32 H12" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="32" r="2.5" fill="white" />
  </svg>
);
const ConnectorLeftUp = () => (
  <svg width="200" height="46" viewBox="0 0 200 46" fill="none" className="block">
    <path d="M199 44 V14 H12" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="14" r="2.5" fill="white" />
  </svg>
);

/* Mobile connectors — same clean right-angle style, shorter reach. */
const MobileConnectorRightDown = () => (
  <svg width="110" height="34" viewBox="0 0 110 34" fill="none" className="block">
    <path d="M1 2 V24 H98" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="98" cy="24" r="2.5" fill="white" />
  </svg>
);
const MobileConnectorRightUp = () => (
  <svg width="110" height="34" viewBox="0 0 110 34" fill="none" className="block">
    <path d="M1 32 V10 H98" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="98" cy="10" r="2.5" fill="white" />
  </svg>
);
const MobileConnectorLeftDown = () => (
  <svg width="110" height="34" viewBox="0 0 110 34" fill="none" className="block">
    <path d="M109 2 V24 H12" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="24" r="2.5" fill="white" />
  </svg>
);
const MobileConnectorLeftUp = () => (
  <svg width="110" height="34" viewBox="0 0 110 34" fill="none" className="block">
    <path d="M109 32 V10 H12" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="2.5" fill="white" />
  </svg>
);

const CALLOUTS: Callout[] = [
  {
    /* Figma: x=18.7%, y=24.6% — top-left */
    pos: "left-[18%] top-[24%]",
    mobilePos: "left-[2%] top-[22%]",
    align: "text-left",
    connector: <ConnectorRightDown />,
    mobileConnector: <MobileConnectorRightDown />,
  },
  {
    /* Figma: right text at x=74%, y=24.5% — top-right */
    pos: "right-[14%] top-[24%]",
    mobilePos: "right-[2%] top-[22%]",
    align: "text-right",
    connector: <ConnectorLeftDown />,
    mobileConnector: <MobileConnectorLeftDown />,
  },
  {
    /* Figma: x=18.7%, y=58% — bottom-left */
    pos: "left-[18%] bottom-[18%]",
    mobilePos: "left-[2%] bottom-[16%]",
    align: "text-left",
    connector: <ConnectorRightUp />,
    mobileConnector: <MobileConnectorRightUp />,
    connectorFirst: true,
  },
  {
    /* Figma: right text at x=71%, y=58% — bottom-right */
    pos: "right-[14%] bottom-[18%]",
    mobilePos: "right-[2%] bottom-[16%]",
    align: "text-right",
    connector: <ConnectorLeftUp />,
    mobileConnector: <MobileConnectorLeftUp />,
    connectorFirst: true,
  },
];

export default function HowItWorks({
  content = WEGOVY_DEFAULT.howItWorks,
}: {
  content?: WegovyHowItWorks;
}) {
  return (
    <section
      aria-label="How Wegovy pills work"
      className="relative w-full overflow-hidden rounded-[32px] min-h-[600px] md:min-h-[889px]"
    >
      {/* Background pill image */}
      <Image
        src={content.image}
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
          <h2 className="font-display text-[26px] font-normal leading-[1.15] tracking-[-0.02em] text-white sm:text-[32px] md:text-[40px] lg:text-[48px] lg:leading-[52px]">
            {content.heading}{" "}
            <em className="font-serif italic">{content.headingAccent}</em>
          </h2>
          <p className="mx-auto mt-4 max-w-[580px] font-ui text-[13px] leading-[20px] text-white/90 md:text-[16.3px] md:leading-[24px]">
            {content.intro}
          </p>
        </Reveal>

        {/* Callout overlay — shown on ALL screen sizes */}
        <div className="relative mx-auto w-full flex-1" style={{ minHeight: 300 }}>
          {/* Desktop (lg+) — wide layout tuned to the full-width pill */}
          {CALLOUTS.map((c, i) => (
            <div
              key={i}
              className={`absolute ${c.pos} hidden max-w-[220px] flex-col gap-0 lg:flex ${
                c.align === "text-right" ? "items-end" : "items-start"
              }`}
            >
              {c.connectorFirst && c.connector}
              <p className="whitespace-pre-line font-ui text-[18px] font-semibold leading-[24px] text-white">
                {content.callouts[i]}
              </p>
              {!c.connectorFirst && c.connector}
            </div>
          ))}

          {/* Mobile + tablet (< lg) — callouts live inside a centred, capped
              zone (absolute inset-0 keeps full height, max-w keeps them near
              the centred pill) so the connector arrows always meet the pill
              instead of drifting to the far edges. */}
          <div className="absolute inset-0 mx-auto max-w-[440px] lg:hidden">
            {CALLOUTS.map((c, i) => (
              <div
                key={`m-${i}`}
                className={`absolute ${c.mobilePos} flex max-w-[130px] flex-col gap-0 ${
                  c.align === "text-right" ? "items-end" : "items-start"
                }`}
              >
                {c.connectorFirst && c.mobileConnector}
                <p className={`whitespace-pre-line font-ui text-[11px] font-semibold leading-[14px] text-white sm:text-[13px] sm:leading-[17px] ${c.align}`}>
                  {content.callouts[i]}
                </p>
                {!c.connectorFirst && c.mobileConnector}
              </div>
            ))}
          </div>
        </div>

        {/* Description + buttons — centred */}
        <Reveal as="div" className="mx-auto mt-4 max-w-[690px] text-center" delay={120}>
          <p className="font-ui text-[13px] leading-[20px] text-white/90 md:text-[16.3px] md:leading-[24px]">
            {content.body}
          </p>
          <div className="mt-7 flex items-center justify-center gap-4">
            {content.ctaLabel ? (
              <a
                href={content.ctaHref}
                className="inline-flex h-[50px] items-center justify-center rounded-lg bg-[#142e2a] px-9 font-ui text-[16.3px] font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-[#0c2421]"
              >
                {content.ctaLabel}
              </a>
            ) : null}
            {/* Second button defaults to #faq — the tablet's own questions,
                further down this page, rather than the injection page. */}
            {content.secondaryLabel ? (
              <a
                href={content.secondaryHref}
                className="inline-flex h-[50px] items-center justify-center rounded-lg border border-white/40 bg-white/[0.08] px-9 font-ui text-[16.3px] font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-white/15"
              >
                {content.secondaryLabel}
              </a>
            ) : null}
          </div>
        </Reveal>

      </div>
    </section>
  );
}
