"use client";

import { useRef, useState } from "react";

import { fieldInput, fieldLabel } from "../LinkFields";

/**
 * A video for one slide: upload an .mp4/.webm/.mov (sent straight from the
 * browser to Vercel Blob, so large files work), or paste a video URL. Empty
 * means the slide is just its image.
 */
export default function VideoField({
  value,
  onChange,
  label = "Video (optional)",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [warning, setWarning] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    // iPhone .mov files are usually HEVC, which Chrome, Firefox and most
    // Android phones can't play; very large files take ages to start.
    const notes: string[] = [];
    if (/quicktime/i.test(file.type) || /\.mov$/i.test(file.name)) {
      notes.push(".mov (iPhone) videos often won't play in Chrome or on Android — export as MP4 (H.264) instead.");
    }
    if (file.size > 25 * 1024 * 1024) {
      notes.push(`This file is ${Math.round(file.size / 1024 / 1024)} MB — under 20 MB starts much faster on phones.`);
    }
    setWarning(notes.length ? notes.join(" ") : null);
    setProgress(0);
    try {
      const { upload } = await import("@vercel/blob/client");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 100);
      const blob = await upload(`media/videos/${safeName}`, file, {
        access: "public",
        handleUploadUrl: "/api/blob-upload-token?video=1",
        contentType: file.type || undefined,
        onUploadProgress: (e) => setProgress(Math.round(e.percentage)),
      });
      onChange(blob.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <label className={fieldLabel}>{label}</label>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <input
          className={`${fieldInput} min-w-[220px] flex-1`}
          value={value}
          placeholder="https://… .mp4 — or upload"
          onChange={(e) => onChange(e.target.value.trim())}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="rounded-lg border border-[#d8ddd0] bg-white px-3 py-2 text-[13px] font-medium text-[#1a1a1a] hover:bg-[#f4f6f0] disabled:opacity-60"
        >
          {busy ? `Uploading… ${progress}%` : "Upload video"}
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded px-2 py-2 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]"
          >
            Remove
          </button>
        ) : null}
        <input
          ref={input}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </div>
      {value ? (
        <video src={value} controls preload="metadata" className="mt-2 max-h-[180px] rounded-lg bg-black" />
      ) : null}
      <p className="mt-1 text-[12px] text-[#8a8a8a]">
        Best: MP4 (H.264), under 20 MB, 720p is plenty. The image above is the cover until someone presses play.
      </p>
      {warning ? <p className="mt-1 text-[12px] text-[#9a5b00]">{warning}</p> : null}
      {error ? <p className="mt-1 text-[12px] text-[#8a2b2b]">{error}</p> : null}
    </div>
  );
}
