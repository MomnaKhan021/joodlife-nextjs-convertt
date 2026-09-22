"use client";

import { useCallback, useState } from "react";

import type { SiteLink } from "@/lib/siteContentTypes";

/**
 * Shared link-editing UI for the Header and Footer screens.
 *
 * `LinkRepeater` is the add / reorder / remove list. Each row's URL field
 * has a "Browse" button that opens `LinkPicker`, which lists real products
 * and CMS pages so nobody has to remember or mistype a slug.
 */

export const fieldInput =
  "w-full rounded-lg border border-[#d8ddd0] bg-white px-3 py-2 text-[14px] text-[#1a1a1a] outline-none focus:border-[#1a1a1a]";
export const fieldLabel = "block text-[13px] font-medium text-[#1a1a1a]";

type Option = { label: string; href: string; group: string };

/** Routes that exist as real pages in the app, offered alongside CMS content. */
const STATIC_ROUTES: Option[] = [
  { label: "Home", href: "/", group: "Site" },
  { label: "Shop (all treatments)", href: "/shop", group: "Site" },
  { label: "Blog", href: "/blogs", group: "Site" },
  { label: "Support", href: "/support", group: "Site" },
  { label: "Log in", href: "/login", group: "Site" },
  { label: "Sign up", href: "/signup", group: "Site" },
  { label: "My account", href: "/profile", group: "Site" },
  { label: "Weight loss", href: "/weight-loss", group: "Treatments" },
  { label: "Erectile dysfunction", href: "/erectile-dysfunction", group: "Treatments" },
  { label: "Period delay", href: "/period-delay", group: "Treatments" },
  { label: "Wegovy Pills", href: "/wegovy-pills", group: "Treatments" },
  { label: "Terms & conditions", href: "/policies/terms", group: "Policies" },
  { label: "Refund & Complaints", href: "/policies/refund-complaints", group: "Policies" },
  { label: "Privacy & Cookies", href: "/policies/privacy", group: "Policies" },
];

function LinkPicker({
  onPick,
  onClose,
}: {
  onPick: (opt: Option) => void;
  onClose: () => void;
}) {
  const [options, setOptions] = useState<Option[]>(STATIC_ROUTES);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const found: Option[] = [];
    try {
      const [prodRes, pageRes] = await Promise.all([
        fetch("/api/products?limit=100&depth=0", { credentials: "include" }),
        fetch("/api/pages?limit=100&depth=0", { credentials: "include" }),
      ]);
      const prods = await prodRes.json().catch(() => ({}));
      const pages = await pageRes.json().catch(() => ({}));
      for (const p of (prods?.docs ?? []) as { title?: string; name?: string; slug?: string }[]) {
        if (p.slug) {
          found.push({
            label: p.title || p.name || p.slug,
            href: `/products/${p.slug}`,
            group: "Products",
          });
        }
      }
      for (const p of (pages?.docs ?? []) as { title?: string; slug?: string; status?: string }[]) {
        if (p.slug) {
          found.push({
            label: `${p.title || p.slug}${p.status === "published" ? "" : " (draft)"}`,
            href: `/${p.slug}`,
            group: "Pages",
          });
        }
      }
    } catch {
      // Network/permission problems just mean fewer options — the static
      // routes below are always available.
    } finally {
      setOptions([...STATIC_ROUTES, ...found]);
      setLoading(false);
    }
  }, []);

  // Fetch once when the picker mounts.
  const [started, setStarted] = useState(false);
  if (!started) {
    setStarted(true);
    void load();
  }

  const needle = q.trim().toLowerCase();
  const shown = needle
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(needle) ||
          o.href.toLowerCase().includes(needle),
      )
    : options;

  const groups = Array.from(new Set(shown.map((o) => o.group)));

  return (
    <div className="mt-2 rounded-lg border border-[#e4e7de] bg-[#fafbf7] p-3">
      <div className="mb-2 flex items-center gap-2">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products, pages, routes…"
          className={`${fieldInput} py-1.5 text-[13px]`}
        />
        <button
          type="button"
          onClick={onClose}
          className="whitespace-nowrap text-[12px] text-[#616161] underline-offset-2 hover:underline"
        >
          Close
        </button>
      </div>
      {loading && (
        <p className="px-1 pb-2 text-[12px] text-[#8a8a8a]">Loading products and pages…</p>
      )}
      <div className="max-h-[240px] overflow-y-auto">
        {groups.map((g) => (
          <div key={g} className="mb-2">
            <p className="px-1 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
              {g}
            </p>
            {shown
              .filter((o) => o.group === g)
              .map((o) => (
                <button
                  key={`${o.group}-${o.href}-${o.label}`}
                  type="button"
                  onClick={() => onPick(o)}
                  className="flex w-full items-center justify-between gap-3 rounded px-2 py-1.5 text-left hover:bg-white"
                >
                  <span className="text-[13px] text-[#1a1a1a]">{o.label}</span>
                  <span className="shrink-0 text-[11px] text-[#8a8a8a]">{o.href}</span>
                </button>
              ))}
          </div>
        ))}
        {shown.length === 0 && (
          <p className="px-1 py-2 text-[13px] text-[#616161]">No matches.</p>
        )}
      </div>
    </div>
  );
}

