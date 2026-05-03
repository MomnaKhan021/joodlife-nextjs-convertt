"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Blog = {
  id: number;
  title: string;
  handle: string;
  sampleArticleTitle: string | null;
};

type ImportPage = {
  ok: boolean;
  fetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
  nextPageInfo: string | null;
  error?: string;
  status?: number;
};

type Stats = {
  pages: number;
  fetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
};

const ZERO: Stats = {
  pages: 0,
  fetched: 0,
  inserted: 0,
  updated: 0,
  skipped: 0,
  errors: [],
};

export default function ShopifyImportClient() {
  // --- connection state ---
  const [config, setConfig] = useState<
    | { state: "loading" }
    | { state: "missing"; error: string }
    | { state: "error"; error: string }
    | { state: "ready"; blogs: Blog[] }
  >({ state: "loading" });

  // --- import state ---
  const [selectedBlog, setSelectedBlog] = useState<number | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<"as-shopify" | "draft">(
    "as-shopify"
  );
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState<Stats>(ZERO);
  const [fatal, setFatal] = useState<string | null>(null);
  const cancelRef = useRef(false);

  // --- bootstrap: fetch list of Shopify blogs ---
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/shopify/test", {
          credentials: "include",
        });
        const json = (await res.json()) as
          | { ok: true; blogs: Blog[] }
          | { ok: false; hasConfig?: boolean; error: string };
        if (!alive) return;
        if (json.ok) {
          setConfig({ state: "ready", blogs: json.blogs });
          if (json.blogs.length > 0) setSelectedBlog(json.blogs[0].id);
        } else {
          setConfig({
            state: json.hasConfig === false ? "missing" : "error",
            error: json.error,
          });
        }
      } catch (err) {
        if (!alive) return;
        setConfig({
          state: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const start = useCallback(async () => {
    if (!selectedBlog) return;
    cancelRef.current = false;
    setRunning(true);
    setDone(false);
    setFatal(null);
    setStats(ZERO);

    let pageInfo: string | undefined = undefined;
    const acc: Stats = { ...ZERO, errors: [] };

    try {
      // Hard-bound the loop. 1000 pages × 250 articles = 250k articles.
      for (let page = 0; page < 1000; page++) {
        if (cancelRef.current) break;

        const res = await fetch("/api/shopify/import-posts", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blogId: selectedBlog,
            limit: 50,
            pageInfo,
            ...(defaultStatus === "draft" ? { status: "draft" } : {}),
          }),
        });

        const json = (await res.json()) as ImportPage;
        if (!res.ok || !json.ok) {
          setFatal(
            json.error ??
              `Import failed (HTTP ${res.status}${
                json.status ? ` · Shopify ${json.status}` : ""
              })`
          );
          break;
        }

        acc.pages += 1;
        acc.fetched += json.fetched ?? 0;
        acc.inserted += json.inserted ?? 0;
        acc.updated += json.updated ?? 0;
        acc.skipped += json.skipped ?? 0;
        if (json.errors?.length) acc.errors.push(...json.errors);

        setStats({ ...acc, errors: [...acc.errors] });

        if (!json.nextPageInfo) break;
        pageInfo = json.nextPageInfo;
      }
    } catch (err) {
      setFatal(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
      setDone(true);
    }
  }, [selectedBlog, defaultStatus]);

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  /* ------------------------------------------------------------------ */
  /* Renders                                                             */
  /* ------------------------------------------------------------------ */

  if (config.state === "loading") {
    return (
      <div className="rounded-2xl border border-[#142e2a]/10 bg-white p-6 font-ui text-[14px] text-[#142e2a]/70">
        Checking Shopify connection…
      </div>
    );
  }

  if (config.state === "missing") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 font-ui text-[14px] text-amber-900">
        <strong className="font-semibold">Shopify isn&apos;t connected yet.</strong>
        <p className="mt-2">{config.error}</p>
        <p className="mt-3 text-[13px]">
          Add <code className="rounded bg-amber-100 px-1">SHOPIFY_STORE_DOMAIN</code>{" "}
          and{" "}
          <code className="rounded bg-amber-100 px-1">
            SHOPIFY_ADMIN_ACCESS_TOKEN
          </code>{" "}
          to your Vercel project (Settings → Environment Variables) and
          redeploy. See instructions below.
        </p>
        <SetupInstructions />
      </div>
    );
  }

  if (config.state === "error") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 font-ui text-[14px] text-red-800">
        <strong className="font-semibold">Connection failed.</strong>
        <p className="mt-2">{config.error}</p>
        <p className="mt-3 text-[13px]">
          Most common causes: wrong store domain (must be the
          .myshopify.com domain, not your custom domain), expired token,
          or missing <code>read_content</code> scope on the custom app.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
      {/* Left: action card */}
      <section className="rounded-2xl border border-[#142e2a]/10 bg-white p-6 md:p-8">
        <h2 className="font-display text-[20px] font-semibold text-[#142e2a]">
          Import articles
        </h2>
        <p className="mt-2 font-ui text-[14px] text-[#142e2a]/75">
          Each batch pulls 50 articles from Shopify and upserts them into
          your posts table.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="font-ui text-[12px] font-semibold uppercase tracking-[0.06em] text-[#142e2a]/60">
              Shopify blog
            </span>
            <select
              value={selectedBlog ?? ""}
              onChange={(e) => setSelectedBlog(Number(e.target.value))}
              disabled={running}
              className="mt-2 w-full rounded-lg border border-[#142e2a]/15 bg-white px-3 py-2 font-ui text-[14px] text-[#142e2a] focus:outline-none focus:ring-2 focus:ring-[#142e2a]/20"
            >
              {config.blogs.length === 0 ? (
                <option value="">No blogs found in store</option>
              ) : null}
              {config.blogs.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.handle})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-ui text-[12px] font-semibold uppercase tracking-[0.06em] text-[#142e2a]/60">
              Status on import
            </span>
            <select
              value={defaultStatus}
              onChange={(e) =>
                setDefaultStatus(e.target.value as "as-shopify" | "draft")
              }
              disabled={running}
              className="mt-2 w-full rounded-lg border border-[#142e2a]/15 bg-white px-3 py-2 font-ui text-[14px] text-[#142e2a] focus:outline-none focus:ring-2 focus:ring-[#142e2a]/20"
            >
              <option value="as-shopify">
                Match Shopify (published if published in Shopify)
              </option>
              <option value="draft">All as drafts (review before publishing)</option>
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={start}
            disabled={running || !selectedBlog}
            className="inline-flex items-center gap-2 rounded-full bg-[#142e2a] px-6 py-3 font-ui text-[14px] font-semibold text-white transition hover:bg-[#1d3f3a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running ? (
              <>
                <Spinner /> Importing…
              </>
            ) : done ? (
              "Run import again"
            ) : (
              "Start import"
            )}
          </button>
          {running ? (
            <button
              type="button"
              onClick={cancel}
              className="inline-flex items-center rounded-full border border-[#142e2a]/20 px-5 py-3 font-ui text-[14px] font-semibold text-[#142e2a] transition hover:border-[#142e2a]/40"
            >
              Stop
            </button>
          ) : null}
          {done && !fatal ? (
            <>
              <a
                href="/admin/collections/posts"
                className="inline-flex items-center rounded-full border border-[#142e2a]/20 px-5 py-3 font-ui text-[14px] font-semibold text-[#142e2a] transition hover:border-[#142e2a]/40"
              >
                Open Posts in CMS →
              </a>
              <a
                href="/blog"
                className="inline-flex items-center rounded-full border border-[#142e2a]/20 px-5 py-3 font-ui text-[14px] font-semibold text-[#142e2a] transition hover:border-[#142e2a]/40"
              >
                View /blog →
              </a>
            </>
          ) : null}
        </div>

        {fatal ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 font-ui text-[13px] text-red-800">
            <strong className="font-semibold">Import stopped.</strong>{" "}
            {fatal}
          </div>
        ) : null}

        {stats.errors.length > 0 ? (
          <details className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 font-ui text-[13px] text-amber-900">
            <summary className="cursor-pointer font-semibold">
              {stats.errors.length} per-row error
              {stats.errors.length === 1 ? "" : "s"}
            </summary>
            <ul className="mt-3 space-y-1 font-mono text-[12px] leading-relaxed">
              {stats.errors.slice(0, 50).map((e, i) => (
                <li key={i} className="break-all">
                  • {e}
                </li>
              ))}
              {stats.errors.length > 50 ? (
                <li className="opacity-70">
                  …and {stats.errors.length - 50} more (truncated)
                </li>
              ) : null}
            </ul>
          </details>
        ) : null}
      </section>

      {/* Right: live stats */}
      <aside className="rounded-2xl border border-[#142e2a]/10 bg-[#f7f9f2] p-6">
        <h2 className="font-ui text-[12px] font-semibold uppercase tracking-[0.06em] text-[#142e2a]/60">
          Progress
        </h2>
        <dl className="mt-4 space-y-3 font-ui text-[14px]">
          <Row label="Pages" value={stats.pages} />
          <Row label="Fetched" value={stats.fetched} />
          <Row label="Inserted" value={stats.inserted} accent="green" />
          <Row label="Updated" value={stats.updated} accent="blue" />
          <Row label="Skipped" value={stats.skipped} />
          <Row
            label="Errors"
            value={stats.errors.length}
            accent={stats.errors.length ? "red" : undefined}
          />
        </dl>

        {done && !fatal ? (
          <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3 font-ui text-[13px] text-emerald-900">
            ✓ Import complete. {stats.inserted} new, {stats.updated} updated.
          </p>
        ) : null}
      </aside>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "green" | "blue" | "red";
}) {
  const color =
    accent === "green"
      ? "text-emerald-700"
      : accent === "blue"
        ? "text-sky-700"
        : accent === "red"
          ? "text-red-700"
          : "text-[#142e2a]";
  return (
    <div className="flex items-baseline justify-between border-b border-[#142e2a]/10 pb-2 last:border-b-0 last:pb-0">
      <dt className="text-[#142e2a]/65">{label}</dt>
      <dd className={`font-display text-[22px] font-semibold ${color}`}>
        {value.toLocaleString()}
      </dd>
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
    />
  );
}

