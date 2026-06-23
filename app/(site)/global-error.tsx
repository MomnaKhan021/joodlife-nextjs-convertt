"use client";

import { useEffect } from "react";

/**
 * Global error boundary for the marketing site's root layout. This is the
 * last line of defence: if the root layout or a provider (e.g. the cart
 * context) throws during render/hydration, Next would otherwise show a blank
 * black screen. global-error replaces that with a styled, recoverable screen.
 *
 * It must render its own <html>/<body> because it REPLACES the root layout
 * when the root layout itself is what crashed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f9f2",
          color: "#142e2a",
          fontFamily:
            "-apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: "0 0 12px" }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: 15, opacity: 0.7, maxWidth: 460, margin: "0 0 24px" }}>
          The page hit an unexpected error. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            background: "#142e2a",
            color: "#fff",
            border: "none",
            borderRadius: 9999,
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        {error.digest ? (
          <p style={{ fontFamily: "monospace", fontSize: 11, opacity: 0.4, marginTop: 24 }}>
            Error reference: {error.digest}
          </p>
        ) : null}
      </body>
    </html>
  );
}
