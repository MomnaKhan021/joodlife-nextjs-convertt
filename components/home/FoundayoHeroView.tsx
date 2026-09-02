import Image from "next/image";
import Link from "next/link";

import { CATEGORIES, type Category, type CategoryKey } from "@/lib/categories";
import { SecondaryCard } from "@/components/home/HeroGateway";

/**
 * Foundayo gateway hero — Figma "Home Page - Hero - Next.js", node 1:59.
 *
 *  ┌──────────────────────────┬───────────────┐
 *  │  Foundayo tablet (peach   │ Men's health  │
 *  │  card) + pill artwork     │ → /erectile-… │
 *  │  → Explore Foundayo       ├───────────────┤
 *  │                           │ Women's health│
 *  └──────────────────────────┴───────────────┘
 *
 * Desktop: same 2-column gateway grid as HeroGateway (whose SecondaryCard is
 * reused for the right column); the primary card swaps the green weight-loss
 * panel for the peach Foundayo announcement. Mobile: cards stack, the pill
 * sits below the CTA, and the three features form divided columns.
 *
 * Pill artwork lives at /assets/home/foundayo-pill.png (exported from the
 * Figma design — transparent PNG).
 */

/** Icon keys an editor can choose from, mapped to the drawn components. */
const ICONS = {
  tablet: TabletIcon,
  syringe: SyringeIcon,
  heart: HeartIcon,
} as const;

export type HeroFeatureProp = { label: string; icon: keyof typeof ICONS };

export type HeroContent = {
  badge?: string;
  title?: string;
  titleEmphasis?: string;
  body?: string;
  features?: HeroFeatureProp[];
  ctaLabel?: string;
  ctaHref?: string;
  image?: string;
};

const DEFAULT_FEATURES: HeroFeatureProp[] = [
  { icon: "tablet", label: "Oral tablet\ntreatment" },
  { icon: "syringe", label: "No\ninjections" },
  { icon: "heart", label: "Clinician\nsupport" },
];

