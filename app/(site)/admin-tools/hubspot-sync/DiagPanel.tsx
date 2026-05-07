"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Read-only diag panel that hits /api/hubspot/diag and renders a
 * compact summary: env / token presence, HubSpot record counts,
 * the resolved consultations object slug, and local DB counts.
 *
 * If a sync isn't producing rows, this is the first place to look.
 */
type SchemaEntry = {
  name: string;
  objectTypeId: string;
  labels?: { singular?: string; plural?: string };
};

type DiagPayload = {
  ok: boolean;
  hubspotEnabled: boolean;
  envObjectType: string | null;
  consultationsObjectType?: string;
  consultationsSource?:
    | "forms"
    | "appointments"
    | "custom_object"
    | "notes"
    | "none";
  consultationFormIds?: string[];
  matchedForms?: Array<{ id: string; name: string }>;
  schemas?: SchemaEntry[] | { error: string; status: number };
  hubspotCounts?: {
    contacts: number | { error: string };
    deals: number | { error: string };
    consultations: number | { error: string };
  };
  local?: {
    counts?: {
      users: number | string;
      orders: number | string;
      consultations: number | string;
    };
    schema?: {
      orders_has_hubspot_deal_id: boolean;
      consultations_has_hubspot_object_id: boolean;
    };
    error?: string;
  };
  error?: string;
};

export default function DiagPanel() {
  const [data, setData] = useState<DiagPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/hubspot/diag", { credentials: "include" });
      const j = (await res.json()) as DiagPayload;
      if (!res.ok) {
        setErr(j.error ?? `HTTP ${res.status}`);
        return;
      }
      setData(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fire the initial load once on mount. We deliberately do this
    // inside an effect so it runs only on the client (avoiding
    // hydration/SSR issues) and `load()` schedules its own setState
    // updates asynchronously — the React 19 set-state-in-effect rule
    // is overzealous for this idiomatic pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <section className="mt-10 rounded-2xl border border-[#142e2a]/10 bg-white p-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-[20px] font-semibold text-[#142e2a]">
          Connection diagnostic
        </h2>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-full border border-[#142e2a]/20 px-4 py-2 font-ui text-[13px] font-semibold text-[#142e2a] hover:border-[#142e2a]/40 disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {err ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 font-ui text-[13px] text-red-800">
          {err}
        </p>
      ) : null}

      {data ? (
        <>
          <Row label="HubSpot configured" value={data.hubspotEnabled ? "yes" : "NO — set HUBSPOT_ACCESS_TOKEN"} bad={!data.hubspotEnabled} />
          <Row
            label="HUBSPOT_CONSULTATIONS_OBJECT_TYPE"
            value={data.envObjectType ?? "(unset — auto-detect)"}
          />
          <Row
            label="Resolved consultations object"
            value={data.consultationsObjectType ?? "—"}
          />
          <Row
            label="Consultations source"
            value={
              data.consultationsSource === "forms"
                ? "HubSpot Marketing Forms"
                : data.consultationsSource === "appointments"
                  ? "HubSpot Appointments (standard object)"
                  : data.consultationsSource === "notes"
                    ? "HubSpot Notes (fallback)"
                    : data.consultationsSource === "custom_object"
                      ? "HubSpot custom object"
                      : data.consultationsSource ?? "—"
            }
          />
          {Array.isArray(data.matchedForms) && data.matchedForms.length > 0 ? (
            <Row
              label="Matched form(s)"
              value={data.matchedForms
                .map((f) => `${f.name} (${f.id.slice(0, 8)}…)`)
                .join(", ")}
            />
          ) : null}

          {data.hubspotCounts ? (
            <Group title="HubSpot record counts">
              <Row label="Contacts" value={fmt(data.hubspotCounts.contacts)} />
              <Row label="Deals" value={fmt(data.hubspotCounts.deals)} />
              <Row label="Consultations" value={fmt(data.hubspotCounts.consultations)} />
            </Group>
          ) : null}

          {data.local?.counts ? (
            <Group title="Local DB row counts">
              <Row label="users" value={String(data.local.counts.users)} />
              <Row label="orders" value={String(data.local.counts.orders)} />
              <Row label="consultations" value={String(data.local.counts.consultations)} />
            </Group>
          ) : null}

          {data.local?.schema ? (
            <Group title="Schema (auto-migrated by Payload)">
              <Row
                label="orders.hubspot_deal_id"
                value={data.local.schema.orders_has_hubspot_deal_id ? "✓ present" : "missing"}
                bad={!data.local.schema.orders_has_hubspot_deal_id}
              />
              <Row
                label="consultations.hubspot_object_id"
                value={data.local.schema.consultations_has_hubspot_object_id ? "✓ present" : "missing"}
                bad={!data.local.schema.consultations_has_hubspot_object_id}
              />
            </Group>
          ) : null}

          {Array.isArray(data.schemas) && data.schemas.length > 0 ? (
            <details className="mt-6 rounded-xl border border-[#142e2a]/10 bg-[#f7f9f2] p-4 font-ui text-[13px]">
              <summary className="cursor-pointer font-semibold text-[#142e2a]">
                {data.schemas.length} HubSpot custom-object schema
                {data.schemas.length === 1 ? "" : "s"}
              </summary>
              <ul className="mt-3 space-y-1 font-mono text-[12px] text-[#142e2a]/80">
                {data.schemas.map((s) => (
                  <li key={s.objectTypeId}>
                    <strong>{s.name}</strong> — id <code>{s.objectTypeId}</code>
                    {s.labels?.plural ? ` · "${s.labels.plural}"` : ""}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function fmt(v: number | { error: string }): string {
  return typeof v === "number" ? v.toLocaleString() : `error: ${v.error}`;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="font-ui text-[12px] font-semibold uppercase tracking-[0.06em] text-[#142e2a]/55">
        {title}
      </h3>
      <dl className="mt-2 divide-y divide-[#142e2a]/10">{children}</dl>
    </div>
  );
}

function Row({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="font-ui text-[13px] text-[#142e2a]/70">{label}</dt>
      <dd
        className={`font-mono text-[13px] ${bad ? "text-red-700" : "text-[#142e2a]"}`}
      >
        {value}
      </dd>
    </div>
  );
}
