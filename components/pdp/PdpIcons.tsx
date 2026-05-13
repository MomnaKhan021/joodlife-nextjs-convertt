/**
 * Inline SVG icons for the PDP page. Keeps icons sharp at every DPR
 * and avoids relying on bitmap assets that we don't have.
 */

const ICON_PROPS = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": true,
} as const;

export function ConsultationIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        stroke="#142e2a"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PersonalizedIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path
        d="M10.5 3.5l-7 7a3 3 0 0 0 4.243 4.243l7-7a3 3 0 1 0-4.243-4.243z"
        stroke="#142e2a"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 13l5 5a3 3 0 0 1-4.243 4.243l-5-5"
        stroke="#142e2a"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SupportIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path
        d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"
        stroke="#142e2a"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 12l3 3 5-6"
        stroke="#142e2a"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckinIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        stroke="#142e2a"
        strokeWidth="1.7"
      />
      <path
        d="M16 2v4M8 2v4M3 10h18"
        stroke="#142e2a"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M8 14l2.5 2.5L16 11"
        stroke="#142e2a"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TruckIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path
        d="M1 3h15v13H1zM16 8h4l3 3v5h-7z"
        stroke="#142e2a"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="5.5" cy="18.5" r="2.5" stroke="#142e2a" strokeWidth="1.7" />
      <circle cx="18.5" cy="18.5" r="2.5" stroke="#142e2a" strokeWidth="1.7" />
    </svg>
  );
}

export function ShieldIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke="#142e2a"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="#142e2a"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect
        x="3"
        y="11"
        width="18"
        height="11"
        rx="2"
        stroke="#142e2a"
        strokeWidth="1.7"
      />
      <path
        d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke="#142e2a"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MeasureIcon() {
  return (
    <svg {...ICON_PROPS} width="36" height="36" viewBox="0 0 36 36">
      <path
        d="M18 6a12 12 0 1 0 0 24 12 12 0 0 0 0-24z"
        stroke="#142e2a"
        strokeWidth="1.6"
      />
      <path
        d="M12 14h12M12 18h12M12 22h12"
        stroke="#142e2a"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckCircleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="10" cy="10" r="10" fill="#142e2a" />
      <path
        d="M6 10.5l2.6 2.5L14 8"
        stroke="#dff49f"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlusIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{
        transition: "transform 280ms ease-out",
        transform: open ? "rotate(45deg)" : "rotate(0deg)",
      }}
    >
      <path
        d="M10 4v12M4 10h12"
        stroke="#142e2a"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const ICON_MAP = {
  consultation: ConsultationIcon,
  personalized: PersonalizedIcon,
  support: SupportIcon,
  checkin: CheckinIcon,
  truck: TruckIcon,
  shield: ShieldIcon,
  lock: LockIcon,
} as const;
