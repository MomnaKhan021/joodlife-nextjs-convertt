"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

/**
 * Hero-image chooser: pick from the existing Media library or upload a new
 * file. Both go through Payload's `/api/media` endpoints, so uploads land
 * wherever Media is configured to store them (Vercel Blob in production,
 * local disk in dev) and the admin-only rules still apply.
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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("_payload", JSON.stringify({ alt: file.name }));
      const res = await fetch("/api/media", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          json?.errors?.[0]?.message || `Upload failed (HTTP ${res.status})`,
        );
        return;
      }
      const doc = (json?.doc ?? json) as MediaDoc;
      if (doc?.id) {
        onChange(doc.id, doc.url ?? null);
        setItems((prev) => [doc, ...prev]);
        setOpen(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
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
              {uploading ? "Uploading…" : "Upload new"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
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

          {error && (
            <p className="mb-3 rounded border border-[#e5b3b3] bg-[#fdf3f3] px-3 py-2 text-[12px] text-[#8a2b2b]">
              {error}
            </p>
          )}

          {loading ? (
            <p className="text-[13px] text-[#616161]">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-[13px] text-[#616161]">
              No images yet — upload one above.
            </p>
          ) : (
            <div className="grid max-h-[280px] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5">
              {items.map((m) => (
                <button
                  key={String(m.id)}
                  type="button"
                  onClick={() => {
                    onChange(m.id, m.url ?? null);
                    setOpen(false);
                  }}
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
