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

  // The 2026 Figma home-page treatment (ED): sky backdrop, portrait
  // dissolving into a solid lower block, content cards on the solid.
  if (theme.lowerBg && !isHero) {
    return (
      <SkyPreview category={category} priority={priority} isReturningPatient={isReturningPatient}>
        {children}
      </SkyPreview>
    );
  }

  return (
    <section
      aria-label={`${category.eyebrow} — ${category.title} ${category.titleAccent}`}
      className="w-full bg-white px-0 py-[7px] md:py-10"
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
        className="relative overflow-hidden rounded-[16px] pb-10 pt-12 md:rounded-[24px] md:pb-14 md:pt-16 lg:pt-20"
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
              <h2 className="max-w-[18ch] font-display text-[30px] font-semibold leading-[1.12] tracking-[-0.025em] md:text-[48px] md:leading-[1.08]">
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
                  className="btn-cta inline-flex min-h-[50px] flex-1 items-center justify-center rounded-lg bg-white px-3 py-1.5 text-center font-ui text-[12px] font-semibold leading-tight text-[#142e2a] shadow-lg md:min-h-12 md:flex-none md:px-7 md:text-[15px]"
                >
                  {isReturningPatient && category.key === "weight-loss"
                    ? "Reorder"
                    : category.ctaLabel ?? "Get Started"}
                </Link>
                <Link
                  href={category.learnMoreHref ?? category.href}
                  className="btn-cta inline-flex min-h-[50px] flex-1 items-center justify-center rounded-lg border border-white/70 bg-black/20 px-3 py-1.5 text-center font-ui text-[12px] font-semibold leading-tight text-white backdrop-blur-sm hover:bg-white/10 md:min-h-12 md:flex-none md:px-7 md:text-[15px]"
                >
                  Learn More
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Section content cards — pulled up to overlap the portrait's
              lower half; their backdrop-blur softens the figure behind. */}
          {children ? (
            <div className="relative z-10 -mt-[150px] md:-mt-[185px]">{children}</div>
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


/**
 * Figma "Home Page - 2026" Component 295 (desktop, 1440×1596) / 296 (mobile,
 * 390×1875). Measured geometry, not eyeballed:
 *
 *   desktop  title 48/57 ls-2.14 at y100 · portrait 622×584 at y197 ·
 *            buttons 183×50 ×2, gap 11, foot 80px above the portrait's ·
 *            cards from y735 (46px above the portrait's foot) · band
 *            #b5cfe0→#5fb3d7 y699–801 blur 54 · side inset 107 → 1226 wide
 *            content · bottom inset 100
 *   mobile   title 36/39 ls-1 at y50 · portrait 376 wide at y183, the image
 *            ending 18px below the card line · buttons 175×50 ×2, gap 8 ·
 *            cards from y593 · band y565–743 blur 16 · inset 16 / 50
 *
 * The portrait is hidden below the card line by the solid lower block and
 * the blurred band drawn over it — it must not show through the cards.
 */
function SkyPreview({
  category,
  priority,
  isReturningPatient,
  children,
}: {
  category: Category;
  priority: boolean;
  isReturningPatient: boolean;
  children?: React.ReactNode;
}) {
  const { theme } = category;
  const lower = theme.lowerBg ?? theme.base;
  const fadeFrom = theme.fadeFrom ?? lower;
  const box = category.heroImageBox ?? {
    desktop: { w: 622, h: 584 },
    mobile: { w: 376, h: 428 },
  };
  const tm = category.titleMetrics ?? {
    desktop: { size: 48, lineHeight: 57, tracking: -2.14 },
    mobile: { size: 36, lineHeight: 39, tracking: -1 },
  };
  const startHref =
    isReturningPatient && category.key === "weight-loss"
      ? "/reorder"
      : `/consultation?product=${category.key}`;

  return (
    <section
      aria-label={`${category.eyebrow} — ${category.title} ${category.titleAccent}`}
      className="w-full bg-white px-0 py-[7px] md:py-10"
      style={
        {
          "--cat-base": theme.base,
          "--cat-soft": theme.soft,
          "--cat-tint": theme.tint,
          "--t-size-m": `${tm.mobile.size}px`,
          "--t-lh-m": `${tm.mobile.lineHeight}px`,
          "--t-ls-m": `${tm.mobile.tracking}px`,
          "--t-size-d": `${tm.desktop.size}px`,
          "--t-lh-d": `${tm.desktop.lineHeight}px`,
          "--t-ls-d": `${tm.desktop.tracking}px`,
          "--p-w-m": `${box.mobile.w}px`,
          "--p-ar-m": `${box.mobile.w} / ${box.mobile.h}`,
          "--p-w-d": `${box.desktop.w}px`,
          "--p-ar-d": `${box.desktop.w} / ${box.desktop.h}`,
        } as React.CSSProperties
      }
    >
      <div
        className="relative overflow-hidden rounded-[16px] md:rounded-[24px]"
        style={{ background: lower, color: theme.onBase }}
      >
        {/* ── Hero: sky + title + portrait + CTAs ─────────────────────── */}
        <div className="relative">
          {category.heroBackdrop && (
            <div aria-hidden className="absolute inset-0 z-0">
              <Image
                src={category.heroBackdrop}
                alt=""
                fill
                priority={priority}
                quality={90}
                sizes="100vw"
                className="object-cover object-top"
              />
            </div>
          )}

          <div className="relative z-10 mx-auto flex w-full max-w-[1226px] flex-col items-center px-4 pt-[50px] md:px-8 md:pt-[100px] lg:px-0">
            <Reveal as="div" delay={60} className="w-full">
              <h2 className="mx-auto max-w-[664px] text-center font-display text-[length:var(--t-size-m)] font-semibold leading-[var(--t-lh-m)] tracking-[var(--t-ls-m)] md:text-[length:var(--t-size-d)] md:leading-[var(--t-lh-d)] md:tracking-[var(--t-ls-d)]">
                {category.title}{" "}
                <em className="font-serif font-normal italic leading-[1]">{category.titleAccent}</em>
              </h2>
            </Reveal>

            {/* Portrait stage. Its foot extends below the card line
                (negative margin) and is covered there by the lower block. */}
            <Reveal
              as="div"
              delay={160}
              className="relative mb-[-18px] mt-[15px] aspect-[var(--p-ar-m)] w-[min(var(--p-w-m),calc(100vw-14px))] max-w-none translate-x-[7px] md:mb-[-46px] md:mt-[-18px] md:aspect-[var(--p-ar-d)] md:w-[var(--p-w-d)] md:translate-x-[30px]"
            >
              <Image
                src={category.heroImageMobile ?? category.heroImage}
                alt={category.imageAlt}
                fill
                priority={priority}
                quality={90}
                sizes="(max-width: 768px) 96vw, 622px"
                className="object-contain object-top md:hidden"
              />
              <Image
                src={category.heroImage}
                alt={category.imageAlt}
                fill
                priority={priority}
                quality={90}
                sizes="622px"
                className="hidden object-contain object-top md:block"
              />

              {/* Dual CTA over the lower torso. Figma: 175×50 ×2 gap 8 on
                  mobile (spanning the 358 content width); 183×50 ×2 gap 11
                  on desktop; white with a #0c2421 hairline / 6% white with
                  a white hairline. */}
              <div className="absolute bottom-[9.1%] left-1/2 z-20 flex w-[358px] max-w-[calc(100vw-32px)] -translate-x-[calc(50%+7px)] gap-2 md:bottom-[13.7%] md:w-auto md:max-w-none md:-translate-x-[calc(50%+30px)] md:gap-[11px]">
                <Link
                  href={startHref}
                  className="btn-cta inline-flex h-[50px] flex-1 items-center justify-center rounded-lg border border-[#0c2421] bg-white px-4 text-center font-ui text-[16px] font-medium leading-5 tracking-[-0.32px] text-[#142f2b] md:w-[183px] md:flex-none"
                >
                  {isReturningPatient && category.key === "weight-loss"
                    ? "Reorder"
                    : category.ctaLabel ?? "Get Started"}
                </Link>
                <Link
                  href={category.learnMoreHref ?? category.href}
                  className="btn-cta inline-flex h-[50px] flex-1 items-center justify-center rounded-lg border border-white bg-white/6 px-4 text-center font-ui text-[16px] font-medium leading-5 tracking-[-0.32px] text-white hover:bg-white/12 md:w-[182px] md:flex-none"
                >
                  Learn More
                </Link>
              </div>
            </Reveal>
          </div>
        </div>

        {/* ── Lower block: solid colour, blurred band, content cards ──── */}
        <div className="relative z-20" style={{ background: lower }}>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[-80px] top-[-28px] z-0 h-[178px] blur-[16px] md:top-[-36px] md:h-[102px] md:blur-[54px]"
            style={{ background: `linear-gradient(180deg, ${fadeFrom} 0%, ${lower} 100%)` }}
          />
          <div className="relative z-10 mx-auto w-full max-w-[1226px] px-4 pb-[50px] md:px-8 md:pb-[100px] lg:px-0">
            {children ?? (
              <p className="mx-auto max-w-[52ch] text-center font-ui text-[15px] leading-relaxed text-white/85 md:text-[16px]">
                {category.blurb}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
