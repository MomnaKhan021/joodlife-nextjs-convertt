"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Account-page error boundary. Without it, a render crash on /profile (server
 * or client) falls through to a blank/black screen with no recovery — which is
 * exactly the "page crashed, screen went black" report. This catches the error
 * and shows a styled retry instead, and `reset()` re-renders the route.
 */
export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[profile] render error", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f7f9f2] px-6 text-center">
      <p className="font-ui text-[12px] font-semibold uppercase tracking-[0.08em] text-[#142e2a]/55">
        Something went wrong
      </p>
      <h1 className="mt-3 font-display text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#142e2a] md:text-[36px]">
        We couldn&apos;t load your account.
      </h1>
      <p className="mt-4 max-w-[480px] font-ui text-[15px] leading-[1.6] text-[#142e2a]/70">
        The page hit an unexpected error. Try again — if it keeps happening,
        sign out and back in.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center rounded-full bg-[#142e2a] px-6 py-3 font-ui text-[14px] font-semibold text-white transition hover:bg-[#0c2421]"
        >
          Try again
        </button>
        <Link
          href="/login"
          className="inline-flex items-center rounded-full border border-[#142e2a]/20 px-6 py-3 font-ui text-[14px] font-semibold text-[#142e2a] transition hover:border-[#142e2a]/40"
        >
          Sign in again
        </Link>
      </div>
      {error.digest ? (
        <p className="mt-8 font-mono text-[11px] text-[#142e2a]/40">
          Error reference: {error.digest}
        </p>
      ) : null}
    </main>
  );
}