function SetupInstructions() {
  return (
    <details className="mt-4 rounded-lg border border-amber-200 bg-amber-100/60 p-3 font-ui text-[13px] text-amber-900">
      <summary className="cursor-pointer font-semibold">
        How to set up Shopify access (3 minutes)
      </summary>
      <ol className="mt-3 list-decimal space-y-2 pl-5">
        <li>
          In your Shopify admin, go to{" "}
          <strong>Settings → Apps and sales channels → Develop apps</strong>{" "}
          (you may need to enable custom app development first).
        </li>
        <li>
          Click <strong>Create an app</strong>. Name it something like
          &quot;JoodLife Sync&quot;.
        </li>
        <li>
          Open <strong>Configuration → Admin API integration</strong>.
          Tick <code className="rounded bg-amber-50 px-1">read_content</code>{" "}
          (covers blogs &amp; articles). Save.
        </li>
        <li>
          Open <strong>API credentials</strong> →{" "}
          <strong>Install app</strong>. Copy the{" "}
          <strong>Admin API access token</strong> (starts with{" "}
          <code className="rounded bg-amber-50 px-1">shpat_</code>).
        </li>
        <li>
          In Vercel: Project → Settings → Environment Variables. Add:
          <ul className="mt-1 list-disc pl-5">
            <li>
              <code className="rounded bg-amber-50 px-1">
                SHOPIFY_STORE_DOMAIN
              </code>{" "}
              = e.g.{" "}
              <code className="rounded bg-amber-50 px-1">
                yourstore.myshopify.com
              </code>{" "}
              (no <code>https://</code>)
            </li>
            <li>
              <code className="rounded bg-amber-50 px-1">
                SHOPIFY_ADMIN_ACCESS_TOKEN
              </code>{" "}
              = the <code>shpat_…</code> token
            </li>
          </ul>
        </li>
        <li>Redeploy, then refresh this page.</li>
      </ol>
    </details>
  );
}
