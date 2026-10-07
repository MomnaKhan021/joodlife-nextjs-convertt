"use client";

import Image from "next/image";
import { useState } from "react";

import { rawImage } from "./shared";

/**
 * A slide that is an image, a video, or both. With a video, the image is its
 * cover: it shows until someone presses play. A slide with only a video shows
 * the video's first frame instead. A slide with only an image is just the
 * image — no play button, so the page never shows a control that does nothing.
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
  const [playing, setPlaying] = useState(false);

  if (video && (playing || !image)) {
    return (
      <div className={`relative overflow-hidden bg-black ${className}`}>
        <video
          src={playing ? video : `${video}#t=0.1`}
          poster={image || undefined}
          controls={playing}
          autoPlay={playing}
          playsInline
          preload="metadata"
          aria-label={alt}
          className="absolute inset-0 size-full object-cover"
        />
        {playing ? null : (
          <>
            {children}
            <PlayButton alt={alt} onClick={() => setPlaying(true)} />
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[#e7ecd7] ${className}`}>
      {image ? (
        <Image src={image} alt={alt} fill sizes={sizes} unoptimized={rawImage(image)} className="object-cover" />
      ) : null}
      {children}
      {video ? <PlayButton alt={alt} onClick={() => setPlaying(true)} /> : null}
    </div>
  );
}

function PlayButton({ alt, onClick }: { alt: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Play video${alt ? `: ${alt}` : ""}`}
      className="absolute left-1/2 top-1/2 flex size-[56px] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-md transition-transform hover:scale-105"
    >
      <span className="ml-[4px] block h-0 w-0 border-y-[10.4px] border-l-[17.6px] border-y-transparent border-l-[#132d2a]" />
    </button>
  );
}
