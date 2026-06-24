"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Admin image upload — drag/drop or click to pick a file. POSTs to the
 * /api/blob-upload endpoint (admin-gated) and surfaces the resulting public
 * URL via onUploaded(). Supports two modes:
 *
 *   mode="single"   one hero image, square thumbnail with Remove
 *   mode="gallery"  multi-image gallery, reorderable list with previews
 *
 * Replaces the raw URL textareas on the product editor so the admin never has
 * to host an image elsewhere first.
 */

type Props =
  | {
      mode: "single";
      label?: string;
      value: string;
      onChange: (url: string) => void;
    }
  | {
      mode: "gallery";
      label?: string;
      value: string[];
      onChange: (urls: string[]) => void;
    };

async function uploadFile(file: File): Promise<string> {
  // Client-direct upload to Vercel Blob — bypasses the 4.5 MB serverless
  // body limit so large product photos work. /api/blob-upload-token
  // signs the upload after verifying the caller is an admin.
  const { upload } = await import("@vercel/blob/client");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 100);
  const blob = await upload(`media/${safeName}`, file, {
    access: "public",
    handleUploadUrl: "/api/blob-upload-token",
  });
  return blob.url;
}

function Thumb({ url, onRemove }: { url: string; onRemove: () => void }) {
  return (
    <div className="group relative overflow-hidden rounded-[8px] border border-[#e1e3e5] bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="h-28 w-full object-cover"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.opacity = "0.3";
        }}
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove image"
        className="absolute right-1.5 top-1.5 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-[#c0392b] opacity-0 shadow transition-opacity hover:bg-white group-hover:opacity-100"
      >
        Remove
      </button>
    </div>
  );
}

export default function ImageUpload(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (arr.length === 0) {
        setErr("Please choose image files.");
        return;
      }
      setBusy(true);
      setErr(null);
      try {
        const urls: string[] = [];
        for (const f of arr) {
          urls.push(await uploadFile(f));
        }
        if (props.mode === "single") {
          props.onChange(urls[urls.length - 1]);
        } else {
          props.onChange([...props.value, ...urls]);
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [props],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  return (
    <div className="flex flex-col gap-3">
      {props.mode === "single" && props.value ? (
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={props.value}
            alt=""
            className="h-28 w-28 shrink-0 rounded-[8px] border border-[#e1e3e5] object-cover"
          />
          <div className="flex flex-1 flex-col gap-2">
            <p className="break-all text-[12px] text-[#616161]">{props.value}</p>
            <button
              type="button"
              onClick={() => props.onChange("")}
              className="w-fit rounded-[8px] border border-[#babfc3] bg-white px-3 py-1.5 text-[12px] font-medium text-[#303030] hover:bg-[#f7f7f7]"
            >
              Remove
            </button>
          </div>
        </div>
      ) : null}

      {props.mode === "gallery" && props.value.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {props.value.map((url) => (
            <Thumb
              key={url}
              url={url}
              onRemove={() =>
                props.onChange(props.value.filter((u) => u !== url))
              }
            />
          ))}
        </div>
      ) : null}

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        aria-label={
          props.mode === "single"
            ? "Upload product image"
            : "Upload gallery images"
        }
        className={`flex cursor-pointer flex-col items-center justify-center rounded-[10px] border-2 border-dashed px-4 py-6 text-center transition-colors ${
          dragOver
            ? "border-[#142e2a] bg-[#f7f9f2]"
            : "border-[#cccccc] bg-white hover:border-[#142e2a]/60 hover:bg-[#fafafa]"
        }`}
      >
        <div className="mb-2 grid h-9 w-9 place-items-center rounded-full bg-[#142e2a]/8 text-[#142e2a]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 16V4M12 4l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-[13px] font-semibold text-[#1a1a1a]">
          {busy
            ? "Uploading…"
            : props.mode === "gallery"
              ? "Drop images here, or click to upload"
              : "Drop an image here, or click to upload"}
        </p>
        <p className="mt-1 text-[12px] text-[#616161]">
          PNG, JPG or WEBP — uploaded securely to your storage.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={props.mode === "gallery"}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void handleFiles(e.target.files);
          }}
        />
      </div>

      {err ? (
        <p className="rounded-[6px] bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {err}
        </p>
      ) : null}
    </div>
  );
}
