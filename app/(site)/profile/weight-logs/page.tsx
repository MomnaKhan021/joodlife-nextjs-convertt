import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { getCombinedWeightLogs } from "@/lib/weightLogs";
import WeightChart from "@/components/account/WeightChart";
import WeightLogForm from "@/components/account/WeightLogForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Weight logs — JoodLife",
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

export default async function WeightLogsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile/weight-logs");

  const data = await getCombinedWeightLogs(user.email);
  const { entries, startWeightKg, latestWeightKg, changeKg, latestBmi, latestChange } =
    data;
  const displayName = user.name ?? user.email.split("@")[0];
  // newest first for the list
  const listEntries = [...entries].reverse();
  const latestEntry = entries.length ? entries[entries.length - 1] : null;

  const changeTone =
    latestChange?.direction === "lost"
      ? "good"
      : latestChange?.direction === "gained"
        ? "warn"
        : "neutral";

  return (
    <main className="mx-auto w-full max-w-[1100px] px-6 py-10 md:px-[60px] md:py-14">
      {/* User name header */}
      <div className="flex flex-col gap-4 border-b border-[#142e2a]/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#142e2a] font-display text-[18px] font-semibold text-white">
            {displayName[0]?.toUpperCase() ?? "?"}
          </span>
          <div>
            <h1 className="font-display text-[26px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[32px]">
              {displayName}
            </h1>
            <p className="font-ui text-[13px] text-[#142e2a]/70">{user.email}</p>
          </div>
        </div>
        <Link
          href="/profile"
          className="inline-flex h-10 w-fit items-center justify-center rounded-lg border border-[#142e2a]/20 bg-white px-4 font-ui text-[13px] font-semibold text-[#142e2a] transition-colors hover:bg-[#142e2a] hover:text-white"
        >
          ← Back to account
        </Link>
      </div>

      <h2 className="mt-8 font-display text-[22px] font-semibold text-[#142e2a] md:text-[26px]">
        Your weight logs
      </h2>
      <p className="mt-1 max-w-[640px] font-ui text-[14px] text-[#142e2a]/70">
        Log your weight any time to track your progress. Entries you record here
        are combined with weights captured in your consultations, so you get one
        complete trend over time.
      </p>

      {/* Log-weight form — always available */}
      <div className="mt-6">
        <WeightLogForm />
      </div>

      {entries.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#142e2a]/20 bg-[#f7f9f2] p-10 text-center">
          <p className="font-ui text-[15px] font-semibold text-[#142e2a]">
            No weight logs yet
          </p>
          <p className="mx-auto mt-1 max-w-[460px] font-ui text-[14px] text-[#142e2a]/70">
            Add your current weight above to start tracking. You can also
            complete a consultation and any weight you record there will show up
            here too.
          </p>
          <Link
            href="/consultation"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-lg border border-[#142e2a]/20 bg-white px-6 font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-[#142e2a] transition-colors hover:bg-[#142e2a] hover:text-white"
          >
            Start a consultation
          </Link>
        </div>
      ) : (
        <>
          {/* Latest weight + prominent change indicator */}
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#142e2a]/10 bg-[#142e2a] p-6 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-ui text-[12px] font-medium uppercase tracking-[0.06em] text-white/60">
                Latest weight
              </p>
              <p className="mt-1 font-display text-[40px] font-semibold leading-none">
                {latestWeightKg} <span className="text-[20px] font-medium">kg</span>
              </p>
              {latestEntry ? (
                <p className="mt-1 font-ui text-[12px] text-white/55">
                  Recorded {fmtDate(latestEntry.date)}
                  {latestEntry.bmi !== null ? ` · BMI ${latestEntry.bmi}` : ""}
                </p>
              ) : null}
            </div>
            <div className="sm:text-right">
              <p className="font-ui text-[12px] font-medium uppercase tracking-[0.06em] text-white/60">
                Since last entry
              </p>
              <span
                className={`mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-ui text-[15px] font-semibold ${
                  changeTone === "good"
                    ? "bg-[#1a8c5a] text-white"
                    : changeTone === "warn"
                      ? "bg-[#e8b53d] text-[#142e2a]"
                      : "bg-white/15 text-white"
                }`}
              >
                {latestChange
                  ? latestChange.label
                  : "First entry — keep logging"}
              </span>
            </div>
          </div>

          {/* Summary cards */}
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <SummaryCard label="Starting weight" value={startWeightKg} unit="kg" />
            <SummaryCard label="Latest weight" value={latestWeightKg} unit="kg" />
            <SummaryCard
              label="Total change"
              value={changeKg}
              unit="kg"
              signed
              tone={changeKg !== null && changeKg < 0 ? "good" : "neutral"}
            />
            <SummaryCard label="Latest BMI" value={latestBmi} unit="" />
          </div>

          {/* Graph */}
          <div className="mt-6 rounded-2xl border border-[#142e2a]/10 bg-white p-5 md:p-6">
            <h3 className="font-ui text-[14px] font-semibold text-[#142e2a]">
              Weight over time
            </h3>
            <div className="mt-4">
              <WeightChart entries={entries} />
            </div>
          </div>

          {/* Entries with dates */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-[#142e2a]/10 bg-white">
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-[#142e2a]/10 bg-[#f7f9f2] px-5 py-3 font-ui text-[12px] font-semibold uppercase tracking-[0.04em] text-[#142e2a]/60">
              <span>Date</span>
              <span className="text-right">Weight</span>
              <span className="text-right">Change</span>
            </div>
            <ul>
              {listEntries.map((e, i) => {
                // chronological index of this entry in the ascending list
                const chronoIdx = entries.length - 1 - i;
                const prev = chronoIdx > 0 ? entries[chronoIdx - 1] : null;
                const delta =
                  prev && prev.weightKg !== null && e.weightKg !== null
                    ? Math.round((e.weightKg - prev.weightKg) * 10) / 10
                    : null;
                return (
                  <li
                    key={`${e.source ?? "x"}-${e.id}-${chronoIdx}`}
                    className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3.5 font-ui text-[14px] ${
                      i % 2 ? "bg-[#f7f9f2]/40" : ""
                    }`}
                  >
                    <span className="flex flex-col">
                      <span className="font-medium text-[#142e2a]">
                        {fmtDate(e.date)}
                      </span>
                      <span className="text-[12px] text-[#142e2a]/55">
                        {e.source === "log" ? "Logged" : "Consultation"}
                        {e.bmi !== null ? ` · BMI ${e.bmi}` : ""}
                      </span>
                    </span>
                    <span className="text-right font-semibold text-[#142e2a]">
                      {e.weightKg} kg
                    </span>
                    <span
                      className={`text-right text-[13px] font-medium ${
                        delta === null
                          ? "text-[#142e2a]/40"
                          : delta < 0
                            ? "text-[#1a8c5a]"
                            : delta > 0
                              ? "text-[#c0492f]"
                              : "text-[#142e2a]/50"
                      }`}
                    >
                      {delta === null
                        ? "—"
                        : delta === 0
                          ? "No change"
                          : `${delta > 0 ? "+" : ""}${delta} kg`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  signed = false,
  tone = "neutral",
}: {
  label: string;
  value: number | null;
  unit: string;
  signed?: boolean;
  tone?: "good" | "neutral";
}) {
  const text =
    value === null
      ? "—"
      : `${signed && value > 0 ? "+" : ""}${value}${unit ? " " + unit : ""}`;
  return (
    <div className="rounded-xl border border-[#142e2a]/10 bg-[#f7f9f2] p-4">
      <p className="font-ui text-[12px] font-medium text-[#142e2a]/60">{label}</p>
      <p
        className={`mt-1 font-display text-[22px] font-semibold ${
          tone === "good" ? "text-[#1a8c5a]" : "text-[#142e2a]"
        }`}
      >
        {text}
      </p>
    </div>
  );
}
