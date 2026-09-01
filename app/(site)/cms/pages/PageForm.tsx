"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import RichTextEditor from "./RichTextEditor";
import MediaPicker from "./MediaPicker";

/**
 * Create / edit form for a CMS page.
 *
 * Talks to Payload's own REST endpoints (`/api/pages`) rather than a
 * bespoke API: the collection's access rules (admin-only writes) are then
 * enforced server-side by Payload, and the session cookie is already what
 * authenticates every other surface.
 *
 * Body is authored in RichTextEditor (Write / HTML / Preview) and stored as
 * HTML in `bodyHtml`. Lexical rich text stays available in Payload's editor
 * for anyone who prefers it — a page can use either, and `bodyHtml` wins when
 * both are present (the same rule /blogs already applies).
 */

export type PageDoc = {
  id?: string | number;
  title?: string;
  slug?: string;
  excerpt?: string | null;
  bodyHtml?: string | null;
  status?: string;
  publishedAt?: string | null;
  heroImage?: { id?: string | number; url?: string | null } | string | number | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

const label = "block text-[13px] font-medium text-[#1a1a1a]";
const input =
  "mt-1 w-full rounded-lg border border-[#d8ddd0] bg-white px-3 py-2 text-[14px] text-[#1a1a1a] outline-none focus:border-[#1a1a1a]";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function PageForm({ initial }: { initial?: PageDoc }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [bodyHtml, setBodyHtml] = useState(initial?.bodyHtml ?? "");
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(
    initial?.metaDescription ?? "",
  );
  const initialHero =
    initial?.heroImage && typeof initial.heroImage === "object"
      ? initial.heroImage
      : null;
  const [heroId, setHeroId] = useState<string | number | null>(
    initialHero?.id ?? (typeof initial?.heroImage === "number" || typeof initial?.heroImage === "string" ? (initial.heroImage as string | number) : null),
  );
  const [heroUrl, setHeroUrl] = useState<string | null>(initialHero?.url ?? null);
  const [publishedAt, setPublishedAt] = useState(
    initial?.publishedAt ? String(initial.publishedAt).slice(0, 10) : "",
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Slug follows the title until the user edits it by hand.
  const effectiveSlug = useMemo(
    () => (slugTouched ? slug : slugify(title)),
    [slug, slugTouched, title],
  );

  async function save(nextStatus?: string) {
    setSaving(true);
    setError(null);
    const body = {
      title,
      slug: effectiveSlug,
      excerpt: excerpt || null,
      bodyHtml: bodyHtml || null,
      status: nextStatus ?? status,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      heroImage: heroId ?? null,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
    };
    try {
      const res = await fetch(
        isEdit ? `/api/pages/${initial!.id}` : "/api/pages",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail =
          json?.errors?.[0]?.message || json?.message || `HTTP ${res.status}`;
        setError(
          res.status === 403
            ? `${detail}. If this says you're not allowed, the server URL in .env must match the port you're browsing on (Payload rejects cookie auth from other origins).`
            : `Save failed: ${detail}`,
        );
        return;
      }
      if (nextStatus) setStatus(nextStatus);
      router.push("/cms/pages");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!isEdit) return;
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/pages/${initial!.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setError(`Delete failed (HTTP ${res.status})`);
        return;
      }
      router.push("/cms/pages");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[900px]">
      <header className="mb-6">
        <Link
          href="/cms/pages"
          className="text-[13px] text-[#616161] underline-offset-2 hover:underline"
        >
          ← Pages
        </Link>
        <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">
          {isEdit ? "Edit page" : "New page"}
        </h1>
        {effectiveSlug && (
          <p className="mt-1 text-[13px] text-[#616161]">
            Will appear at{" "}
            <code className="rounded bg-[#eef1e8] px-1.5 py-0.5">
              /{effectiveSlug}
            </code>
          </p>
        )}
      </header>

      {error && (
        <p className="mb-4 rounded-lg border border-[#e5b3b3] bg-[#fdf3f3] px-4 py-3 text-[13px] text-[#8a2b2b]">
          {error}
        </p>
      )}

      <div className="space-y-5 rounded-xl border border-[#e4e7de] bg-white p-6">
        <div>
          <label className={label} htmlFor="title">
            Title
          </label>
          <input
            id="title"
            className={input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="About us"
          />
        </div>

        <div>
          <label className={label} htmlFor="slug">
            URL slug
          </label>
          <input
            id="slug"
            className={input}
            value={effectiveSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            placeholder="about-us"
          />
          <p className="mt-1 text-[12px] text-[#8a8a8a]">
            Lowercase letters, numbers and hyphens. Auto-filled from the title.
          </p>
        </div>

        <div>
          <label className={label} htmlFor="excerpt">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            className={`${input} min-h-[70px]`}
            value={excerpt ?? ""}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Short summary shown under the title and in social previews."
          />
        </div>

        <div>
          <span className={label}>Hero image</span>
          <MediaPicker
            valueId={heroId}
            valueUrl={heroUrl}
            onChange={(id, url) => {
              setHeroId(id);
              setHeroUrl(url);
            }}
          />
          <p className="mt-1 text-[12px] text-[#8a8a8a]">
            Optional. Shown at the top of the page, under the title.
          </p>
        </div>

        <div>
          <label className={label} htmlFor="publishedAt">
            Publish date
          </label>
          <input
            id="publishedAt"
            type="date"
            className={`${input} max-w-[220px]`}
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
          />
          <p className="mt-1 text-[12px] text-[#8a8a8a]">
            Set automatically on first publish. Override it here if needed.
          </p>
        </div>

        <div>
          <span className={label}>Body</span>
          <RichTextEditor value={bodyHtml ?? ""} onChange={setBodyHtml} />
          <p className="mt-1 text-[12px] text-[#8a8a8a]">
            <strong>Write</strong> for the formatting toolbar,{" "}
            <strong>HTML</strong> to edit the markup directly,{" "}
            <strong>Preview</strong> to see it as the page will render.
          </p>
        </div>

        <details className="rounded-lg border border-[#e4e7de] p-4">
          <summary className="cursor-pointer text-[13px] font-medium text-[#1a1a1a]">
            SEO
          </summary>
          <div className="mt-4 space-y-4">
            <div>
              <label className={label} htmlFor="metaTitle">
                Meta title
              </label>
              <input
                id="metaTitle"
                className={input}
                value={metaTitle ?? ""}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Falls back to the page title"
              />
            </div>
            <div>
              <label className={label} htmlFor="metaDescription">
                Meta description
              </label>
              <textarea
                id="metaDescription"
                className={`${input} min-h-[70px]`}
                value={metaDescription ?? ""}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Falls back to the excerpt"
              />
            </div>
          </div>
        </details>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saving || !title || !effectiveSlug}
          onClick={() => save("published")}
          className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save & publish"}
        </button>
        <button
          type="button"
          disabled={saving || !title || !effectiveSlug}
          onClick={() => save("draft")}
          className="rounded-lg border border-[#d8ddd0] bg-white px-4 py-2 text-[13px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0] disabled:opacity-40"
        >
          Save as draft
        </button>
        {isEdit && status === "published" && (
          <Link
            href={`/${effectiveSlug}`}
            target="_blank"
            className="text-[13px] text-[#616161] underline-offset-2 hover:underline"
          >
            View live page ↗
          </Link>
        )}
        {isEdit && (
          <button
            type="button"
            disabled={saving}
            onClick={remove}
            className="ml-auto text-[13px] text-[#8a2b2b] underline-offset-2 hover:underline disabled:opacity-40"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
