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
  isReturningPatient = false,
  children,
}: {
  category: Category;
  variant?: "preview" | "hero";
  priority?: boolean;
  isReturningPatient?: boolean;
  children?: React.ReactNode;
}) {
  const { theme } = category;
  const isHero = variant === "hero";

  return (
    <section
      aria-label={`${category.eyebrow} — ${category.title} ${category.titleAccent}`}
      className="w-full bg-white px-4 py-[30px] md:px-0 md:py-10"
      style={
        {
          "--cat-base": theme.base,
          "--cat-soft": theme.soft,
          "--cat-tint": theme.tint,
        } as React.CSSProperties
      }
    >
      {/* Full-width section block — exact Figma background recreated in CSS.
          ED/PD use a sampled vertical gradient + a subtle radiating ray fan;
          weight loss uses the solid base colour. Fully responsive, no raster
          stretch/letterbox artifacts. */}
      <div
        className="relative overflow-hidden rounded-[24px] pb-10 pt-12 md:pb-14 md:pt-16 lg:pt-20"
        style={{
          background: theme.sectionBg ?? theme.base,
          color: theme.onBase,
        }}
      >
        {/* Optional photographic sky backdrop (ED clouds) — covers the top
            of the hero and fades into the section gradient below. */}
        {category.heroBackdrop && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[55%] md:h-[60%]"
          >
            <Image
              src={category.heroBackdrop}
              alt=""
              fill
              quality={85}
              sizes="100vw"
              className="object-cover object-top"
            />
            {/* Fade the backdrop into the section colour at its lower edge */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, rgba(0,0,0,0) 45%, ${category.heroBackdropFade ?? theme.base} 100%)`,
              }}
            />
          </div>
        )}

        {/* Decorative wavy connector — spans full width, draws on scroll.
            The themed hero sections (ED clouds, PD dark backdrop) drop the
            connector per the new Figma; only the plain weight-loss section
            keeps it. */}
        {!category.heroBackdrop && (
          <CategoryCurve
            color={theme.onBase}
            className="pointer-events-none absolute inset-x-0 top-[120px] z-0 aspect-[1444/372] w-full opacity-70 md:top-[150px] md:opacity-80 lg:top-[170px]"
          />
        )}

        <div className="relative z-10 mx-auto w-full max-w-[1280px] px-5 md:px-8">
          <div className="flex flex-col items-start text-left md:items-center md:text-center">
            {isHero && (
              <Reveal as="div" direction="down">
                <span className="mb-3 inline-flex items-center rounded-full bg-white/15 px-3.5 py-1.5 font-ui text-[13px] font-medium tracking-tight">
                  {category.eyebrow}
                </span>
              </Reveal>
            )}
            <Reveal as="div" delay={60}>
              <h2 className="max-w-[18ch] font-display text-[26px] font-semibold leading-[1.1] tracking-[-0.025em] md:text-[48px] md:leading-[1.08]">
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
              className="relative mx-auto mt-6 h-[380px] w-full max-w-[460px] md:mt-8 md:h-[540px] md:max-w-[520px]"
            >
              {/* Optional floating UI cards (PD) — fan out behind the
                  portrait, wider than the figure and centred on her. */}
              {category.heroCards && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-[44%] z-0 w-[230%] max-w-[1240px] -translate-x-1/2 -translate-y-1/2"
                >
                  <Image
                    src={category.heroCards}
                    alt=""
                    width={3632}
                    height={1489}
                    quality={85}
                    sizes="(max-width: 768px) 150vw, 1240px"
                    className="h-auto w-full"
                  />
                </div>
              )}

              <Image
                src={category.heroImage}
                alt={category.imageAlt}
                fill
                priority={priority}
                quality={90}
                sizes="(max-width: 768px) 80vw, 520px"
                className="relative z-10 object-contain object-top"
                style={
                  category.heroImageScale
                    ? {
                        transform: `scale(${category.heroImageScale})`,
                        transformOrigin: "top center",
                      }
                    : undefined
                }
              />

              {/* Dual CTA — overlays the lower torso, sits above the cards.
                  Compact + centred on mobile, larger on desktop. */}
              <div className="absolute bottom-[42%] left-1/2 z-20 flex w-[92%] -translate-x-1/2 flex-nowrap items-stretch justify-center gap-2.5 md:w-full md:items-center md:gap-3">
                <Link
                  href={isReturningPatient && category.key === "weight-loss" ? "/reorder" : `/consultation?product=${category.key}`}
                  className="btn-cta inline-flex min-h-10 flex-1 items-center justify-center rounded-lg bg-white px-3 py-1.5 text-center font-ui text-[12px] font-semibold leading-tight text-[#142e2a] shadow-lg md:min-h-12 md:flex-none md:px-7 md:text-[15px]"
                >
                  {isReturningPatient && category.key === "weight-loss"
                    ? "Reorder"
                    : category.ctaLabel ?? "Get Started"}
                </Link>
                <Link
                  href={category.learnMoreHref ?? category.href}
                  className="btn-cta inline-flex min-h-10 flex-1 items-center justify-center rounded-lg border border-white/70 bg-black/20 px-3 py-1.5 text-center font-ui text-[12px] font-semibold leading-tight text-white backdrop-blur-sm hover:bg-white/10 md:min-h-12 md:flex-none md:px-7 md:text-[15px]"
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
