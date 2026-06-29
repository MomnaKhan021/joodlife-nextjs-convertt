"use client";

/**
 * DEV-03 / DEV-04 — Clinical Approval Queue
 *
 * Shows all consultations and reorders waiting for pharmacist review.
 * Red-flagged submissions are sorted to the top and highlighted.
 * Pharmacist can approve or reject each one with a mandatory reason.
 * Decisions are logged (reviewer + timestamp + reason) and mirrored to HubSpot.
 */

import { useCallback, useEffect, useState } from "react";

type Consultation = {
  id: number;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  productSlug: string | null;
  dose: string | null;
  status: string;
  createdAt: string;
  isReorder: boolean;
  redFlags: string[];
  hasRedFlags: boolean;
  reviewed: boolean;
  reviewDecision: string | null;
  reviewReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  answers: Record<string, unknown>;
};

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function StatusBadge({ status, decision }: { status: string; decision: string | null }) {
  if (decision === "approved") return <span className="rounded-full bg-[#d1fae5] px-2.5 py-0.5 text-[12px] font-semibold text-[#065f46]">✓ Approved</span>;
  if (decision === "rejected") return <span className="rounded-full bg-[#fee2e2] px-2.5 py-0.5 text-[12px] font-semibold text-[#991b1b]">✗ Rejected</span>;
  if (status === "submitted") return <span className="rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-[12px] font-semibold text-[#92400e]">Pending</span>;
  return <span className="rounded-full bg-[#e5e7eb] px-2.5 py-0.5 text-[12px] font-semibold text-[#374151] capitalize">{status}</span>;
}

function RedFlagBanner({ flags }: { flags: string[] }) {
  if (flags.length === 0) return null;
  return (
    <div className="mb-3 rounded-lg border border-[#fca5a5] bg-[#fff1f2] px-4 py-3">
      <p className="mb-1.5 text-[13px] font-bold text-[#b91c1c]">🚨 RED FLAG — Clinical review required</p>
      <ul className="space-y-0.5">
        {flags.map((f, i) => (
          <li key={i} className="text-[12px] text-[#7f1d1d]">⚠️ {f}</li>
        ))}
      </ul>
    </div>
  );
}

