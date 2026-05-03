import Link from "next/link";

import {
  categoryLabel,
  formatPublishedDate,
  type StorefrontPost,
} from "@/lib/posts";

export default function PostCard({ post }: { post: StorefrontPost }) {
  const date = formatPublishedDate(post.publishedAt);
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#142e2a]/10 bg-white transition hover:border-[#142e2a]/30 hover:shadow-[0_8px_30px_rgba(20,46,42,0.08)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#f7f9f2]">
        {post.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.heroImageUrl}
            alt={post.heroImageAlt ?? post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-[40px] text-[#142e2a]/15">
            ✺
          </div>
        )}
        {post.category ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 font-ui text-[11px] font-semibold uppercase tracking-[0.06em] text-[#142e2a] backdrop-blur">
            {categoryLabel(post.category)}
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
        <div className="mt-auto flex items-center gap-3 pt-2 font-ui text-[12px] text-[#142e2a]/55">
          {post.authorName ? <span>{post.authorName}</span> : null}
          {post.authorName && date ? <span aria-hidden>·</span> : null}
          {date ? <span>{date}</span> : null}
        </div>
      </div>
    </Link>
  );
}
