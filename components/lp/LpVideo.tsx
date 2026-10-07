"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { rawImage } from "./shared";

/**
 * A slide that is an image, a video, or both. With a video, the image is its
 * cover until someone presses play; without one the video's first frame is
 * the cover. A slide with only an image is just the image — no play button.
 *
 * One <video> element stays mounted, so pressing play calls play() straight
 * from the click (no reload, no autoplay rules in the way). Starting one
 * video pauses any other video on the page.
 */
export default function LpVideo({
  image,
  video,
  alt,
  sizes,
  className = "",
  children,
}: {
  image: string;
  video?: string;
  alt: string;
  sizes: string;
  className?: string;
  /** Overlays (badges, captions) drawn over the cover. */
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"idle" | "loading" | "playing" | "paused" | "error">("idle");

  // Only one video plays at a time: when this one starts, pause the rest.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onPlay = () => {
      document.querySelectorAll("video").forEach((v) => {
        if (v !== el && !v.paused) v.pause();
      });
      setState("playing");
    };
    const onWaiting = () => setState((s) => (s === "playing" || s === "loading" ? "loading" : s));
    const onPlaying = () => setState("playing");
    const onPause = () => setState((s) => (s === "error" ? s : "paused"));
    const onError = () => setState("error");
    el.addEventListener("play", onPlay);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("playing", onPlaying);
    el.addEventListener("pause", onPause);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("waiting", onWaiting);
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("error", onError);
    };
  }, [video]);

  function start() {
    const el = ref.current;
    if (!el) return;
    setState("loading");
    el.play().catch(() => setState((s) => (s === "loading" ? "error" : s)));
  }

  if (!video) {
    return (
      <div className={`relative overflow-hidden bg-[#e7ecd7] ${className}`}>
        {image ? (
          <Image src={image} alt={alt} fill sizes={sizes} unoptimized={rawImage(image)} className="object-cover" />
        ) : null}
        {children}
      </div>
    );
  }

  const started = state === "playing" || state === "paused" || state === "loading";
  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <video
        ref={ref}
        // With no cover image, "#t=0.1" makes the browser paint the first frame.
        src={image ? video : `${video}#t=0.1`}
        poster={image || undefined}
        controls={state === "playing" || state === "paused"}
        playsInline
        preload={image ? "none" : "metadata"}
        aria-label={alt}
        className="absolute inset-0 size-full object-cover"
      />

      {/* Cover image and overlays until the video has started */}
      {!started && image ? (
        <Image src={image} alt={alt} fill sizes={sizes} unoptimized={rawImage(image)} className="object-cover" />
      ) : null}
      {!started ? children : null}

      {state === "idle" || state === "error" ? (
        <button
          type="button"
          onClick={start}
          aria-label={`Play video${alt ? `: ${alt}` : ""}`}
          className="absolute left-1/2 top-1/2 flex size-[56px] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-md transition-transform hover:scale-105"
        >
          <span className="ml-[4px] block h-0 w-0 border-y-[10.4px] border-l-[17.6px] border-y-transparent border-l-[#132d2a]" />
        </button>
      ) : null}

      {state === "loading" ? (
        <span
          aria-label="Loading video"
          className="pointer-events-none absolute left-1/2 top-1/2 size-[44px] -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-[3px] border-white/40 border-t-white"
        />
      ) : null}

      {state === "error" ? (
        <span className="pointer-events-none absolute inset-x-3 bottom-3 rounded-lg bg-black/70 px-3 py-2 text-center font-ui text-[13px] text-white">
          This video can&apos;t play in this browser.
        </span>
      ) : null}
    </div>
  );
}
