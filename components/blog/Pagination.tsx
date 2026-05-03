import Link from "next/link";

/**
 * Numbered pagination strip — server-rendered, link-based, accessible.
 * Crawlable so search engines can index every page without JS.
 *
 * Window: always shows page 1, last page, current ±1, with ellipses.
 */
export default function Pagination({
  page,
  totalPages,
  basePath,
  category,
}: {
  page: number;
  totalPages: number;
  basePath: string; // e.g. "/blogs"
  category?: string | null;
}) {
  if (totalPages <= 1) return null;

  const buildHref = (p: number): string => {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (category) params.set("category", category);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pages = buildPageRange(page, totalPages);

  return (
    <nav
      aria-label="Blog pagination"
      className="mt-12 flex items-center justify-center gap-1 font-ui text-[14px]"
    >
      {/* Previous */}
      <PagerLink
        href={page > 1 ? buildHref(page - 1) : null}
        aria-label="Previous page"
      >
        ← Previous
      </PagerLink>

      <ul className="flex items-center gap-1 px-2">
        {pages.map((p, i) =>
          p === "..." ? (
            <li
              key={`gap-${i}`}
              aria-hidden
              className="px-2 text-[#142e2a]/40"
            >
              …
            </li>
          ) : (
            <li key={p}>
              <PagerLink
                href={p === page ? null : buildHref(p)}
                isCurrent={p === page}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </PagerLink>
            </li>
          )
        )}
      </ul>

      {/* Next */}
      <PagerLink
        href={page < totalPages ? buildHref(page + 1) : null}
        aria-label="Next page"
      >
        Next →
      </PagerLink>
    </nav>
  );
}

function PagerLink({
  href,
  isCurrent,
  children,
  ...rest
}: {
  href: string | null;
  isCurrent?: boolean;
  children: React.ReactNode;
  "aria-label"?: string;
  "aria-current"?: "page" | undefined;
}) {
  const className = `inline-flex h-10 min-w-[40px] items-center justify-center rounded-full px-3 font-ui font-semibold transition ${
    isCurrent
      ? "bg-[#142e2a] text-white"
      : href
        ? "border border-[#142e2a]/15 text-[#142e2a] hover:border-[#142e2a]/40"
        : "border border-[#142e2a]/10 text-[#142e2a]/30"
  }`;
  if (!href) {
    return (
      <span className={className} {...rest}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={className} {...rest}>
      {children}
    </Link>
  );
}

function buildPageRange(
  page: number,
  totalPages: number
): Array<number | "..."> {
  const pages: Array<number | "..."> = [];
  const window = 1; // pages on each side of current

  for (let p = 1; p <= totalPages; p++) {
    if (
      p === 1 ||
      p === totalPages ||
      (p >= page - window && p <= page + window)
    ) {
      pages.push(p);
    } else if (
      pages[pages.length - 1] !== "..." &&
      ((p < page - window && p > 1) || (p > page + window && p < totalPages))
    ) {
      pages.push("...");
    }
  }
  return pages;
}
