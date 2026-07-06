import Image from "next/image";

/**
 * Payment / trust badges for the footer, exported directly from Figma so
 * they match the design exactly (the previous version hand-drew the marks
 * as inline SVGs, which never matched the real brand artwork).
 *
 * Order and sizes per Figma node 141:2887 (left → right):
 *   1. LegitScript Certified   — 83 × 89  (bitmap, exported as PNG)
 *   2. Registered Pharmacy     — 123 × 50 (bitmap, exported as PNG)
 *   3. Apple Pay               — 38 × 24  (vector SVG)
 *   4. Google Pay              — 38 × 24  (vector SVG)
 *   5. Stripe                  — 50 × 20  (vector SVG)
 */

type Badge = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Bare wordmark (no chip baked into the artwork) — render it inside a
   * white chip so it matches the Apple Pay / Google Pay card chips. */
  chip?: boolean;
};

const TRUST_BADGES: Badge[] = [
  {
    src: "/assets/footer/legitscript.png",
    alt: "LegitScript Certified",
    width: 83,
    height: 89,
  },
  {
    src: "/assets/footer/registered-pharmacy.png",
    alt: "Registered Pharmacy 9012990",
    width: 123,
    height: 50,
  },
];

const PAYMENT_ICONS: Badge[] = [
  {
    src: "/assets/footer/apple-pay.svg",
    alt: "Apple Pay",
    width: 38,
    height: 24,
  },
  {
    src: "/assets/footer/google-pay.svg",
    alt: "Google Pay",
    width: 38,
    height: 24,
  },
  {
    src: "/assets/footer/stripe.svg",
    alt: "Stripe",
    width: 50,
    height: 20,
    chip: true,
  },
];

/**
 * Layout mirrors the Figma footer block (node I141:2887;4419:71862):
 *   - The two trust badges sit on the left, the three payment chips form
 *     a compact row at the right.
 *   - Every badge renders at the SAME height (h-10) with its width
 *     auto-scaling, so the row reads as one consistent strip.
 *   - Below the `sm` breakpoint, the row wraps so the payment chips drop
 *     to a second line.
 */
export default function PaymentBadges() {
  return (
    <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-3 sm:flex-nowrap">
      {TRUST_BADGES.map((b) => (
        <Image
          key={b.src}
          src={b.src}
          alt={b.alt}
          width={b.width}
          height={b.height}
          className="h-10 w-auto select-none"
          priority={false}
        />
      ))}
      <ul className="flex items-center gap-x-2 sm:ml-1">
        {PAYMENT_ICONS.map((b) => (
          <li
            key={b.src}
            className={
              b.chip
                ? "inline-flex h-10 items-center rounded-lg bg-white px-3"
                : "inline-flex items-center"
            }
          >
            <Image
              src={b.src}
              alt={b.alt}
              width={b.width}
              height={b.height}
              className={`w-auto select-none ${b.chip ? "h-5" : "h-10"}`}
              priority={false}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