function AnswersSummary({ answers }: { answers: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(answers).filter(([k]) => !k.startsWith("_"));
  if (entries.length === 0) return null;
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[12px] font-medium text-[#1450b0] hover:underline"
      >
        {open ? "Hide answers ▲" : `View ${entries.length} questionnaire answers ▼`}
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3">
          <dl className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {entries.map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="text-[11px] font-semibold text-[#6b7280] shrink-0">{k}:</dt>
                <dd className="text-[11px] text-[#374151] break-words">
                  {Array.isArray(v) ? v.join(", ") : String(v ?? "—")}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

function ReviewForm({
  id,
  onDone,
}: {
  id: number;
  onDone: (id: number, decision: string, reason: string) => void;
}) {
  const [decision, setDecision] = useState<"approved" | "rejected" | "">("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    if (!decision) { setError("Please select Approve or Reject."); return; }
    if (!reason.trim()) { setError("A reason is required for the record."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-tools/clinical-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, decision, reason: reason.trim() }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Failed");
      onDone(id, decision, reason.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [id, decision, reason, onDone]);

  return (
    <div className="mt-3 rounded-lg border border-[#e5e7eb] bg-white p-4">
      <p className="mb-3 text-[13px] font-semibold text-[#1a1a1a]">Clinical decision</p>

      <div className="mb-3 flex gap-3">
        <button
          onClick={() => setDecision("approved")}
          className={`flex-1 rounded-lg border py-2 text-[13px] font-semibold transition-colors ${
            decision === "approved"
              ? "border-[#059669] bg-[#d1fae5] text-[#065f46]"
              : "border-[#d1d5db] bg-white text-[#374151] hover:border-[#059669]"
          }`}
        >
          ✓ Approve supply
        </button>
        <button
          onClick={() => setDecision("rejected")}
          className={`flex-1 rounded-lg border py-2 text-[13px] font-semibold transition-colors ${
            decision === "rejected"
              ? "border-[#dc2626] bg-[#fee2e2] text-[#991b1b]"
              : "border-[#d1d5db] bg-white text-[#374151] hover:border-[#dc2626]"
          }`}
        >
          ✗ Reject supply
        </button>
      </div>

      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for this decision (required — stored in patient record and HubSpot)…"
        rows={3}
        className="w-full rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-[13px] text-[#374151] placeholder:text-[#9ca3af] focus:border-[#142e2a] focus:outline-none"
      />

      {error && <p className="mt-1.5 text-[12px] text-[#dc2626]">{error}</p>}

      <button
        onClick={submit}
        disabled={loading}
        className="mt-3 inline-flex h-9 items-center rounded-lg bg-[#142e2a] px-5 text-[13px] font-semibold text-white hover:bg-[#0c2421] disabled:opacity-60"
      >
        {loading ? "Saving…" : "Submit decision"}
      </button>
    </div>
  );
}

function ConsultationCard({
  c,
  onDecision,
}: {
  c: Consultation;
  onDecision: (id: number, decision: string, reason: string) => void;
}) {
  const [showReview, setShowReview] = useState(false);

  return (
    <div
      className={`rounded-[12px] border p-5 ${
        c.hasRedFlags && !c.reviewed
          ? "border-[#fca5a5] bg-[#fff8f8] shadow-[0_0_0_2px_#fca5a5]"
          : "border-[#e5e7eb] bg-white"
      }`}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-semibold text-[#1a1a1a]">
              {c.fullName || c.email || `#${c.id}`}
            </span>
            <StatusBadge status={c.status} decision={c.reviewDecision} />
            {c.isReorder && (
              <span className="rounded-full bg-[#dbeafe] px-2.5 py-0.5 text-[11px] font-semibold text-[#1d4ed8]">
                Reorder
              </span>
            )}
            {c.hasRedFlags && (
              <span className="rounded-full bg-[#fef2f2] px-2.5 py-0.5 text-[11px] font-bold text-[#b91c1c]">
                🚨 Red flag
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[12px] text-[#6b7280]">
            {c.email}
            {c.phone ? ` · ${c.phone}` : ""}
            {" · "}
            {c.productSlug ?? "—"}
            {c.dose ? ` (${c.dose})` : ""}
          </p>
          <p className="text-[11px] text-[#9ca3af]">Submitted: {fmt(c.createdAt)}</p>
        </div>
        <span className="text-[12px] font-mono text-[#9ca3af]">#{c.id}</span>
      </div>

      {/* Red flag banner */}
      {c.hasRedFlags && !c.reviewed && (
        <div className="mt-3">
          <RedFlagBanner flags={c.redFlags} />
        </div>
      )}

      {/* Questionnaire answers (collapsed) */}
      <AnswersSummary answers={c.answers} />

      {/* Decision already recorded */}
      {c.reviewed && (
        <div className={`mt-3 rounded-lg border px-4 py-3 ${
          c.reviewDecision === "approved"
            ? "border-[#a7f3d0] bg-[#f0fdf4]"
            : "border-[#fca5a5] bg-[#fff1f2]"
        }`}>
          <p className="text-[13px] font-semibold text-[#1a1a1a]">
            {c.reviewDecision === "approved" ? "✓ Approved" : "✗ Rejected"} by {c.reviewedBy ?? "pharmacist"}
          </p>
          <p className="text-[12px] text-[#6b7280]">{fmt(c.reviewedAt ?? null)}</p>
          {c.reviewReason && (
            <p className="mt-1 text-[12px] text-[#374151]">Reason: {c.reviewReason}</p>
          )}
        </div>
      )}

      {/* Action buttons */}
      {!c.reviewed && (
        <div className="mt-3">
          {showReview ? (
            <ReviewForm
              id={c.id}
              onDone={(id, decision, reason) => {
                setShowReview(false);
                onDecision(id, decision, reason);
              }}
            />
          ) : (
            <button
              onClick={() => setShowReview(true)}
              className="inline-flex h-9 items-center rounded-lg bg-[#142e2a] px-5 text-[13px] font-semibold text-white hover:bg-[#0c2421]"
            >
              Review this patient
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ClinicalQueuePage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async (all: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin-tools/clinical-review?status=${all ? "all" : "pending"}`,
        { credentials: "include" },
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Failed to load");
      setConsultations(json.consultations ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(showAll); }, [showAll, load]);

  const handleDecision = useCallback((id: number, decision: string, reason: string) => {
    setConsultations((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              reviewed: true,
              reviewDecision: decision,
              reviewReason: reason,
              reviewedBy: "You",
              reviewedAt: new Date().toISOString(),
              answers: { ...c.answers, _review_decision: decision, _review_reason: reason },
            }
          : c,
      ),
    );
  }, []);

  const pending = consultations.filter((c) => !c.reviewed);
  const flagged = pending.filter((c) => c.hasRedFlags);
  const done = consultations.filter((c) => c.reviewed);

  return (
    <main className="min-h-screen bg-[#f1f1f1] px-4 py-6 md:px-8">
      <div className="mx-auto max-w-[860px]">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-semibold text-[#1a1a1a]">Clinical Approval Queue</h1>
            <p className="mt-0.5 text-[13px] text-[#6b7280]">
              Review and approve or reject patient reorders and flagged consultations before supply.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {flagged.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-[#dc2626] px-3 py-1 text-[13px] font-bold text-white">
                🚨 {flagged.length} red flag{flagged.length !== 1 ? "s" : ""}
              </span>
            )}
            {pending.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-[#fef3c7] px-3 py-1 text-[13px] font-semibold text-[#92400e]">
                {pending.length} pending
              </span>
            )}
          </div>
        </div>

        {/* Toggle */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setShowAll(false)}
            className={`h-8 rounded-lg px-4 text-[13px] font-medium transition-colors ${
              !showAll ? "bg-[#142e2a] text-white" : "border border-[#d1d5db] bg-white text-[#374151] hover:bg-[#f3f4f6]"
            }`}
          >
            Pending only
          </button>
          <button
            onClick={() => setShowAll(true)}
            className={`h-8 rounded-lg px-4 text-[13px] font-medium transition-colors ${
              showAll ? "bg-[#142e2a] text-white" : "border border-[#d1d5db] bg-white text-[#374151] hover:bg-[#f3f4f6]"
            }`}
          >
            All ({consultations.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[120px] animate-pulse rounded-[12px] bg-white" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[12px] border border-[#fca5a5] bg-[#fff1f2] p-6 text-center">
            <p className="text-[14px] font-semibold text-[#b91c1c]">Error loading queue</p>
            <p className="mt-1 text-[13px] text-[#6b7280]">{error}</p>
            <button
              onClick={() => load(showAll)}
              className="mt-3 inline-flex h-8 items-center rounded-lg bg-[#142e2a] px-4 text-[13px] text-white"
            >
              Retry
            </button>
          </div>
        ) : pending.length === 0 && !showAll ? (
          <div className="rounded-[12px] border border-[#d1fae5] bg-[#f0fdf4] p-10 text-center">
            <p className="text-[18px]">✅</p>
            <p className="mt-2 text-[15px] font-semibold text-[#065f46]">All clear — no patients pending review</p>
            <p className="mt-1 text-[13px] text-[#6b7280]">No reorders or consultations are waiting for clinical approval.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Red-flagged first */}
            {flagged.length > 0 && (
              <div>
                <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-[#b91c1c]">
                  🚨 Red flags — action required immediately
                </h2>
                <div className="space-y-3">
                  {flagged.map((c) => (
                    <ConsultationCard key={c.id} c={c} onDecision={handleDecision} />
                  ))}
                </div>
              </div>
            )}

            {/* Normal pending */}
            {pending.filter((c) => !c.hasRedFlags).length > 0 && (
              <div>
                <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-[#6b7280]">
                  Pending review
                </h2>
                <div className="space-y-3">
                  {pending.filter((c) => !c.hasRedFlags).map((c) => (
                    <ConsultationCard key={c.id} c={c} onDecision={handleDecision} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed */}
            {showAll && done.length > 0 && (
              <div>
                <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-[#6b7280]">
                  Reviewed ({done.length})
                </h2>
                <div className="space-y-3">
                  {done.map((c) => (
                    <ConsultationCard key={c.id} c={c} onDecision={handleDecision} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
