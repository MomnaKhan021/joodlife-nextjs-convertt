"use client";

import { useState } from "react";

/**
 * Passwordless sign-in / account creation: "Continue with Google" or a
 * one-time code emailed to the address entered. There is no password. Both
 * login and signup use this — the server finds-or-creates the account.
 */

const GOOGLE_ERRORS: Record<string, string> = {
  google_unavailable: "Google sign-in isn’t available right now.",
  google_declined: "Google sign-in was cancelled.",
  google_state: "That Google sign-in expired. Please try again.",
  google_token: "Couldn’t complete Google sign-in. Please try again.",
  google_no_email: "Google didn’t share an email address.",
  google_session: "Couldn’t sign you in. Please try again.",
};

export default function PasswordlessAuth({
  redirectTo,
  googleError,
}: {
  redirectTo: string;
  googleError?: string;
}) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(googleError ? GOOGLE_ERRORS[googleError] ?? "Couldn’t sign in with Google." : null);
  const [notice, setNotice] = useState<string | null>(null);

  const googleHref = `/api/auth/google/start?next=${encodeURIComponent(redirectTo)}`;

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setNotice(null);
    const clean = email.trim().toLowerCase();
    if (!clean.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Couldn’t send the code.");
      setStage("code");
      setNotice(`We’ve emailed a 6-digit code to ${clean}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    const clean = email.trim().toLowerCase();
    const digits = code.replace(/\s/g, "");
    if (!/^[0-9]{6}$/.test(digits)) {
      setError("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean, code: digits }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "That code isn’t right.");
      // Full navigation so the new session cookie is picked up everywhere.
      window.location.assign(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-[420px]">
      {/* Continue with Google */}
      <a
        href={googleHref}
        className="btn-cta flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-[#142e2a]/20 bg-white font-ui text-[15px] font-semibold text-[#142e2a] transition-colors hover:bg-[#f7f9f2]"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        Continue with Google
      </a>

      {/* divider */}
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#142e2a]/12" />
        <span className="font-ui text-[12px] uppercase tracking-[0.08em] text-[#142e2a]/45">or</span>
        <span className="h-px flex-1 bg-[#142e2a]/12" />
      </div>

      {stage === "email" ? (
        <form onSubmit={sendCode} className="flex flex-col gap-3" noValidate>
          <label className="flex flex-col gap-1.5">
            <span className="font-ui text-[13px] font-medium text-[#142e2a]">Email address</span>
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="h-12 rounded-lg border border-[#142e2a]/20 px-4 font-ui text-[15px] text-[#142e2a] outline-none focus:border-[#142e2a]"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="btn-cta inline-flex h-12 items-center justify-center rounded-lg bg-[#142e2a] font-ui text-[15px] font-semibold text-white hover:bg-[#0c2421] disabled:opacity-60"
          >
            {busy ? "Sending…" : "Email me a code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="flex flex-col gap-3" noValidate>
          <label className="flex flex-col gap-1.5">
            <span className="font-ui text-[13px] font-medium text-[#142e2a]">Enter the 6-digit code</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="••••••"
              className="h-12 rounded-lg border border-[#142e2a]/20 px-4 text-center font-ui text-[20px] tracking-[8px] text-[#142e2a] outline-none focus:border-[#142e2a]"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="btn-cta inline-flex h-12 items-center justify-center rounded-lg bg-[#142e2a] font-ui text-[15px] font-semibold text-white hover:bg-[#0c2421] disabled:opacity-60"
          >
            {busy ? "Verifying…" : "Verify & continue"}
          </button>
          <button
            type="button"
            onClick={() => { setStage("email"); setCode(""); setError(null); setNotice(null); }}
            className="font-ui text-[13px] text-[#142e2a]/70 underline underline-offset-2 hover:text-[#142e2a]"
          >
            Use a different email
          </button>
        </form>
      )}

      {notice ? <p className="mt-3 font-ui text-[13px] text-[#1a8c5a]">{notice}</p> : null}
      {error ? <p className="mt-3 font-ui text-[13px] text-[#c0392b]">{error}</p> : null}

      <p className="mt-5 font-ui text-[12px] leading-[18px] text-[#142e2a]/55">
        We’ll create your account automatically the first time you sign in. No password needed.
      </p>
    </div>
  );
}
