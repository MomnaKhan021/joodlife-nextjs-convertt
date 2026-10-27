"use client";

import Link from "next/link";
import { useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";

import { LOGO } from "@/components/portal/logo";
import "@/components/portal/portal.css";

/**
 * Login, in the portal's v4 design: email and password, then (for patients
 * with two-step verification on) a 6-digit code we email them. Both steps go
 * through /api/portal/login, which sets the session cookie at the end.
 */

const ICON: Record<string, string> = {
  truck: "M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0",
  chat: "M4 5h16v11H9l-5 4z",
  lock: "M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4",
  mail: "M3 5h18v14H3zM3 7l9 6 9-6",
};

function Ic({ n, size = 20 }: { n: keyof typeof ICON; size?: number }) {
  return (
    <svg className="ic" width={size} height={size} style={{ width: size, height: size }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICON[n]} />
    </svg>
  );
}

function Logo() {
  return <span style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: LOGO }} />;
}

export default function PortalLogin({ redirectTo, link }: { redirectTo: string; link?: string }) {
  const [step, setStep] = useState<"pw" | "code" | "link">(link ? "link" : "pw");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(true);
  const [note, setNote] = useState("");
  const boxes = useRef<Array<HTMLInputElement | null>>([]);

  async function call(code?: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, code, remember }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "We couldn't log you in. Please try again.");
      if (data.step === "code") {
        if (code === undefined && step === "code") setNote(data.sent ? "We've emailed you a new code." : "We sent a code less than a minute ago. Check your inbox and spam folder.");
        setSentTo(data.to || email);
        setStep("code");
        setDigits(["", "", "", "", "", ""]);
        setTimeout(() => boxes.current[0]?.focus(), 50);
        return;
      }
      // Full navigation so the header and every server component see the new session.
      window.location.assign(redirectTo);
    } catch (err) {
      setError((err as Error).message);
      if (code) {
        setDigits(["", "", "", "", "", ""]);
        setTimeout(() => boxes.current[0]?.focus(), 50);
      }
    } finally {
      setBusy(false);
    }
  }

  /** "Email me a login link": same reply whether or not the account exists. */
  async function emailLink() {
    const em = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(em)) return setError("Enter your email address first, then tap “Email me a login link”");
    setBusy(true);
    setError("");
    setNote("");
    try {
      const res = await fetch("/api/portal/magic", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ email: em }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "We couldn't send a link. Please try again.");
      setNote(data.message || "Check your email for a login link.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  /** Opened from the emailed link: one tap to finish (links are single use). */
  async function finishLink() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/portal/magic/verify", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ token: link }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "We couldn't log you in. Please try again.");
      window.location.assign(data.next || redirectTo);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  function submitPassword(e: FormEvent) {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(em)) return setError("Enter the email address you used with Jood");
    if (password.length < 6) return setError("Your password is at least 6 characters");
    setEmail(em);
    void call();
  }

  function setDigit(i: number, v: string) {
    const typed = v.replace(/\D/g, "");
    const next = digits.slice();
    if (typed.length > 1) {
      // Phone autofill (and some keyboards) put the whole code into one box.
      typed.slice(0, 6 - i).split("").forEach((c, k) => (next[i + k] = c));
    } else {
      next[i] = typed;
    }
    setDigits(next);
    const firstEmpty = next.findIndex((x) => !x);
    if (typed && firstEmpty >= 0) boxes.current[firstEmpty]?.focus();
    if (next.every(Boolean)) void call(next.join(""));
  }

  function onKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) boxes.current[i - 1]?.focus();
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const t = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (t.length !== 6) return;
    e.preventDefault();
    setDigits(t.split(""));
    void call(t);
  }

  function verify() {
    const code = digits.join("");
    if (code.length < 6) return setError("Enter all 6 digits");
    void call(code);
  }

  function resend() {
    setNote("");
    void call();
  }

  return (
    <div className="jp" data-svc="wl">
      <div className="login">
        <div className="login-art">
          <div className="logo-wrap"><Logo /></div>
          <div>
            <h2>
              Your treatment, <em className="serif">all in one place.</em>
            </h2>
            <ul>
              <li><Ic n="truck" />Track every order from clinical check to your door</li>
              <li><Ic n="bell" />Reminders on your iPhone or Android</li>
              <li><Ic n="chat" />Message your UK prescriber any time</li>
            </ul>
          </div>
          <div className="trust" style={{ color: "rgba(255,255,255,.7)" }}>
            <span><span className="stars">★★★★★</span> 4.4/5 on Trustpilot</span>
            <span>GPhC 9012990</span>
          </div>
        </div>

        <div className="login-main">
          <Logo />
          {step === "pw" ? (
            <form onSubmit={submitPassword} noValidate>
              <h1 style={{ marginBottom: 6 }}>
                Log in to <em className="serif">your portal</em>
              </h1>
              <p className="muted" style={{ marginBottom: 22 }}>
                Track orders, log doses and talk to your prescriber.
              </p>
              <div className="stack">
                <div className="field">
                  <label htmlFor="lgE">Email</label>
                  <input className="input" id="lgE" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="lgP">Password</label>
                  <input className="input" id="lgP" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                {error ? <p className="err" role="alert">{error}</p> : null}
                <label className="row small" style={{ gap: 8 }}>
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Keep me logged in on this device
                </label>
                <button className="btn brand block" type="submit" disabled={busy}>
                  {busy ? "Checking…" : "Log in"}
                </button>
                <button className="btn ghost block" type="button" onClick={emailLink} disabled={busy}>
                  <Ic n="mail" size={18} />Email me a login link
                </button>
                {note ? <p className="ok" role="status">{note}</p> : null}
                <div className="row between">
                  <Link className="btn link" href="/forgot">Forgot password?</Link>
                  <Link className="btn link" href="/consultation">New to Jood? Start here</Link>
                </div>
              </div>
            </form>
          ) : step === "link" ? (
            <div>
              <h1 style={{ marginBottom: 6 }}>
                Finish <em className="serif">logging in</em>
              </h1>
              <p className="muted" style={{ marginBottom: 20 }}>
                You opened a login link from your email. Tap below to go to your portal.
              </p>
              {error ? <p className="err" role="alert" style={{ marginBottom: 12 }}>{error}</p> : null}
              <button className="btn brand block" type="button" onClick={finishLink} disabled={busy}>
                {busy ? "Logging you in…" : "Finish logging in"}
              </button>
              <div className="row between" style={{ marginTop: 14 }}>
                <button className="btn link" type="button" onClick={() => { setStep("pw"); setError(""); window.history.replaceState(null, "", "/new_profile/login"); }}>
                  Log in with your password instead
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h1 style={{ marginBottom: 6 }}>Check your email</h1>
              <p className="muted" style={{ marginBottom: 20 }}>
                We&rsquo;ve emailed a 6-digit code to {sentTo}. It expires in 10 minutes.
              </p>
              <div className="otp">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      boxes.current[i] = el;
                    }}
                    className="input"
                    inputMode="numeric"
                    aria-label={`Digit ${i + 1}`}
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    value={d}
                    disabled={busy}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => onKey(i, e)}
                    onPaste={onPaste}
                  />
                ))}
              </div>
              {error ? <p className="err" role="alert" style={{ marginTop: 10 }}>{error}</p> : null}
              {note && !error ? <p className="ok" role="status" style={{ marginTop: 10 }}>{note}</p> : null}
              <button className="btn brand block" style={{ marginTop: 18 }} onClick={verify} disabled={busy}>
                {busy ? "Checking…" : "Verify and continue"}
              </button>
              <div className="row between" style={{ marginTop: 14 }}>
                <button className="btn link" type="button" onClick={() => { setStep("pw"); setError(""); setPassword(""); }}>
                  Use a different account
                </button>
                <button className="btn link" type="button" onClick={resend} disabled={busy}>
                  Resend code
                </button>
              </div>
            </div>
          )}
          <div className="trust" style={{ marginTop: 28 }}>
            <span><Ic n="lock" size={15} />Secured with two-step verification. Jood Pharmacy, GPhC 9012990.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