export function LinkRepeater({
  title,
  hint,
  links,
  onChange,
  allowMega,
  renderExtra,
}: {
  title: string;
  hint?: string;
  links: SiteLink[];
  onChange: (next: SiteLink[]) => void;
  allowMega?: boolean;
  /** Extra editor rendered under a row — used for per-link mega menus. */
  renderExtra?: (
    link: SiteLink,
    index: number,
    update: (patch: Partial<SiteLink>) => void,
  ) => React.ReactNode;
}) {
  const [picking, setPicking] = useState<number | null>(null);

  function update(i: number, patch: Partial<SiteLink>) {
    onChange(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= links.length) return;
    const next = [...links];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="rounded-xl border border-[#e4e7de] bg-white p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-[15px] font-medium text-[#1a1a1a]">{title}</h2>
        <button
          type="button"
          onClick={() => onChange([...links, { label: "", href: "" }])}
          className="rounded-lg border border-[#d8ddd0] px-3 py-1 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]"
        >
          + Add link
        </button>
      </div>
      {hint && <p className="mb-3 text-[12px] text-[#8a8a8a]">{hint}</p>}

      {links.length === 0 ? (
        <p className="text-[13px] text-[#616161]">
          No links — the built-in defaults will be used.
        </p>
      ) : (
        <div className="space-y-2">
          {links.map((l, i) => (
            <div key={i}>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  aria-label="Label"
                  className={`${fieldInput} min-w-[130px] flex-1`}
                  value={l.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  placeholder="Label"
                />
                <input
                  aria-label="Link URL"
                  className={`${fieldInput} min-w-[150px] flex-1`}
                  value={l.href}
                  onChange={(e) => update(i, { href: e.target.value })}
                  placeholder="/path or https://…"
                />
                <button
                  type="button"
                  onClick={() => setPicking(picking === i ? null : i)}
                  className="whitespace-nowrap rounded-lg border border-[#d8ddd0] px-2.5 py-1.5 text-[12px] text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]"
                >
                  Browse
                </button>
                {allowMega && (
                  <label className="flex items-center gap-1.5 whitespace-nowrap text-[12px] text-[#616161]">
                    <input
                      type="checkbox"
                      checked={Boolean(l.mega)}
                      onChange={(e) => update(i, { mega: e.target.checked })}
                    />
                    Mega menu
                  </label>
                )}
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => move(i, -1)} className="rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]" title="Move up">↑</button>
                  <button type="button" onClick={() => move(i, 1)} className="rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]" title="Move down">↓</button>
                  <button
                    type="button"
                    onClick={() => onChange(links.filter((_, idx) => idx !== i))}
                    className="rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {renderExtra?.(l, i, (patch) => update(i, patch))}
              {picking === i && (
                <LinkPicker
                  onClose={() => setPicking(null)}
                  onPick={(opt) => {
                    update(i, {
                      href: opt.href,
                      label: l.label || opt.label,
                    });
                    setPicking(null);
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Save one global through Payload's REST endpoint. */
export async function saveGlobal(slug: string, body: unknown) {
  const res = await fetch(`/api/globals/${slug}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(
      json?.errors?.[0]?.message ||
        json?.message ||
        `Saving ${slug} failed (HTTP ${res.status})`,
    );
  }
}
