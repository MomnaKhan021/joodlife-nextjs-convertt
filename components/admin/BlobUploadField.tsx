"use client";

import { useField } from "@payloadcms/ui";
import { useState } from "react";

/**
 * Custom field component for the Media collection.
 *
 * Renders a file picker. On select:
 *   1. POST the file to /api/blob-upload?no-record=1 (we're already
 *      inside a Media create form — Save will do the INSERT for us)
 *   2. Use Payload's useField hook to fill the form's url / filename /
 *      mimeType / filesize / alt fields with the upload response
 *   3. Show a thumbnail preview
 *
 * The user then clicks Save — Payload writes a normal collection row
 * with the URL pointing at Vercel Blob. No upload pipeline, no disk
 * writes, no Vercel filesystem issues.
 */
export function BlobUploadField() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const url = useField<string>({ path: "url" });
  const filename = useField<string>({ path: "filename" });
  const mimeType = useField<string>({ path: "mimeType" });
  const filesize = useField<number>({ path: "filesize" });
  const alt = useField<string>({ path: "alt" });

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/blob-upload?no-record=1", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Upload failed (${res.status}): ${text.slice(0, 200)}`);
      }
      const json = await res.json();
      if (!json?.url) throw new Error("No URL in response");

      url.setValue(json.url);
      filename.setValue(json.filename ?? file.name);
      mimeType.setValue(json.contentType ?? file.type);
      filesize.setValue(Number(json.size ?? file.size));
      if (!alt.value) alt.setValue(file.name);

      setPreview(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const isVideo =
    typeof mimeType.value === "string" && mimeType.value.startsWith("video/");

  return (
    <div className="jood-blob-field">
      <label className="jood-blob-field__label">Upload file</label>
      <p className="jood-blob-field__hint">
        Pick an image or video. It uploads to Vercel Blob and the URL
        below is filled automatically.
      </p>

      <div className="jood-blob-field__dropzone">
        <label className="jood-blob-field__pick">
          {busy ? "Uploading…" : "Choose file"}
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFile}
            disabled={busy}
          />
        </label>
        {url.value ? (
          <span className="jood-blob-field__status">
            ✓ Uploaded — click Save to persist
          </span>
        ) : null}
      </div>

      {error ? <p className="jood-blob-field__error">{error}</p> : null}

      {preview || url.value ? (
        <div className="jood-blob-field__preview">
          {isVideo ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              src={preview ?? url.value}
              controls
              className="jood-blob-field__preview-media"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview ?? url.value}
              alt="Upload preview"
              className="jood-blob-field__preview-media"
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

export default BlobUploadField;
