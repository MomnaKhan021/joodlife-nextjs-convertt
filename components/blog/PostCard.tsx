import Image from "next/image";
import Link from "next/link";

import { formatPublishedDate, type StorefrontPost } from "@/lib/posts";

type Variant = "default" | "feature";

/**
 * Article card used in the /blogs grid.
 *
 * Matches the "Jood wellness library" Figma design: a tall photo with the
 * category chip in the top-left and a title + "Read Blog Post" button over a
 * gradient at the bottom. Always renders the post's real cover image, title
 * and slug.
 *
 *   variant="default"  — grid card (photo + overlaid title).
 *   variant="feature"  — wider hero card spanning the full row on desktop.
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
  const href = `/blogs/${post.slug}`;
  const cat = post.categoryLabel || null;
  const date = formatPublishedDate(post.publishedAt);
  const isFeature = variant === "feature";

  return (
    <Link
      href={href}
      className={`group relative flex overflow-hidden rounded-[20px] bg-[#142e2a] shadow-[0_10px_30px_rgba(20,46,42,0.12)] transition-shadow hover:shadow-[0_16px_44px_rgba(20,46,42,0.2)] ${
        isFeature
          ? "aspect-[16/10] md:aspect-[21/9]"
          : "aspect-[4/5]"
      }`}
    >
      <CardImage
        src={post.heroImageUrl}
        alt={post.heroImageAlt ?? post.title}
        priority={priority}
        sizes={
          isFeature
            ? "100vw"
            : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        }
      />

      {/* Bottom gradient for legibility */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[#0c1f1c]/90 via-[#0c1f1c]/45 to-transparent"
      />

      {/* Category chip */}
      {cat ? (
        <span className="absolute left-4 top-4 z-10 rounded-full bg-white/15 px-3 py-1.5 font-ui text-[12px] font-medium text-white backdrop-blur-sm">
          {cat}
        </span>
      ) : null}

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 p-5 md:p-6">
        <h3
          className={`font-display font-semibold leading-[1.25] tracking-[-0.01em] text-white ${
            isFeature
              ? "text-[22px] md:text-[30px] md:max-w-[560px]"
              : "text-[18px] md:text-[20px]"
          }`}
        >
          {post.title}
        </h3>
        {isFeature && post.excerpt ? (
          <p className="hidden max-w-[520px] font-ui text-[14px] leading-[1.55] text-white/80 md:line-clamp-2 md:block">
            {post.excerpt}
          </p>
        ) : null}
        <span className="inline-flex w-full items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-2.5 font-ui text-[13px] font-semibold text-white backdrop-blur-sm transition group-hover:bg-white group-hover:text-[#142e2a] md:w-auto md:self-start">
          Read Blog Post
        </span>
        {date && !isFeature ? (
          <span className="sr-only">{date}</span>
        ) : null}
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
      <div className="flex h-full w-full items-center justify-center bg-[#1d3f3a] font-display text-[48px] text-white/15">
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
      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
    />
  );
}
