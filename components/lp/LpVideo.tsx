"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { rawImage } from "./shared";

/**
 * A slide that is an image, a video, or both. With a video, the image is its
 * cover until someone plays it; without one the video's first frame is the
 * cover. A slide with only an image is just the image — no play button.
 *
 * The whole video is the control: tap anywhere to play, tap again to pause
 * (the play icon shows whenever it's paused). One <video> stays mounted, so
 * play() runs straight from the tap. Starting one video pauses any other.
 */
export default function LpVideo({
  image,
  video,
  alt,
  sizes,
  className = "",
  children,
  videoRef,
  onTime,
  focus = "object-center",
}: {
  image: string;
  video?: string;
  alt: string;
  sizes: string;
  className?: string;
  /** Overlays (badges, captions) drawn over the cover. */
  children?: React.ReactNode;
  /** Lets a parent seek/play this video (the Journey steps' chapters). */
  videoRef?: React.MutableRefObject<HTMLVideoElement | null>;
  /** Playback position, for highlighting the step being explained. */
  onTime?: (seconds: number) => void;
  /** Where the crop centres (object-position class), e.g. "object-[50%_20%]". */
  focus?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef) videoRef.current = ref.current;
  });
  const [state, setState] = useState<"idle" | "loading" | "playing" | "paused" | "error">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Only one video plays at a time: when this one starts, pause the rest.
    const onPlay = () => {
      document.querySelectorAll("video").forEach((v) => {
        if (v !== el && !v.paused) v.pause();
      });
    };
    const onWaiting = () => setState((s) => (s === "playing" || s === "loading" ? "loading" : s));
    const onPlaying = () => setState("playing");
    const onPause = () => setState((s) => (s === "error" ? s : "paused"));
    const onEnded = () => setState("paused");
    const onError = () => setState("error");
    const onTimeUpdate = () => onTime?.(el.currentTime);
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("play", onPlay);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("playing", onPlaying);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("waiting", onWaiting);
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("error", onError);
    };
  }, [video, onTime]);

  function toggle() {
    const el = ref.current;
    if (!el) return;
    if (!el.paused && !el.ended) {
      el.pause();
      return;
    }
    setState("loading");
    el.play().catch((e: unknown) => {
      // A pause() before playback began isn't a failure.
      if (e instanceof DOMException && e.name === "AbortError") return;
      setState("error");
    });
  }

  if (!video) {
    return (
      <div className={`relative overflow-hidden bg-[#e7ecd7] ${className}`}>
        {image ? (
          <Image src={image} alt={alt} fill sizes={sizes} unoptimized={rawImage(image)} className={`object-cover ${focus}`} />
        ) : null}
        {children}
      </div>
    );
  }

  const started = state !== "idle";
  const showPlay = state === "idle" || state === "paused" || state === "error";
  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <video
        ref={ref}
        // With no cover image, "#t=0.1" makes the browser paint the first frame.
        src={image ? video : `${video}#t=0.1`}
        poster={image || undefined}
        playsInline
        preload={image ? "none" : "metadata"}
        aria-label={alt}
        className={`absolute inset-0 size-full object-cover ${focus}`}
      />

      {/* Cover image and overlays until the video has been started */}
      {!started && image ? (
        <Image src={image} alt="" fill sizes={sizes} unoptimized={rawImage(image)} className={`object-cover ${focus}`} />
      ) : null}
      {!started ? children : null}

      {/* The whole slide is the play / pause control */}
      <button
        type="button"
        onClick={toggle}
        aria-label={`${state === "playing" || state === "loading" ? "Pause" : "Play"} video${alt ? `: ${alt}` : ""}`}
        className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center"
      >
        {showPlay ? (
          <span className="flex size-[56px] items-center justify-center rounded-full bg-white/90 shadow-md transition-transform hover:scale-105">
            <span className="ml-[4px] block h-0 w-0 border-y-[10.4px] border-l-[17.6px] border-y-transparent border-l-[#132d2a]" />
          </span>
        ) : null}
        {state === "loading" ? (
          <span className="size-[44px] animate-spin rounded-full border-[3px] border-white/40 border-t-white" />
        ) : null}
      </button>

      {state === "error" ? (
        <span className="pointer-events-none absolute inset-x-3 bottom-3 z-20 rounded-lg bg-black/70 px-3 py-2 text-center font-ui text-[13px] text-white">
          This video can&apos;t play right now — please try again.
        </span>
      ) : null}
    </div>
  );
}
