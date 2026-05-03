import Link from "next/link";

type Category = { slug: string; label: string; count: number };

/**
 * Pill-row of category filters at the top of /blogs.
 * "All" is the implicit default (no `category` query param).
 * Server-rendered links — no JS needed.
 */
export default function CategoryTabs({
  categories,
  active,
  basePath,
  totalCount,
}: {
  categories: Category[];
  active: string | null;
  basePath: string;
  totalCount: number;
}) {
  if (categories.length === 0) return null;

  return (
    <nav
      aria-label="Blog categories"
      className="-mx-1 mt-2 flex flex-wrap items-center gap-2 overflow-x-auto pb-1"
    >
      <Pill href={basePath} active={active === null} count={totalCount}>
        All
      </Pill>
      {categories.map((c) => (
        <Pill
          key={c.slug}
          href={`${basePath}?category=${encodeURIComponent(c.slug)}`}
          active={active === c.slug}
          count={c.count}
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
  count,
  children,
}: {
  href: string;
  active: boolean;
  count: number;
  children: React.ReactNode;
}) {
  const cls = active
    ? "bg-[#142e2a] text-white"
    : "border border-[#142e2a]/15 bg-white text-[#142e2a] hover:border-[#142e2a]/40";
  return (
    <Link
      href={href}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 font-ui text-[13px] font-semibold transition ${cls}`}
    >
      {children}
      <span
        className={`inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] ${
          active ? "bg-white/20 text-white" : "bg-[#f7f9f2] text-[#142e2a]/70"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}