function FoundayoCard({
  badge = "New",
  title = "A new tablet option",
  titleEmphasis = "for weight management",
  body = "Foundayo® (oral tirzepatide) is a new weight management treatment option, available following clinician assessment.",
  features,
  ctaLabel = "Explore Foundayo",
  ctaHref = "/consultation?product=weight-loss",
  image = "/assets/home/foundayo-pill.png",
}: HeroContent = {}) {
  const FEATURES = features?.length ? features : DEFAULT_FEATURES;
  return (
    <div className="relative flex min-h-full flex-col overflow-hidden rounded-[24px] bg-[#fdf0ea] p-6 md:p-8 lg:min-h-[450px] lg:justify-center lg:p-12">
      {/* Copy — left column on desktop; the pill stays right of it. */}
      <div className="relative z-10 flex flex-col gap-4 lg:max-w-[62%]">
        <span className="inline-flex w-fit items-center rounded-md bg-[#ffcebf] px-3 py-1 font-ui text-[13px] font-semibold text-[#142e2a]">
          {badge}
        </span>

        <h1 className="font-display text-[30px] font-medium leading-[1.12] tracking-[-0.02em] text-[#142e2a] sm:text-[36px] lg:text-[36px] lg:leading-[1.1] min-[1400px]:text-[42px]">
          {title}
          <br />
          <em className="font-serif font-normal italic text-[#d27d6a]">
            {titleEmphasis}
          </em>
        </h1>

        <p className="max-w-[44ch] font-ui text-[13px] leading-[1.55] text-[#142e2a]/80 md:text-[15px]">
          {body}
        </p>

        {/* Features — desktop: icon left of a two-line label; mobile: three
            divided columns with the icon above the label (per the Figma). */}
        <ul className="grid grid-cols-3 divide-x divide-[#142e2a]/15 lg:flex lg:gap-8 lg:divide-x-0">
          {FEATURES.map((f, i) => {
            const Icon = ICONS[f.icon] ?? TabletIcon;
            return (
              <li
                key={i}
                className="flex flex-col items-start gap-2 px-3 first:pl-0 last:pr-0 lg:flex-row lg:items-center lg:px-0"
              >
                <span className="text-[#d27d6a]">
                  <Icon />
                </span>
                <span className="whitespace-pre-line font-ui text-[12px] font-medium leading-[1.25] text-[#142e2a] md:text-[13px]">
                  {f.label}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-1">
          <Link
            href={ctaHref}
            className="btn-cta inline-flex h-[48px] items-center justify-center rounded-lg bg-[#142e2a] px-6 font-ui text-[15px] font-semibold text-white hover:bg-[#0c2421]"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>

      {/* Desktop: pill artwork — right half of the card, vertically centred. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-6 right-6 z-0 hidden w-[40%] lg:block"
      >
        <Image
          src={image}
          alt=""
          fill
          priority
          quality={90}
          sizes="480px"
          className="object-contain object-center"
        />
      </div>

      {/* Mobile: pill below the CTA. */}
      <div className="relative mt-6 h-[260px] w-full lg:hidden">
        <Image
          src={image}
          alt="Foundayo oral tablet"
          fill
          priority
          quality={90}
          sizes="90vw"
          className="object-contain object-center"
        />
      </div>
    </div>
  );
}

/**
 * Presentational only — no async, no data access — so it stays safe from a
 * client boundary. FoundayoHero.tsx is the server wrapper that feeds it.
 */
export default function FoundayoHeroView({
  categories,
  ...content
}: HeroContent & {
  /** Merged treatment categories; falls back to the built-in ones. */
  categories?: Record<CategoryKey, Category>;
} = {}) {
  const CATS = categories ?? CATEGORIES;
  return (
    <section
      aria-label="Explore our treatments"
      className="w-full overflow-x-hidden bg-white"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-5 pt-6 md:px-10 md:pt-[30px] lg:px-[60px]">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.85fr_1fr]">
          <div className="min-w-0">
            <FoundayoCard {...content} />
          </div>
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <SecondaryCard category={CATS["erectile-dysfunction"]} />
            <SecondaryCard category={CATS["period-delay"]} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- Coral feature icons — exact SVG exports from the Figma design ---- */

/** Oral tablet — filled pill lying across a round tablet. */
function TabletIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="currentColor" aria-hidden>
      <path d="M13.5278 15.7658H1.72772C1.45585 15.7658 1.23516 15.9865 1.23516 16.2584C1.23516 16.5302 1.45585 16.7509 1.72772 16.7509H13.5278C13.8002 16.7509 14.0204 16.5302 14.0204 16.2584C14.0204 15.9864 13.7997 15.7658 13.5278 15.7658Z" />
      <path d="M25.9072 11.2939C22.942 8.32525 19.5586 6.40723 17.2875 6.40723C16.4935 6.40723 15.8615 6.63628 15.4098 7.08892C13.6445 8.85572 15.4896 13.4714 19.6098 17.5966C22.575 20.5652 25.9583 22.4832 28.2295 22.4832C29.024 22.4832 29.656 22.2537 30.1076 21.8015C31.8725 20.0348 30.0274 15.419 25.9072 11.2939ZM29.4107 21.1055C29.1501 21.3661 28.7527 21.4981 28.2296 21.4981C26.2382 21.4981 23.0538 19.6505 20.3069 16.9006C16.3861 12.9755 14.9464 8.94642 16.1063 7.78497C16.3669 7.52441 16.7644 7.3924 17.2875 7.3924C19.2793 7.3924 22.4632 9.23998 25.2102 11.9899C29.1309 15.9151 30.5706 19.9441 29.4107 21.1055Z" />
      <path d="M30.1072 21.1051C29.9146 20.913 29.6028 20.9124 29.4107 21.1055C29.1501 21.3661 28.7527 21.4981 28.2296 21.4981C26.2382 21.4981 23.0538 19.6505 20.3069 16.9006C16.3861 12.9755 14.9464 8.94642 16.1063 7.78497C16.2984 7.59238 16.2984 7.28065 16.1058 7.08857C15.9132 6.8965 15.6019 6.89581 15.4098 7.08892C15.4094 7.08944 15.4079 7.09059 15.4069 7.09157L12.2595 10.2424C10.4946 12.0092 12.3398 16.6249 16.46 20.7501C19.5098 23.8029 22.8489 25.6071 25.093 25.6071C25.8288 25.6071 26.4475 25.413 26.8992 25.0052C26.9194 24.9899 26.939 24.9737 26.9573 24.955L30.1076 21.8015C30.2998 21.6088 30.2998 21.2972 30.1072 21.1051ZM26.3022 24.218C26.2894 24.2279 26.2771 24.2392 26.2647 24.2505C25.0806 25.3937 21.0491 23.9505 17.1569 20.0544C13.2362 16.1292 11.7964 12.1002 12.9564 10.9388L14.7453 9.14732C14.8438 11.3805 16.6333 14.6162 19.6098 17.5966C22.4932 20.4829 25.7721 22.3768 28.0389 22.4793L26.3022 24.218Z" />
      <path d="M30.1072 21.1051L16.1058 7.08857C15.9132 6.8965 15.6019 6.89581 15.4098 7.08892C15.2172 7.28099 15.2178 7.59238 15.4098 7.78498L29.4107 21.8016C29.5072 21.8976 29.6333 21.9459 29.7594 21.9459C29.8854 21.9459 30.011 21.8976 30.1076 21.8015C30.2998 21.6088 30.2998 21.2972 30.1072 21.1051Z" />
      <path d="M16.5339 19.4048C14.1903 16.878 12.6727 14.1561 12.5737 12.3021C12.5599 12.0445 12.3501 11.8416 12.0925 11.8357L11.9364 11.8318C11.8181 11.8283 11.6994 11.8254 11.5787 11.8254C5.77846 11.8254 1.23516 13.7724 1.23516 16.2584C1.23516 18.7443 5.77846 20.6914 11.5788 20.6914C13.2284 20.6914 14.8085 20.5333 16.2753 20.2215C16.4487 20.185 16.5885 20.0574 16.6422 19.8885C16.696 19.7196 16.6545 19.5348 16.5339 19.4048ZM11.5788 19.7062C6.06366 19.7062 2.22028 17.8892 2.22028 16.2584C2.22028 14.6275 6.06366 12.8105 11.5788 12.8105C11.598 12.8105 11.6177 12.8105 11.6364 12.8105C11.9098 14.6709 13.2338 17.1076 15.2237 19.4171C14.0696 19.6068 12.8259 19.7062 11.5788 19.7062Z" />
      <path d="M20.0083 22.4783C19.0267 21.7819 18.0676 20.9662 17.1569 20.0544C16.9422 19.8392 16.7358 19.6225 16.5339 19.4048C16.4162 19.2777 16.2398 19.2216 16.0703 19.258C14.6907 19.5511 13.1377 19.7062 11.5788 19.7062C6.06366 19.7062 2.22028 17.8892 2.22028 16.2584C2.22028 15.9865 1.99959 15.7658 1.72772 15.7658C1.45585 15.7658 1.23516 15.9865 1.23516 16.2584L1.23511 20.6914C1.23511 23.1773 5.77841 25.1244 11.5787 25.1244C14.9133 25.1244 18.0519 24.4437 19.9743 23.3034C20.1176 23.2182 20.2083 23.0665 20.2152 22.9C20.2221 22.7335 20.1443 22.5749 20.0083 22.4783ZM11.5788 24.1392C6.06366 24.1392 2.22028 22.3222 2.22028 20.6913V18.1784C3.86194 19.6772 7.39305 20.6914 11.5788 20.6914C13.1264 20.6914 14.6125 20.5525 16.0019 20.2781C16.1512 20.4362 16.3034 20.5934 16.46 20.7501C17.2116 21.5027 17.9963 22.1937 18.7996 22.8099C16.9989 23.6491 14.3726 24.1392 11.5788 24.1392Z" />
    </svg>
  );
}

/** No injections — syringe with a crossed-out circle. */
function SyringeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 3.5 32 32" fill="none" stroke="currentColor" strokeWidth="1.2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M13.7688 12.824C13.7688 16.3836 10.8831 19.2693 7.32349 19.2693C3.76386 19.2693 0.878174 16.3836 0.878174 12.824C0.878174 9.26435 3.76386 6.37866 7.32349 6.37866C10.8831 6.37866 13.7688 9.26435 13.7688 12.824Z" />
      <path d="M2.76587 8.26657L11.8809 17.3816" />
      <path d="M28.2414 9.54403L23.167 6.61434C22.3263 6.12895 21.2512 6.417 20.7659 7.2577C20.2804 8.09846 20.5685 9.17354 21.4092 9.65899L26.4836 12.5887C27.3244 13.0741 28.3994 12.786 28.8848 11.9452C29.3702 11.1045 29.0822 10.0294 28.2414 9.54403Z" />
      <path d="M26.1695 17.8201L17.0356 12.5466" />
      <path d="M24.6468 16.941L18.5576 13.4254L10.6474 27.1262C10.162 27.9669 10.45 29.0419 11.2908 29.5274L14.3355 31.2852C15.1762 31.7706 16.2512 31.4826 16.7367 30.6418L24.6468 16.941Z" />
      <path d="M25.4684 12.0028L22.4238 10.245L20.0801 14.3044L23.1247 16.0623L25.4684 12.0028Z" />
      <path d="M11.5266 25.604L13.0489 26.4829" />
      <path d="M13.2844 22.5591L15.8216 24.0239" />
      <path d="M15.0422 19.5146L21.1315 23.0303" />
      <path d="M16.8 16.47L19.3372 17.9348" />
      <path d="M12.8135 30.4065L10.3804 34.6208" />
    </svg>
  );
}

/** Clinician support — heart held in hands. */
function HeartIcon() {
  return (
    <svg width="28" height="28" viewBox="281 242.5 32 32" fill="currentColor" aria-hidden>
      <path d="M297.116 246.533C300.489 242.83 306.258 242.544 309.938 245.872L310.288 246.205C313.829 249.746 313.829 255.508 310.288 259.049L309.323 260.014L309.325 260.058C309.402 261.734 307.972 263.223 306.327 263.248L306.229 263.249L306.229 263.347C306.204 264.932 304.818 266.318 303.232 266.342L303.136 266.344L303.135 266.441C303.111 268.011 301.748 269.392 300.177 269.436L300.083 269.438L300.08 269.531C300.032 270.964 299.285 271.553 298.295 272.537L298.294 272.538C296.617 274.226 293.694 273.442 293.086 271.149L293.061 271.051L292.963 271.077C291.111 271.586 289.177 270.206 289.069 268.282L289.064 268.187L288.968 268.189C287.209 268.218 285.719 266.612 285.872 264.865L285.881 264.77L285.784 264.758C283.231 264.444 282.156 261.221 284.032 259.429L284.108 259.356L284.031 259.283C280.285 255.789 280.162 249.827 283.797 246.206V246.205C287.452 242.529 293.487 242.711 296.969 246.533L297.042 246.615L297.116 246.533ZM297.859 268.566C297.367 268.076 296.569 268.076 296.077 268.568L295.2 269.444C294.71 269.915 294.711 270.756 295.2 271.228V271.229C295.438 271.467 295.756 271.598 296.093 271.598C296.43 271.598 296.747 271.467 296.985 271.229L297.859 270.353L297.86 270.354C298.352 269.882 298.351 269.038 297.859 268.566ZM293.942 266.298C293.396 265.754 292.541 265.831 292.055 266.402L291.282 267.173C290.791 267.645 290.791 268.488 291.282 268.96C291.774 269.452 292.574 269.451 293.065 268.959L293.942 268.083C294.404 267.622 294.433 266.889 294.029 266.394L293.942 266.298ZM295.666 247.851C292.904 244.751 288.047 244.553 285.105 247.515C282.148 250.453 282.34 255.304 285.433 258.067L285.486 258.115L285.549 258.079C287.671 256.873 290.361 258.561 290.173 261.008L290.165 261.105L290.262 261.115C291.684 261.268 292.892 262.559 292.957 263.983L292.961 264.08L293.059 264.078C294.396 264.049 295.731 265.054 296.055 266.377L296.078 266.476L296.177 266.45C297.197 266.184 298.325 266.44 299.133 267.221L299.203 267.289L299.206 267.285C299.701 267.709 300.448 267.688 300.917 267.219C301.409 266.727 301.409 265.927 300.917 265.435L296.429 260.947L296.422 260.939L297.731 259.63L302.227 264.125C302.719 264.617 303.52 264.618 304.012 264.125C304.504 263.633 304.504 262.832 304.012 262.34L299.516 257.845L300.825 256.535L305.32 261.031C305.792 261.521 306.633 261.52 307.104 261.031L307.105 261.031C307.567 260.57 307.596 259.837 307.192 259.342L307.105 259.246L300.862 253.003L300.795 253.046C299.04 254.153 296.685 253.943 295.158 252.415L293.196 250.453L295.662 247.988L295.729 247.921L295.666 247.851ZM289.853 262.938C289.516 262.938 289.199 263.069 288.961 263.307L288.084 264.184C287.846 264.422 287.714 264.738 287.714 265.074C287.7 265.755 288.295 266.349 288.975 266.337V266.338L288.976 266.337L288.979 266.338L288.978 266.337C289.374 266.343 289.722 266.147 289.972 265.865L290.745 265.092C291.538 264.302 290.971 262.936 289.853 262.938ZM287.067 259.534C286.745 259.535 286.422 259.658 286.176 259.904L285.296 260.783C284.165 262.013 285.852 263.699 287.081 262.568L287.084 262.565L287.961 261.689L287.96 261.688C288.755 260.896 288.177 259.527 287.067 259.534ZM308.981 257.737C315.478 250.681 305.817 241.013 298.757 247.512L295.815 250.453L295.886 250.525L296.468 251.106C297.517 252.155 299.225 252.155 300.274 251.106L300.929 250.45L308.415 257.937C308.452 257.973 308.487 258.011 308.521 258.049L308.592 258.127L308.979 257.74L308.981 257.737Z" />
    </svg>
  );
}
