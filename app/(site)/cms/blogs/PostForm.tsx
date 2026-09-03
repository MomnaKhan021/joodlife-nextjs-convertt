"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { CATEGORIES } from "@/lib/postCategories";

import MediaPicker from "../MediaPicker";
import RichTextEditor from "../pages/RichTextEditor";

/**
 * Create / edit form for a blog post.
 *
 * Talks to Payload's own REST endpoints (`/api/posts`) rather than a bespoke
 * API, so the collection's access rules are enforced server-side and the
 * session cookie is what authenticates — the same arrangement as Pages.
 *
 * The body is authored as HTML in `bodyHtml`, which is what /blogs/[slug]
 * prefers; a post imported with a Lexical `content` tree still renders from
 * that when bodyHtml is empty, so importing and hand-writing coexist.
 */

export type PostDoc = {
  id?: string | number;
  title?: string;
  slug?: string;
  excerpt?: string | null;
  bodyHtml?: string | null;
  /** Lexical tree from Payload's own editor or an import. Read-only here. */
  content?: unknown;
  category?: string | null;
  tags?: { tag?: string }[] | null;
  authorName?: string | null;
  status?: string;
  publishedAt?: string | null;
  heroImage?:
    | { id?: string | number; url?: string | null }
    | string
    | number
    | null;
  heroImageUrl?: string | null;
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

export default function PostForm({ initial }: { initial?: PostDoc }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [bodyHtml, setBodyHtml] = useState(initial?.bodyHtml ?? "");
  const [category, setCategory] = useState(initial?.category ?? "weight-loss");
  const [tags, setTags] = useState<string[]>(
    (initial?.tags ?? [])
      .map((t) => t?.tag ?? "")
      .filter((t) => t.trim() !== ""),
  );
  const [tagDraft, setTagDraft] = useState("");
  const [authorName, setAuthorName] = useState(initial?.authorName ?? "");
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
    initialHero?.id ??
      (typeof initial?.heroImage === "number" ||
      typeof initial?.heroImage === "string"
        ? (initial.heroImage as string | number)
        : null),
  );
  const [heroUrl, setHeroUrl] = useState<string | null>(
    initialHero?.url ?? initial?.heroImageUrl ?? null,
  );

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

  // An imported post may have a Lexical body and no HTML. Writing HTML would
  // silently take over the page, so say so rather than letting it surprise.
  const hasLexicalOnly = Boolean(initial?.content) && !initial?.bodyHtml;

  function addTag(raw: string) {
    const t = raw.trim().replace(/,$/, "");
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
  }

  async function save(nextStatus?: string) {
    setSaving(true);
    setError(null);
    const body = {
      title,
      slug: effectiveSlug,
      excerpt: excerpt || null,
      bodyHtml: bodyHtml || null,
      category,
      tags: tags.map((tag) => ({ tag })),
      authorName: authorName || null,
      status: nextStatus ?? status,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      heroImage: heroId ?? null,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
    };
    try {
      const res = await fetch(
        isEdit ? `/api/posts/${initial!.id}` : "/api/posts",
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
      router.push("/cms/blogs");
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
      const res = await fetch(`/api/posts/${initial!.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setError(`Delete failed (HTTP ${res.status})`);
        return;
      }
      router.push("/cms/blogs");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[900px]">
      <header className="mb-6">
        <Link
          href="/cms/blogs"
          className="text-[13px] text-[#616161] underline-offset-2 hover:underline"
        >
          ← Blog posts
        </Link>
        <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">
          {isEdit ? "Edit post" : "New post"}
        </h1>
        {effectiveSlug && (
          <p className="mt-1 text-[13px] text-[#616161]">
            Will appear at{" "}
            <code className="rounded bg-[#eef1e8] px-1.5 py-0.5">
              /blogs/{effectiveSlug}
            </code>
          </p>
        )}
      </header>

      {error && (
        <p className="mb-4 rounded-lg border border-[#e5b3b3] bg-[#fdf3f3] px-4 py-3 text-[13px] text-[#8a2b2b]">
          {error}
        </p>
      )}

      {hasLexicalOnly && (
        <p className="mb-4 rounded-lg border border-[#f0e2c0] bg-[#fffaf0] px-4 py-3 text-[13px] leading-relaxed text-[#8a6100]">
          This post&apos;s body was written in Payload&apos;s own editor, so the
          Body box below starts empty. The post still reads correctly as it is —
          but anything you type below replaces that body on the live page.
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
            placeholder="Five things to know before starting treatment"
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
            placeholder="five-things-to-know"
          />
          <p className="mt-1 text-[12px] text-[#8a8a8a]">
            Lowercase letters, numbers and hyphens. Auto-filled from the title.
            Changing it on a published post breaks any link already shared.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="category">
              Category
            </label>
            <select
              id="category"
              className={input}
              value={category ?? "weight-loss"}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[12px] text-[#8a8a8a]">
              Sets which filter tab the post appears under on /blogs.
            </p>
          </div>
          <div>
            <label className={label} htmlFor="authorName">
              Author
            </label>
            <input
              id="authorName"
              className={input}
              value={authorName ?? ""}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="The Jood clinical team"
            />
          </div>
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
            placeholder="Short summary shown on the article card and in social previews."
          />
        </div>

        <div>
          <span className={label}>Cover image</span>
          <MediaPicker
            valueId={heroId}
            valueUrl={heroUrl}
            onChange={(id, url) => {
              setHeroId(id);
              setHeroUrl(url);
            }}
          />
          <p className="mt-1 text-[12px] text-[#8a8a8a]">
            Shown on the article card and at the top of the post.
          </p>
        </div>

        <div>
          <span className={label}>Tags</span>
          <div className="mt-1 flex flex-wrap items-center gap-2 rounded-lg border border-[#d8ddd0] bg-white p-2">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#eef1e8] px-2.5 py-1 text-[12px] text-[#1a1a1a]"
              >
                {t}
                <button
                  type="button"
                  aria-label={`Remove tag ${t}`}
                  onClick={() => setTags(tags.filter((x) => x !== t))}
                  className="text-[#8a2b2b]"
                >
                  ✕
                </button>
              </span>
            ))}
            <input
              aria-label="Add a tag"
              className="min-w-[140px] flex-1 border-0 bg-transparent px-1 py-1 text-[14px] outline-none"
              value={tagDraft}
              placeholder={tags.length ? "Add another…" : "glp-1, nutrition…"}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(tagDraft);
                  setTagDraft("");
                } else if (e.key === "Backspace" && !tagDraft && tags.length) {
                  setTags(tags.slice(0, -1));
                }
              }}
              onBlur={() => {
                // Don't silently lose a tag someone typed but didn't Enter.
                if (tagDraft.trim()) {
                  addTag(tagDraft);
                  setTagDraft("");
                }
              }}
            />
          </div>
          <p className="mt-1 text-[12px] text-[#8a8a8a]">
            Press Enter or comma after each tag.
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
            <strong>Preview</strong> to see it as the article will render.
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
                placeholder="Falls back to the post title"
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
            href={`/blogs/${effectiveSlug}`}
            target="_blank"
            className="text-[13px] text-[#616161] underline-offset-2 hover:underline"
          >
            View live post ↗
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
