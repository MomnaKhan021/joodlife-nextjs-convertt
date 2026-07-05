import Link from "next/link";

type Category = { slug: string; label: string; count: number };

/**
 * Centered pill-row of category filters (matches the "Recent blog posts"
 * tab list in the Jood wellness library design). "All articles" is the
 * implicit default (no `category` query param). Server-rendered links —
 * no JS needed.
 */
export default function CategoryTabs({
  categories,
  active,
  basePath,
}: {
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
      <Pill href={basePath} active={active === null}>
        All articles
      </Pill>
      {categories.map((c) => (
        <Pill
          key={c.slug}
          href={`${basePath}?category=${encodeURIComponent(c.slug)}`}
          active={active === c.slug}
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
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  const cls = active
    ? "bg-[#142e2a] text-white"
    : "border border-[#142e2a]/15 bg-white text-[#142e2a] hover:border-[#142e2a]/40";
  return (
    <Link
      href={href}
      className={`inline-flex shrink-0 items-center rounded-full px-5 py-2.5 font-ui text-[14px] font-medium transition ${cls}`}
    >
      {children}
    </Link>
  );
}
