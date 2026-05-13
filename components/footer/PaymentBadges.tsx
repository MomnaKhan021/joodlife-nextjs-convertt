/**
 * Payment / trust badges for the footer, rendered as inline SVGs so
 * they stay sharp at any DPR and don't depend on bitmap assets.
 *
 * Order per Figma node 141:2887 (left → right):
 *   1. LegitScript Certified
 *   2. Registered Pharmacy
 *   3. Apple Pay
 *   4. Google Pay
 *   5. Stripe
 */

function LegitScriptBadge() {
  return (
    <svg
      width="60"
      height="74"
      viewBox="0 0 60 74"
      fill="none"
      role="img"
      aria-label="LegitScript Certified"
    >
      <path
        d="M30 2 L56 12 V40 C56 56 30 70 30 70 C30 70 4 56 4 40 V12 L30 2 Z"
        fill="#3b3f6f"
      />
      <text
        x="30"
        y="32"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="9"
        fontWeight="700"
        fill="#ffffff"
      >
        LegitScript
      </text>
      <text
        x="30"
        y="44"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="7"
        fill="#a8b0d8"
      >
        Certified
      </text>
      <circle cx="30" cy="58" r="6" fill="#19c37d" />
      <path
        d="M27 58 L29 60 L33 56"
        stroke="#ffffff"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RegisteredPharmacyBadge() {
  return (
    <svg
      width="120"
      height="50"
      viewBox="0 0 120 50"
      fill="none"
      role="img"
      aria-label="Registered Pharmacy"
    >
      <rect x="0" y="0" width="120" height="50" rx="3" fill="#ffffff" />
      <path d="M0 8 L120 8" stroke="#2a8642" strokeWidth="2" />
      <path d="M0 42 L120 42" stroke="#2a8642" strokeWidth="2" />
      <text
        x="60"
        y="22"
        textAnchor="middle"
        fontFamily="serif"
        fontSize="11"
        fontWeight="700"
        fontStyle="italic"
        fill="#2a8642"
      >
        Registered
      </text>
      <text
        x="60"
        y="34"
        textAnchor="middle"
        fontFamily="serif"
        fontSize="13"
        fontWeight="700"
        fontStyle="italic"
        fill="#2a8642"
      >
        Pharmacy
      </text>
      <text
        x="60"
        y="48"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="7"
        letterSpacing="1.5"
        fill="#2a8642"
      >
        9012990
      </text>
    </svg>
  );
}

function ApplePayBadge() {
  return (
    <svg
      width="46"
      height="28"
      viewBox="0 0 46 28"
      fill="none"
      role="img"
      aria-label="Apple Pay"
    >
      <rect width="46" height="28" rx="4" fill="#ffffff" />
      <path
        d="M11.5 9.6c.4-.5.7-1.2.6-1.9-.6 0-1.4.4-1.8.9-.4.5-.7 1.2-.6 1.9.7 0 1.4-.3 1.8-.9zm.6.9c-1 0-1.8.6-2.3.6-.5 0-1.3-.6-2.1-.6-1.1 0-2.1.6-2.7 1.7-1.1 2-.3 4.9.8 6.5.5.8 1.2 1.7 2 1.7.8 0 1.1-.5 2.1-.5s1.3.5 2.1.5c.9 0 1.4-.8 2-1.6.6-.9.9-1.8.9-1.8s-1.6-.6-1.7-2.5c0-1.6 1.3-2.3 1.4-2.3-.7-1.1-2-1.7-2.5-1.7zm5.4-2.6v11.5h1.8v-3.9h2.5c2.3 0 3.9-1.6 3.9-3.8s-1.6-3.8-3.8-3.8h-4.4zm1.8 1.5h2.1c1.5 0 2.4.8 2.4 2.3s-.9 2.3-2.4 2.3h-2.1V9.4z"
        fill="#000000"
      />
      <text
        x="29"
        y="19"
        fontFamily="Arial, sans-serif"
        fontSize="11"
        fontWeight="500"
        fill="#000000"
      >
        Pay
      </text>
    </svg>
  );
}

function GooglePayBadge() {
  return (
    <svg
      width="56"
      height="28"
      viewBox="0 0 56 28"
      fill="none"
      role="img"
      aria-label="Google Pay"
    >
      <rect width="56" height="28" rx="4" fill="#ffffff" />
      <text
        x="6"
        y="19"
        fontFamily="Arial, sans-serif"
        fontSize="13"
        fontWeight="500"
      >
        <tspan fill="#4285F4">G</tspan>
        <tspan fill="#EA4335">o</tspan>
        <tspan fill="#FBBC04">o</tspan>
        <tspan fill="#4285F4">g</tspan>
        <tspan fill="#34A853">l</tspan>
        <tspan fill="#EA4335">e</tspan>
      </text>
      <text
        x="38"
        y="19"
        fontFamily="Arial, sans-serif"
        fontSize="11"
        fontWeight="500"
        fill="#5f6368"
      >
        Pay
      </text>
    </svg>
  );
}

function StripeBadge() {
  return (
    <svg
      width="56"
      height="28"
      viewBox="0 0 56 28"
      fill="none"
      role="img"
      aria-label="Stripe"
    >
      <rect width="56" height="28" rx="4" fill="#ffffff" />
      <text
        x="28"
        y="19"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="14"
        fontWeight="700"
        fontStyle="italic"
        fill="#635BFF"
      >
        stripe
      </text>
    </svg>
  );
}

/**
 * Responsive layout strategy:
 *   - Mobile: 5 badges arranged in a wrapping row, each badge gets a
 *     fixed size and centred alignment. The trust badges (LegitScript /
 *     Registered Pharmacy) come first; the payment chips (Apple Pay /
 *     Google Pay / Stripe) wrap onto a second row if needed.
 *   - Tablet+ : everything on one row.
 *
 * We also drop the inner div wrappers and use a single flex container
 * with `flex-wrap`, `gap-y-3 gap-x-3` so wrapping doesn't introduce
 * uneven gaps. Each badge sets its own fixed pixel dimensions, so they
 * never get squashed when the row wraps.
 */
export default function PaymentBadges() {
  return (
    <div className="flex flex-wrap items-center justify-start gap-x-3 gap-y-3 md:flex-nowrap md:gap-x-4">
      <div className="inline-flex h-[54px] items-center md:h-[60px]">
        <LegitScriptBadge />
      </div>
      <div className="inline-flex h-[44px] items-center md:h-[50px]">
        <RegisteredPharmacyBadge />
      </div>
      <div className="inline-flex h-[28px] items-center">
        <ApplePayBadge />
      </div>
      <div className="inline-flex h-[28px] items-center">
        <GooglePayBadge />
      </div>
      <div className="inline-flex h-[28px] items-center">
        <StripeBadge />
      </div>
    </div>
  );
}
