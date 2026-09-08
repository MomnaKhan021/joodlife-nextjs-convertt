"use client";

import { useState } from "react";

type Props = {
  initialName: string;
  initialEmail: string;
  initialPhone: string;
  initialAddress: string;
};

/**
 * Lets a signed-in customer edit their own account: name, email (their login),
 * phone and a default delivery address. Saving posts to /api/profile/update.
 * The address is used to prefill future checkouts and never changes an order
 * that has already been placed.
 */
export default function ProfileEditor({
  initialName,
  initialEmail,
  initialPhone,
  initialAddress,
}: Props) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [address, setAddress] = useState(initialAddress);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const dirty =
    name !== initialName ||
    email !== initialEmail ||
    phone !== initialPhone ||
    address !== initialAddress;

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, phone, address }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j?.error ?? "Could not save changes.");
      setMsg({ kind: "ok", text: "Saved." });
      // Reflect any server normalisation (e.g. phone to 07…).
      if (typeof j.phone === "string") setPhone(j.phone);
      if (typeof j.email === "string") setEmail(j.email);
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Could not save changes." });
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-1 w-full rounded-lg border border-[#142e2a]/15 bg-white px-3.5 py-2.5 font-ui text-[14px] text-[#142e2a] outline-none focus:border-[#142e2a]";
  const label = "font-ui text-[12px] font-semibold uppercase tracking-[0.04em] text-[#142e2a]/60";

  return (
    <section className="mt-6 rounded-2xl border border-[#142e2a]/10 bg-white p-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-[20px] font-semibold text-[#142e2a] md:text-[22px]">
          Your details
        </h2>
        <button
          type="button"
          onClick={() => { setOpen((v) => !v); setMsg(null); }}
          className="inline-flex h-9 items-center rounded-lg border border-[#142e2a]/20 px-4 font-ui text-[13px] font-semibold text-[#142e2a] transition-colors hover:bg-[#f7f9f2]"
        >
          {open ? "Close" : "Edit"}
        </button>
      </div>

      {!open ? (
        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><dt className={label}>Name</dt><dd className="mt-0.5 font-ui text-[14px] text-[#142e2a]">{initialName || "—"}</dd></div>
          <div><dt className={label}>Email</dt><dd className="mt-0.5 break-all font-ui text-[14px] text-[#142e2a]">{initialEmail || "—"}</dd></div>
          <div><dt className={label}>Phone</dt><dd className="mt-0.5 font-ui text-[14px] text-[#142e2a]">{initialPhone || "—"}</dd></div>
          <div><dt className={label}>Delivery address</dt><dd className="mt-0.5 whitespace-pre-line font-ui text-[14px] text-[#142e2a]">{initialAddress || "—"}</dd></div>
        </dl>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={label}>Name</span>
              <input className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </label>
            <label className="block">
              <span className={label}>Email</span>
              <input className={field} value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" inputMode="email" />
            </label>
            <label className="block">
              <span className={label}>Phone</span>
              <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" autoComplete="tel" inputMode="tel" placeholder="07…" />
            </label>
          </div>
          <label className="block">
            <span className={label}>Delivery address</span>
            <textarea
              className={`${field} min-h-[92px] resize-y`}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={"House/flat number and street\nTown/city\nPostcode"}
              autoComplete="shipping street-address"
            />
            <span className="mt-1 block font-ui text-[12px] text-[#142e2a]/55">
              Used to fill in your details next time you order. It won&apos;t change an order you&apos;ve already placed.
            </span>
          </label>

          {msg ? (
            <p className={`font-ui text-[13px] ${msg.kind === "ok" ? "text-[#1a8c5a]" : "text-[#b91c1c]"}`}>
              {msg.text}
            </p>
          ) : null}

          <div>
            <button
              type="button"
              onClick={save}
              disabled={busy || !dirty || !email.trim()}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#142e2a] px-6 font-ui text-[13px] font-semibold text-white transition-colors hover:bg-[#0c2421] disabled:opacity-40"
            >
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
