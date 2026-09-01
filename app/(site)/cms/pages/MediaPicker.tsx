"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

/**
 * Hero-image chooser: pick from the Media library, upload a file, or paste
 * an existing image URL.
 *
 * Media is NOT a Payload upload collection here — it's a plain collection
 * with `alt` + `url` columns (see src/payload/collections/Media.ts). So a
 * file upload is two steps:
 *
 *   1. POST the file to /api/blob-upload  → { url, filename, size, contentType }
 *   2. POST that url to /api/media        → the Media record
 *
 * Step 1 needs BLOB_READ_WRITE_TOKEN and returns 503 without it, which is
 * the normal state locally. The "paste a URL" path needs no token at all,
 * so it stays available either way.
 */

type MediaDoc = {
  id: string | number;
  url?: string | null;
  alt?: string | null;
  filename?: string | null;
};

export default function MediaPicker({
  valueId,
  valueUrl,
  onChange,
}: {
  valueId: string | number | null;
  valueUrl: string | null;
  onChange: (id: string | number | null, url: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MediaDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/media?limit=60&sort=-createdAt", {
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
      setLoading(false);
    }
  }, []);

  /** Open the picker, fetching the library the first time it's shown. */
  const toggle = useCallback(() => {
    setOpen((wasOpen) => {
      if (!wasOpen && items.length === 0) void load();
      return !wasOpen;
    });
  }, [items.length, load]);

  /** Step 2 — create the Media row for an already-public URL. */
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

  function select(doc: MediaDoc) {
    onChange(doc.id, doc.url ?? null);
    setItems((prev) => [doc, ...prev.filter((p) => p.id !== doc.id)]);
    setOpen(false);
  }

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      // Step 1 — put the bytes somewhere public.
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
            ? "File uploads need Vercel Blob (BLOB_READ_WRITE_TOKEN), which isn't set in this environment. Paste an image URL below instead."
            : upJson?.error || `Upload failed (HTTP ${up.status})`,
        );
        return;
      }
      // Step 2 — record it in the Media library.
      const doc = await createMedia({
        alt: file.name,
        url: upJson.url,
        filename: upJson.filename,
        mimeType: upJson.contentType,
        filesize: upJson.size,
      });
      if (doc?.id) select(doc);
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
    try {
      const doc = await createMedia({
        alt: url.split("/").pop()?.split("?")[0] || "Image",
        url,
        filename: url.split("/").pop()?.split("?")[0],
      });
      if (doc?.id) {
        setUrlDraft("");
        select(doc);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add that URL");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-1">
      {valueUrl ? (
        <div className="flex items-start gap-4">
          <div className="relative h-[90px] w-[150px] overflow-hidden rounded-lg border border-[#d8ddd0] bg-[#f4f6f0]">
            <Image
              src={valueUrl}
              alt="Hero image"
              fill
              sizes="150px"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={toggle}
              className="text-[13px] text-[#1a1a1a] underline-offset-2 hover:underline"
            >
              Change image
            </button>
            <button
              type="button"
              onClick={() => onChange(null, null)}
              className="text-left text-[13px] text-[#8a2b2b] underline-offset-2 hover:underline"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={toggle}
          className="rounded-lg border border-dashed border-[#c9d0bd] bg-[#fafbf7] px-4 py-3 text-[13px] text-[#616161] transition-colors hover:bg-[#f2f5ec]"
        >
          {open ? "Close picker" : "+ Choose or upload an image"}
        </button>
      )}

      {open && (
        <div className="mt-3 rounded-lg border border-[#e4e7de] bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <label className="cursor-pointer rounded-lg bg-[#1a1a1a] px-3 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90">
              {busy ? "Working…" : "Upload file"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void upload(f);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => void load()}
              className="text-[12px] text-[#616161] underline-offset-2 hover:underline"
            >
              Refresh
            </button>
            {valueId && (
              <span className="text-[12px] text-[#8a8a8a]">
                Selected: #{String(valueId)}
              </span>
            )}
          </div>

          {/* Works with no Blob token — the reliable path in local dev. */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              type="url"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="…or paste an image URL (https://…)"
              className="min-w-[240px] flex-1 rounded-lg border border-[#d8ddd0] px-3 py-1.5 text-[13px] outline-none focus:border-[#1a1a1a]"
            />
            <button
              type="button"
              onClick={() => void addByUrl()}
              disabled={busy || !urlDraft.trim()}
              className="rounded-lg border border-[#d8ddd0] bg-white px-3 py-1.5 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0] disabled:opacity-40"
            >
              Add URL
            </button>
          </div>

          {error && (
            <p className="mb-3 rounded border border-[#e5b3b3] bg-[#fdf3f3] px-3 py-2 text-[12px] leading-relaxed text-[#8a2b2b]">
              {error}
            </p>
          )}

          {loading ? (
            <p className="text-[13px] text-[#616161]">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-[13px] text-[#616161]">
              No images yet — upload one or paste a URL above.
            </p>
          ) : (
            <div className="grid max-h-[280px] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5">
              {items.map((m) => (
                <button
                  key={String(m.id)}
                  type="button"
                  onClick={() => select(m)}
                  title={m.filename ?? undefined}
                  className={`relative aspect-square overflow-hidden rounded border transition-colors ${
                    String(m.id) === String(valueId)
                      ? "border-[#1a1a1a]"
                      : "border-[#e4e7de] hover:border-[#b9c2ad]"
                  }`}
                >
                  {m.url ? (
                    <Image
                      src={m.url}
                      alt={m.alt ?? ""}
                      fill
                      sizes="120px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-[10px] text-[#8a8a8a]">
                      no preview
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
