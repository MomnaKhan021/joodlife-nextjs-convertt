import Link from "next/link";
import { textStyleProps, type TextStyle } from "@/lib/textStyle";

type Category = { slug: string; label: string; count: number };

/**
 * Centered pill-row of category filters (matches the "Recent blog posts"
 * tab list in the Jood wellness library design). "All articles" is the
 * implicit default (no `category` query param). Server-rendered links —
 * no JS needed.
 */
export default function CategoryTabs({
  text,
  categories,
  active,
  basePath,
}: {
  /** Per-text size and weight from the blog page. */
  text?: Partial<Record<string, TextStyle>>;
  categories: Category[];
  active: string | null;
  basePath: string;
  /** Kept for API compatibility; not shown in this design. */
  totalCount?: number;
}) {
  if (categories.length === 0) return null;

  return (
    <nav
      aria-label="Blog categories"
      className="flex flex-wrap items-center justify-center gap-2 md:gap-3"
    >
      <Pill
        href={basePath}
        active={active === null}
        style={textStyleProps(text?.["categoryTab"]).style}
      >
        All articles
      </Pill>
      {categories.map((c) => (
        <Pill
          key={c.slug}
          href={`${basePath}?category=${encodeURIComponent(c.slug)}`}
          active={active === c.slug}
          style={textStyleProps(text?.["categoryTab"]).style}
        >
          {c.label}
        </Pill>
      ))}
    </nav>
  );
}

function Pill({
  href,
  active,
  children,
  style,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  /** CMS size/weight; one setting covers every tab. */
  style?: React.CSSProperties;
}) {
  const cls = active
    ? "bg-[#142e2a] text-white"
    : "border border-[#142e2a]/15 bg-white text-[#142e2a] hover:border-[#142e2a]/40";
  return (
    <Link
      href={href}
      style={style}
      className={`inline-flex shrink-0 items-center rounded-full px-5 py-2.5 font-ui text-[14px] font-medium transition ${cls}`}
    >
      {children}
    </Link>
  );
}
