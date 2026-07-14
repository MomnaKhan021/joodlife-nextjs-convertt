"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function Verify2faPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Only allow internal paths (must start with a single slash) to avoid an
  // open-redirect; default to the dashboard.
  const rawNext = searchParams.get("next") ?? "";
  const next = /^\/[^/]/.test(rawNext) ? rawNext : "/admin-tools";
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailing, setEmailing] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function emailCode() {
    if (emailing) return;
    setEmailing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-tools/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "email-otp" }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j?.error ?? "Could not send email");
      setEmailSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setEmailing(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || code.trim().length < 6) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-tools/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "verify", token: code.trim() }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j?.error ?? "Verification failed");
      router.replace(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f9f2] px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-[380px] rounded-[16px] border border-[#e6e8e3] bg-white p-6 shadow-[0_10px_30px_-20px_rgba(20,46,42,0.25)]"
      >
        <h1 className="text-[20px] font-bold text-[#0c2421]">Two-factor verification</h1>
        <p className="mt-1.5 text-[13px] text-[#616161]">
          {emailSent
            ? "Enter the 6-digit code we just emailed you."
            : "Enter the 6-digit code from your authenticator app — or email yourself one instead."}
        </p>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          className="mt-4 w-full rounded-[10px] border border-[#d3dabe] bg-white px-4 py-3 text-center text-[22px] font-semibold tracking-[0.3em] text-[#142e2a] outline-none focus:border-[#142e2a]"
        />
        {error ? <p className="mt-2 text-[13px] text-[#b42318]">{error}</p> : null}
        <button
          type="submit"
          disabled={busy || code.length < 6}
          className="mt-4 h-11 w-full rounded-[10px] bg-[#142e2a] text-[14px] font-semibold text-white transition-colors hover:bg-[#0c2421] disabled:opacity-50"
        >
          {busy ? "Verifying…" : "Verify"}
        </button>
        <button
          type="button"
          onClick={emailCode}
          disabled={emailing}
          className="mt-3 w-full text-center text-[13px] font-medium text-[#142e2a] underline hover:no-underline disabled:opacity-50"
        >
          {emailing
            ? "Sending…"
            : emailSent
              ? "Resend email code"
              : "Email me a code instead"}
        </button>
      </form>
    </main>
  );
}
