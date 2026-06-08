import Image from "next/image";
import Link from "next/link";

import Reveal from "@/components/ui/Reveal";
import CategoryCurve from "@/components/home/CategoryCurve";
import type { Category } from "@/lib/categories";

/**
 * Category preview section — the themed full-bleed blocks from the Figma
 * home page (Components 289 / 290 / 291) and the hero of each sub-page.
 *
 * One component, themed per category via `category.theme`, so weight
 * loss (green), men's health (blue) and women's health (pink) share an
 * identical, maintainable layout: gradient backdrop + decorative wave,
 * centred title with a serif italic accent, a cut-out portrait, dual
 * CTA, and the category's proof points as chips.
 *
 * `variant="hero"` renders the eyebrow + slightly taller spacing for use
 * at the top of a sub-page; `variant="preview"` (default) is the
 * gateway-home version that links through to the sub-page.
 */
export default function CategoryPreview({
  category,
  variant = "preview",
  priority = false,
  children,
}: {
  category: Category;
  variant?: "preview" | "hero";
  priority?: boolean;
  children?: React.ReactNode;
}) {
  const { theme } = category;
  const isHero = variant === "hero";

  return (
    <section
      aria-label={`${category.eyebrow} — ${category.title} ${category.titleAccent}`}
      className="w-full bg-white py-5"
      style={
        {
          "--cat-base": theme.base,
          "--cat-soft": theme.soft,
          "--cat-tint": theme.tint,
        } as React.CSSProperties
      }
    >
      {/* Full-width gradient block with rounded corners (Figma 289/290/291) */}
      <div
        className="relative overflow-hidden rounded-[24px] pb-10 pt-12 md:pb-14 md:pt-16 lg:pt-20"
        style={{
          background: `linear-gradient(165deg, ${theme.base} 0%, ${theme.soft} 100%)`,
          color: theme.onBase,
        }}
      >
        {/* Decorative wavy connector — spans full width, draws on scroll */}
        <CategoryCurve
          color={theme.onBase}
          className="pointer-events-none absolute inset-x-0 top-4 z-0 aspect-[1444/372] w-full opacity-50 md:top-6 md:opacity-60 lg:top-10"
        />

        <div className="relative z-10 mx-auto w-full max-w-[1280px] px-5 md:px-8">
          <div className="flex flex-col items-center text-center">
            {isHero && (
              <Reveal as="div" direction="down">
                <span className="mb-3 inline-flex items-center rounded-full bg-white/15 px-3.5 py-1.5 font-ui text-[13px] font-medium tracking-tight">
                  {category.eyebrow}
                </span>
              </Reveal>
            )}
            <Reveal as="div" delay={60}>
              <h2 className="max-w-[18ch] font-display text-[30px] font-semibold leading-[1.08] tracking-[-0.025em] md:text-[48px] md:leading-[1.08]">
                {category.title}{" "}
                <em className="font-serif font-normal italic">{category.titleAccent}</em>
              </h2>
            </Reveal>

            {/* Portrait — shown from the waist up; the content cards
                below overlap its lower half (their frosted blur shows the
                figure softened behind them, as in Figma). A soft glow
                sits behind for depth. The CTA overlays the lower torso. */}
            <Reveal
              as="div"
              delay={160}
              className="relative mt-6 h-[380px] w-full max-w-[460px] md:mt-8 md:h-[540px] md:max-w-[520px]"
            >
              <div
                aria-hidden
                className="absolute left-1/2 top-[18%] h-[68%] w-[88%] -translate-x-1/2 blur-2xl"
                style={{ background: theme.glow }}
              />
              <Image
                src={category.heroImage}
                alt={category.imageAlt}
                fill
                priority={priority}
                quality={90}
                sizes="(max-width: 768px) 80vw, 520px"
                className="object-contain object-top"
              />

              {/* Dual CTA — overlays the lower torso, sits above the cards */}
              <div className="absolute bottom-[42%] left-1/2 z-20 flex w-full -translate-x-1/2 flex-wrap items-center justify-center gap-3">
                <Link
                  href={`${category.href}#assessment`}
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-7 font-ui text-[15px] font-semibold text-[#142e2a] shadow-lg transition-transform duration-200 hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
                <Link
                  href={category.href}
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-white/70 bg-black/20 px-7 font-ui text-[15px] font-semibold text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/10"
                >
                  Learn More
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Section content cards — pulled up to overlap the portrait's
              lower half; their backdrop-blur softens the figure behind. */}
          {children ? (
            <div className="relative z-10 -mt-[120px] md:-mt-[185px]">{children}</div>
          ) : (
            <p className="relative z-10 mx-auto mt-8 max-w-[52ch] text-center font-ui text-[15px] leading-relaxed text-white/85 md:text-[16px]">
              {category.blurb}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
