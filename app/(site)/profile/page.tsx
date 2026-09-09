import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import {
  getOrdersForEmail,
  getConsultationsForEmail,
  type ConsultationSummary,
} from "@/lib/accountData";
import SignOutButton from "@/components/account/SignOutButton";
import OrderHistory from "@/components/account/OrderHistory";
import ProfileEditor from "@/components/account/ProfileEditor";
import { getPayloadInstance } from "@/lib/payload";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My account — JoodLife",
};

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function titleize(s: string | null) {
  if (!s) return "—";
  return s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function StatusBadge({ status }: { status: string | null }) {
  const s = (status ?? "").toLowerCase();
  const good = ["paid", "completed", "approved", "submitted", "delivered"].includes(s);
  const warn = ["pending", "awaiting", "draft", "processing", "reviewed"].includes(s);
  const tone = good
    ? "bg-[#1a8c5a]/12 text-[#1a8c5a]"
    : warn
      ? "bg-[#e8b53d]/18 text-[#8a6d12]"
      : "bg-[#142e2a]/8 text-[#142e2a]/70";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-ui text-[11px] font-semibold ${tone}`}>
      {titleize(status)}
    </span>
  );
}

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");

  const [orders, consultations] = await Promise.all([
    getOrdersForEmail(user.email),
    getConsultationsForEmail(user.email),
  ]);

  // The account's current phone + saved default delivery address, for the
  // editable "Your details" card. Best-effort — the page still renders if the
  // lookup fails, and the address column is created lazily by the save route.
  let acctPhone = "";
  let acctAddress = "";
  try {
    const payload = await getPayloadInstance();
    const drizzle = (payload.db as unknown as { drizzle?: { execute?: (q: unknown) => Promise<unknown> } }).drizzle;
    if (drizzle?.execute) {
      const { sql } = (await import("drizzle-orm")) as { sql: { raw: (s: string) => unknown } };
      await drizzle.execute(sql.raw(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS default_address text`));
      const idNum = Number(user.id);
      if (Number.isFinite(idNum)) {
        const res = await drizzle.execute(
          sql.raw(`SELECT phone, default_address FROM "users" WHERE id = ${idNum} LIMIT 1`),
        );
        const rows = Array.isArray(res)
          ? (res as Array<Record<string, unknown>>)
          : ((res as { rows?: Array<Record<string, unknown>> })?.rows ?? []);
        const row = rows[0] ?? {};
        acctPhone = String(row.phone ?? "").trim();
        acctAddress = String(row.default_address ?? "").trim();
      }
    }
  } catch {
    /* non-fatal — editor still opens with what we have */
  }

  const displayName = user.name ?? user.email.split("@")[0];
  const initial = displayName[0]?.toUpperCase() ?? "?";

  return (
    <div
      className="flex min-h-screen flex-col bg-[#f7f9f2]"
      data-page-bg="cream"
      style={{ background: "#f7f9f2" }}
    >
      {/* ──────────────  Header: centered Jood logo  ────────────── */}
      <header className="border-b border-[#142e2a]/10 bg-white">
        <div className="mx-auto flex h-[72px] w-full max-w-[1100px] items-center justify-center px-6">
          <Link href="/" aria-label="JoodLife home" className="flex items-center">
            <Image
              src="/assets/icons/logo-wesmount.svg"
              alt="JoodLife"
              width={120}
              height={32}
              priority
              className="h-7 w-auto"
            />
          </Link>
        </div>
      </header>

      {/* ──────────────  Main  ────────────── */}
      <main className="mx-auto w-full max-w-[1100px] flex-1 px-6 py-10 md:px-10 md:py-12">
        {/* Account summary card */}
        <section className="flex flex-col gap-4 rounded-2xl border border-[#142e2a]/10 bg-white p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#142e2a] font-display text-[20px] font-semibold text-white">
              {initial}
            </span>
            <div>
              <h1 className="font-display text-[24px] font-semibold tracking-[-0.01em] text-[#142e2a] md:text-[28px]">
                Hi, {displayName}
              </h1>
              <p className="font-ui text-[14px] text-[#142e2a]/70">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user.role === "admin" ? (
              <Link
                href="/admin"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#142e2a] px-5 font-ui text-[13px] font-semibold text-white transition-colors hover:bg-[#0c2421]"
              >
                Open CMS admin
              </Link>
            ) : null}
            <SignOutButton />
          </div>
        </section>

        {/* Stat row */}
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatCard label="Orders" value={String(orders.length)} />
          <StatCard label="Consultations" value={String(consultations.length)} />
          <Link
            href="/profile/weight-logs"
            className="group flex items-center justify-between rounded-2xl border border-[#142e2a]/10 bg-[#142e2a] p-4 text-white transition-colors hover:bg-[#0c2421]"
          >
            <span className="flex flex-col">
              <span className="font-ui text-[12px] font-medium uppercase tracking-[0.06em] text-white/60">
                Weight logs
              </span>
              <span className="font-ui text-[14px] font-semibold">Track progress →</span>
            </span>
          </Link>
        </div>

        {/* Editable account details */}
        <ProfileEditor
          initialName={user.name ?? ""}
          initialEmail={user.email}
          initialPhone={acctPhone}
          initialAddress={acctAddress}
        />

        {/* Orders */}
        <section className="mt-6 rounded-2xl border border-[#142e2a]/10 bg-white p-6 md:p-8">
          <h2 className="font-display text-[20px] font-semibold text-[#142e2a] md:text-[22px]">
            Your orders
          </h2>
          {orders.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-[#142e2a]/20 bg-[#f7f9f2] p-8 text-center">
              <p className="font-ui text-[14px] text-[#142e2a]/70">No orders yet.</p>
              <Link
                href="/shop"
                className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-[#142e2a] px-5 font-ui text-[12px] font-semibold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#0c2421]"
              >
                Browse shop
              </Link>
            </div>
          ) : (
            <OrderHistory orders={orders} />
          )}
        </section>

        {/* Consultations */}
        <section className="mt-6 rounded-2xl border border-[#142e2a]/10 bg-white p-6 md:p-8">
          <h2 className="font-display text-[20px] font-semibold text-[#142e2a] md:text-[22px]">
            Your consultations
          </h2>
          {consultations.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-[#142e2a]/20 bg-[#f7f9f2] p-8 text-center">
              <p className="font-ui text-[14px] text-[#142e2a]/70">
                No consultations yet.
              </p>
              <Link
                href="/consultation"
                className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-[#142e2a] px-5 font-ui text-[12px] font-semibold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#0c2421]"
              >
                Start a consultation
              </Link>
            </div>
          ) : (
            <ul className="mt-4 flex flex-col divide-y divide-[#142e2a]/8">
              {consultations.map((c: ConsultationSummary) => (
                <li key={c.id} className="flex items-center justify-between gap-4 py-3.5">
                  <div className="flex flex-col">
                    <span className="font-ui text-[14px] font-semibold text-[#142e2a]">
                      {c.productSlug ? titleize(c.productSlug) : "Consultation"}
                      {c.dose ? ` · ${c.dose}` : ""}
                    </span>
                    <span className="font-ui text-[12px] text-[#142e2a]/60">
                      {fmtDate(c.date)}
                    </span>
                  </div>
                  <StatusBadge status={c.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* ──────────────  Footer: copyright  ────────────── */}
      <footer className="border-t border-[#142e2a]/10 bg-white">
        <div className="mx-auto w-full max-w-[1100px] px-6 py-6 text-center">
          <p className="font-ui text-[12px] text-[#142e2a]/55">
            © {new Date().getFullYear()} Jood. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#142e2a]/10 bg-white p-4">
      <p className="font-ui text-[12px] font-medium uppercase tracking-[0.06em] text-[#142e2a]/55">
        {label}
      </p>
      <p className="mt-1 font-display text-[26px] font-semibold text-[#142e2a]">
        {value}
      </p>
    </div>
  );
}
