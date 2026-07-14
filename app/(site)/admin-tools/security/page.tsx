"use client";

import { useEffect, useState } from "react";

type Status = { enabled: boolean; pending: boolean };

export default function SecurityPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [otpauth, setOtpauth] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin-tools/2fa", { credentials: "include", cache: "no-store" });
    const j = await res.json();
    if (j.ok) setStatus({ enabled: j.enabled, pending: j.pending });
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, []);

  async function post(action: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-tools/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, token: code.trim() }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j?.error ?? "Failed");
      return j;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function startSetup() {
    const j = await post("setup");
    if (j) {
      setSecret(j.secret);
      setOtpauth(j.otpauth);
      setCode("");
    }
  }
  async function enable() {
    const j = await post("enable");
    if (j) {
      setSecret(null);
      setOtpauth(null);
      setCode("");
      setToast("Two-factor authentication is now on.");
      await refresh();
    }
  }
  async function disable() {
    const j = await post("disable");
    if (j) {
      setCode("");
      setToast("Two-factor authentication turned off.");
      await refresh();
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f9f2] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-[640px]">
        <h1 className="text-[22px] font-bold tracking-tight text-[#0c2421]">Security</h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Protect your admin account with an authenticator-app code (Google
          Authenticator, 1Password, Authy…).
        </p>

        {toast ? (
          <div className="mt-4 rounded-[10px] border border-[#cdd8bf] bg-[#eef3e6] px-4 py-2.5 text-[13px] text-[#142e2a]">
            {toast}
          </div>
        ) : null}

        <section className="mt-5 rounded-[16px] border border-[#e6e8e3] bg-white p-6 shadow-[0_10px_30px_-20px_rgba(20,46,42,0.25)]">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-[#142e2a]">
              Two-factor authentication
            </h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
                status?.enabled ? "bg-[#cdfee1] text-[#0c5132]" : "bg-[#e3e3e3] text-[#616161]"
              }`}
            >
              {status?.enabled ? "On" : "Off"}
            </span>
          </div>

          {status && !status.enabled ? (
            <div className="mt-4">
              {!secret ? (
                <button
                  type="button"
                  onClick={startSetup}
                  disabled={busy}
                  className="h-10 rounded-[10px] bg-[#142e2a] px-4 text-[13px] font-semibold text-white hover:bg-[#0c2421] disabled:opacity-50"
                >
                  {busy ? "Please wait…" : "Set up two-factor auth"}
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-[13px] text-[#303030]">
                    1. In your authenticator app, add an account and enter this key:
                  </p>
                  <code className="select-all rounded-[8px] bg-[#f7f9f2] px-3 py-2 text-center text-[16px] font-semibold tracking-[0.15em] text-[#142e2a]">
                    {secret}
                  </code>
                  {otpauth ? (
                    <a
                      href={otpauth}
                      className="text-[12px] font-medium text-[#142e2a] underline hover:no-underline"
                    >
                      Or tap here on the device with your authenticator app
                    </a>
                  ) : null}
                  <p className="text-[13px] text-[#303030]">
                    2. Enter the 6-digit code it shows to finish:
                  </p>
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="w-[160px] rounded-[10px] border border-[#d3dabe] px-4 py-2.5 text-center text-[18px] font-semibold tracking-[0.25em] text-[#142e2a] outline-none focus:border-[#142e2a]"
                  />
                  <button
                    type="button"
                    onClick={enable}
                    disabled={busy || code.length < 6}
                    className="h-10 w-fit rounded-[10px] bg-[#142e2a] px-4 text-[13px] font-semibold text-white hover:bg-[#0c2421] disabled:opacity-50"
                  >
                    {busy ? "Verifying…" : "Turn on 2FA"}
                  </button>
                </div>
              )}
            </div>
          ) : status?.enabled ? (
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-[13px] text-[#303030]">
                2FA is protecting your account. To turn it off, enter a current code:
              </p>
              <input
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-[160px] rounded-[10px] border border-[#d3dabe] px-4 py-2.5 text-center text-[18px] font-semibold tracking-[0.25em] text-[#142e2a] outline-none focus:border-[#142e2a]"
              />
              <button
                type="button"
                onClick={disable}
                disabled={busy || code.length < 6}
                className="h-10 w-fit rounded-[10px] border border-[#b42318]/40 bg-white px-4 text-[13px] font-semibold text-[#b42318] hover:bg-[#fff1f0] disabled:opacity-50"
              >
                {busy ? "Please wait…" : "Turn off 2FA"}
              </button>
            </div>
          ) : (
            <p className="mt-4 text-[13px] text-[#8a8a8a]">Loading…</p>
          )}

          {error ? <p className="mt-3 text-[13px] text-[#b42318]">{error}</p> : null}
        </section>
      </div>
    </main>
  );
}
