import Image from "next/image";
import Link from "next/link";

import {
  categoryLabel,
  formatPublishedDate,
  type StorefrontPost,
} from "@/lib/posts";

type Variant = "default" | "feature";

/**
 * Article card used in the /blogs grid.
 *
 *   variant="default"  — square-ish thumbnail, vertical layout, used in
 *                        the 3-column grid.
 *   variant="feature"  — large hero card, horizontal on desktop, vertical
 *                        on mobile. Used as the first post on /blogs page 1.
 */
export default function PostCard({
  post,
  variant = "default",
  priority = false,
}: {
  post: StorefrontPost;
  variant?: Variant;
  priority?: boolean;
}) {
  const date = formatPublishedDate(post.publishedAt);
  const href = `/blogs/${post.slug}`;
  const cat = post.category ? categoryLabel(post.category) : null;

  if (variant === "feature") {
    return (
      <Link
        href={href}
        className="group grid overflow-hidden rounded-3xl border border-[#142e2a]/10 bg-white transition hover:border-[#142e2a]/30 hover:shadow-[0_12px_40px_rgba(20,46,42,0.08)] md:grid-cols-2"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f7f9f2] md:aspect-auto md:min-h-[420px]">
          <CardImage
            src={post.heroImageUrl}
            alt={post.heroImageAlt ?? post.title}
            priority={priority}
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </div>
        <div className="flex flex-col justify-center gap-4 p-7 md:p-10">
          <div className="flex flex-wrap items-center gap-2 font-ui text-[11px] font-semibold uppercase tracking-[0.06em] text-[#142e2a]/60">
            {cat ? (
              <span className="rounded-full bg-[#f7f9f2] px-3 py-1 text-[#142e2a]">
                {cat}
              </span>
            ) : null}
            {date ? <span className="text-[#142e2a]/55">{date}</span> : null}
          </div>
          <h2 className="font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#142e2a] transition group-hover:text-[#1d3f3a] md:text-[34px]">
            {post.title}
          </h2>
          {post.excerpt ? (
            <p className="line-clamp-3 max-w-[520px] font-ui text-[15px] leading-[1.6] text-[#142e2a]/70 md:text-[16px]">
              {post.excerpt}
            </p>
          ) : null}
          <span className="mt-2 inline-flex items-center gap-2 font-ui text-[14px] font-semibold text-[#142e2a]">
            Read article
            <ArrowRight />
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#142e2a]/10 bg-white transition hover:border-[#142e2a]/30 hover:shadow-[0_8px_30px_rgba(20,46,42,0.08)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f7f9f2]">
        <CardImage
          src={post.heroImageUrl}
          alt={post.heroImageAlt ?? post.title}
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
        {cat ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 font-ui text-[11px] font-semibold uppercase tracking-[0.06em] text-[#142e2a] backdrop-blur">
            {cat}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-display text-[20px] font-semibold leading-[1.25] tracking-[-0.01em] text-[#142e2a] transition group-hover:text-[#1d3f3a]">
          {post.title}
        </h3>
        {post.excerpt ? (
          <p className="line-clamp-3 font-ui text-[14px] leading-[1.55] text-[#142e2a]/70">
            {post.excerpt}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2 font-ui text-[12px] text-[#142e2a]/55">
          <span>{date}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-[#142e2a]/80 transition group-hover:text-[#142e2a]">
            Read more
            <ArrowRight small />
          </span>
        </div>
      </div>
    </Link>
  );
}

function CardImage({
  src,
  alt,
  sizes,
  priority,
}: {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center font-display text-[40px] text-[#142e2a]/15">
        ✺
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
    />
  );
}

function ArrowRight({ small = false }: { small?: boolean }) {
  const s = small ? "h-3 w-3" : "h-4 w-4";
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${s} transition-transform duration-300 group-hover:translate-x-1`}
    >
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  );
}
