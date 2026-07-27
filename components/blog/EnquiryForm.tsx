"use client";

import { useState } from "react";

/**
 * Enquiry form shown under every blog article (per the joodlife.com
 * journal layout). Sends to /api/enquiry, which records the enquiry on the
 * patient's HubSpot contact — nothing is stored locally.
 */
export default function EnquiryForm({ source }: { source?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending" || state === "sent") return;
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website, source }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error ?? "Could not send — please try again.");
      setState("sent");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Could not send — please try again.");
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-2xl border border-[#142e2a]/10 bg-[#f7f9f2] p-8 text-center">
        <p className="font-display text-[20px] font-semibold text-[#142e2a]">
          Thank you — we&rsquo;ve received your enquiry ✅
        </p>
        <p className="mt-2 font-ui text-[14px] text-[#142e2a]/70">
          Our team will get back to you by email as soon as possible.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-[#142e2a]/10 bg-[#f7f9f2] p-6 md:p-8"
    >
      <h2 className="font-display text-[22px] font-semibold tracking-[-0.01em] text-[#142e2a] md:text-[26px]">
        Have a question? <em className="font-serif font-normal italic">Send an enquiry</em>
      </h2>
      <p className="mt-1.5 font-ui text-[13.5px] leading-[20px] text-[#142e2a]/70">
        Ask us anything about this article or our treatments — a member of the
        JoodLife team will reply by email.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-ui text-[13px] font-semibold text-[#142e2a]">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            className="h-12 rounded-lg border border-[#142e2a]/20 bg-white px-4 font-ui text-[14px] text-[#142e2a] outline-none transition-shadow focus:border-[#142e2a] focus:ring-2 focus:ring-[#142e2a]/25"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-ui text-[13px] font-semibold text-[#142e2a]">Email *</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="h-12 rounded-lg border border-[#142e2a]/20 bg-white px-4 font-ui text-[14px] text-[#142e2a] outline-none transition-shadow focus:border-[#142e2a] focus:ring-2 focus:ring-[#142e2a]/25"
          />
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-1.5">
        <span className="font-ui text-[13px] font-semibold text-[#142e2a]">Message *</span>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Write your question here…"
          className="rounded-lg border border-[#142e2a]/20 bg-white px-4 py-3 font-ui text-[14px] leading-[22px] text-[#142e2a] outline-none transition-shadow focus:border-[#142e2a] focus:ring-2 focus:ring-[#142e2a]/25"
        />
      </label>

      {/* Honeypot — hidden from real users, bots fill it and get dropped */}
      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
        placeholder="Website"
      />

      {error && (
        <p className="mt-3 font-ui text-[13px] font-medium text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="btn-cta mt-5 inline-flex h-12 items-center justify-center rounded-lg bg-[#142e2a] px-8 font-ui text-[14px] font-semibold text-white transition-colors hover:bg-[#0c2421] disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
