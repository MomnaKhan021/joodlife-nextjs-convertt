"use client";

/**
 * Rejected supply — a dedicated view of patients the pharmacist rejected for
 * supply in the Clinical Check queue. Reuses the exact Clinical Check patient
 * card (ConsultationCard) so the layout matches; only rejected patients are
 * listed here. Read-only: the approve/reject actions are hidden because these
 * are already decided.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ConsultationCard,
  type Consultation,
} from "../clinical-queue/QueueView";

const PAGE_SIZE = 20;

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default function RejectedPage() {
  const [list, setList] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [dateFilter, setDateFilter] = useState(""); // yyyy-mm-dd, "" = any date
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-tools/clinical-review?status=rejected", {
        credentials: "include",
        cache: "no-store",
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Failed to load");
      setList(Array.isArray(j.consultations) ? j.consultations : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return list.filter((c) => {
      if (term) {
        const hay = `${c.fullName ?? ""} ${c.email ?? ""} ${c.id}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (dateFilter) {
        if (!c.createdAt) return false;
        const d = new Date(c.createdAt);
        if (Number.isNaN(+d) || isoDate(d) !== dateFilter) return false;
      }
      return true;
    });
  }, [list, q, dateFilter]);

  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  return (
    <div className="mx-auto w-full max-w-[1000px] px-5 py-6 md:px-8 md:py-8">
      <header className="mb-5">
        <h1 className="text-[22px] font-bold tracking-tight text-[#1a1a1a]">
          Rejected supply
        </h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Patients rejected for supply in the Clinical Check. This is a record
          only — no further action is needed here.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name, email or #ID…"
          className="h-9 w-full max-w-[360px] rounded-[8px] border border-[#d0d3d6] bg-white px-3 text-[13px] outline-none focus:border-[#142e2a]"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setPage(1);
          }}
          title="Filter by date"
          className="h-9 rounded-[8px] border border-[#d0d3d6] bg-white px-3 text-[13px] outline-none focus:border-[#142e2a]"
        />
        {dateFilter && (
          <button
            type="button"
            onClick={() => {
              setDateFilter("");
              setPage(1);
            }}
            className="h-9 rounded-[8px] border border-[#d0d3d6] bg-white px-3 text-[13px] font-medium hover:bg-[#f7f7f7]"
          >
            Clear date
          </button>
        )}
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          className="h-9 rounded-[8px] border border-[#d0d3d6] bg-white px-3 text-[13px] font-medium hover:bg-[#f7f7f7] disabled:opacity-50"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-[14px] text-[#616161]">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-[10px] border border-dashed border-[#cdd1d5] bg-white/60 px-4 py-8 text-center text-[14px] text-[#8a8f94]">
          No rejected patients{q || dateFilter ? " match your filters" : " yet"}.
        </p>
      ) : (
        <>
          <p className="mb-3 text-[13px] text-[#616161]">
            Showing {shown.length} of {filtered.length} rejected patient
            {filtered.length === 1 ? "" : "s"}.
          </p>
          <div className="flex flex-col gap-4">
            {shown.map((c) => (
              <ConsultationCard key={c.id} c={c} onDecision={() => {}} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-9 rounded-[8px] border border-[#d0d3d6] bg-white px-3 text-[13px] font-medium hover:bg-[#f7f7f7] disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-[13px] text-[#616161]">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-9 rounded-[8px] border border-[#d0d3d6] bg-white px-3 text-[13px] font-medium hover:bg-[#f7f7f7] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
