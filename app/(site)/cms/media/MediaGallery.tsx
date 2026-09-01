"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";

/**
 * The media library: everything uploaded or added by URL, in one grid.
 *
 * Uses the same two-step flow as MediaPicker, because Media is not a Payload
 * upload collection here — it's a plain collection with `alt` + `url`:
 *
 *   1. POST the file to /api/blob-upload  → { url, filename, size, contentType }
 *   2. POST that url to /api/media        → the Media record
 *
 * Step 1 needs BLOB_READ_WRITE_TOKEN and returns 503 without it, which is the
 * normal state locally — so adding by URL stays available either way, and
 * anything added here shows up in the picker (both read the same collection).
 */

type MediaDoc = {
  id: string | number;
  url?: string | null;
  alt?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  createdAt?: string | null;
};

function prettySize(bytes?: number | null) {
  if (!bytes || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaGallery({ initial }: { initial: MediaDoc[] }) {
  const [items, setItems] = useState<MediaDoc[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [q, setQ] = useState("");

  const reload = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/media?limit=200&sort=-createdAt", {
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.message || `Couldn't load media (${res.status})`);
        return;
      }
      setItems((json?.docs ?? []) as MediaDoc[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load media");
    } finally {
      setBusy(false);
    }
  }, []);

  async function createMedia(fields: {
    alt: string;
    url: string;
    filename?: string;
    mimeType?: string;
    filesize?: number;
  }) {
    const res = await fetch("/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(fields),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        json?.errors?.[0]?.message ||
          json?.message ||
          `Couldn't save the media record (HTTP ${res.status})`,
      );
    }
    return (json?.doc ?? json) as MediaDoc;
  }

  async function uploadFiles(files: FileList) {
    setBusy(true);
    setError(null);
    setNotice(null);
    const added: MediaDoc[] = [];
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch("/api/blob-upload", {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        const upJson = await up.json().catch(() => ({}));
        if (!up.ok || !upJson?.url) {
          setError(
            up.status === 503
              ? "File uploads need Vercel Blob (BLOB_READ_WRITE_TOKEN), which isn't set in this environment. Add an image by URL instead."
              : upJson?.error || `Upload failed (HTTP ${up.status})`,
          );
          break;
        }
        const doc = await createMedia({
          alt: file.name,
          url: upJson.url,
          filename: upJson.filename,
          mimeType: upJson.contentType,
          filesize: upJson.size,
        });
        if (doc?.id) added.push(doc);
      }
      if (added.length) {
        setItems((prev) => [...added, ...prev]);
        setNotice(
          `${added.length} image${added.length > 1 ? "s" : ""} added to the library.`,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function addByUrl() {
    const url = urlDraft.trim();
    if (!url) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const existing = items.find((m) => m.url === url);
      if (existing) {
        setUrlDraft("");
        setNotice("That image is already in the library.");
        return;
      }
      const name = url.split("/").pop()?.split("?")[0] || "Image";
      const doc = await createMedia({ alt: name, url, filename: name });
      if (doc?.id) {
        setItems((prev) => [doc, ...prev]);
        setUrlDraft("");
        setNotice("Added to the library.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add that URL");
    } finally {
      setBusy(false);
    }
  }

  async function remove(m: MediaDoc) {
    if (
      !confirm(
        `Delete "${m.alt || m.filename || m.id}" from the library?\n\nAnything still using this image will lose it.`,
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/media/${m.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(
          json?.errors?.[0]?.message || `Delete failed (HTTP ${res.status})`,
        );
        return;
      }
      setItems((prev) => prev.filter((x) => x.id !== m.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  const needle = q.trim().toLowerCase();
  const shown = needle
    ? items.filter(
        (m) =>
          (m.alt ?? "").toLowerCase().includes(needle) ||
          (m.filename ?? "").toLowerCase().includes(needle) ||
          (m.url ?? "").toLowerCase().includes(needle),
      )
    : items;

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/cms"
            className="text-[13px] text-[#616161] underline-offset-2 hover:underline"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">Media</h1>
          <p className="mt-1 text-[14px] text-[#616161]">
            Every image in the library. Anything added here is available in the
            image pickers across the CMS.
          </p>
        </div>
        <label className="cursor-pointer rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90">
          {busy ? "Working…" : "Upload images"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              if (e.target.files?.length) void uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </header>

      {error && (
        <p className="mb-4 rounded-lg border border-[#e5b3b3] bg-[#fdf3f3] px-4 py-3 text-[13px] leading-relaxed text-[#8a2b2b]">
          {error}
        </p>
      )}
      {notice && (
        <p className="mb-4 rounded-lg border border-[#bcd9b8] bg-[#f1f8ef] px-4 py-3 text-[13px] text-[#2f6b33]">
          {notice}
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or URL…"
          className="min-w-[200px] flex-1 rounded-lg border border-[#d8ddd0] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1a1a]"
        />
        <input
          type="url"
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          placeholder="Add by URL: https://… or /assets/…"
          className="min-w-[220px] flex-1 rounded-lg border border-[#d8ddd0] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1a1a]"
        />
        <button
          type="button"
          onClick={() => void addByUrl()}
          disabled={busy || !urlDraft.trim()}
          className="rounded-lg border border-[#d8ddd0] bg-white px-3 py-2 text-[13px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0] disabled:opacity-40"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => void reload()}
          disabled={busy}
          className="text-[13px] text-[#616161] underline-offset-2 hover:underline disabled:opacity-40"
        >
          Refresh
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-xl border border-[#e4e7de] bg-white p-8 text-center">
          <p className="text-[15px] font-medium text-[#1a1a1a]">
            {items.length === 0 ? "No images yet" : "No matches"}
          </p>
          <p className="mx-auto mt-2 max-w-[440px] text-[13px] leading-relaxed text-[#616161]">
            {items.length === 0
              ? "Upload images with the button above, or add one by URL. They'll appear here and in every image picker in the CMS."
              : "Try a different search."}
          </p>
        </div>
      ) : (
        <>
          <p className="mb-2 text-[12px] text-[#8a8a8a]">
            {shown.length} image{shown.length === 1 ? "" : "s"}
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((m) => (
              <div
                key={String(m.id)}
                className="group overflow-hidden rounded-xl border border-[#e4e7de] bg-white"
              >
                <div className="relative aspect-square bg-[#f4f6f0]">
                  {m.url ? (
                    <Image
                      src={m.url}
                      alt={m.alt ?? ""}
                      fill
                      sizes="240px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-[11px] text-[#8a8a8a]">
                      no preview
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => void remove(m)}
                    disabled={busy}
                    title="Delete from library"
                    aria-label={`Delete ${m.alt ?? "image"}`}
                    className="absolute right-2 top-2 hidden h-6 w-6 place-items-center rounded-full bg-black/65 text-[12px] leading-none text-white group-hover:grid hover:bg-[#8a2b2b]"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-3">
                  <p
                    className="truncate text-[13px] font-medium text-[#1a1a1a]"
                    title={m.alt ?? undefined}
                  >
                    {m.alt || m.filename || "(untitled)"}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-[#8a8a8a]" title={m.url ?? undefined}>
                    {m.url}
                  </p>
                  {prettySize(m.filesize) && (
                    <p className="mt-0.5 text-[11px] text-[#8a8a8a]">
                      {prettySize(m.filesize)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
