"use client";

import { useCallback, useState } from "react";

/**
 * Client-side dashboard tools that live above the stat-card grid:
 *
 *   1. Sign out — POSTs to Payload's REST logout endpoint, then
 *      hard-redirects to /admin/login. Avoids relying on Payload's
 *      sidebar logout link in case it's blocked by a stale chrome.
 *
 *   2. Inspect HubSpot deal — pastes a deal id (or leaves blank for
 *      the first deal HubSpot returns) and pretty-prints the
 *      /api/hubspot/debug-deal response inline. This is what the
 *      operator runs when sync-orders shows "0 inserted, errors > 0"
 *      and the per-row error string isn't enough to pinpoint the
 *      column or constraint that's rejecting the data.
 *
 *   3. Direct links to /admin/login + /admin/account so a half-broken
 *      sidebar still leaves the operator a way out.
 */
type DebugResponse = {
  ok: boolean;
  error?: string;
  via?: string;
  deal?: {
    id: string;
    properties: Record<string, string | undefined>;
    contactId?: string | null;
    contactEmail?: string | null;
    contact?: unknown;
  };
  schema?: {
    orders: Array<{ column_name: string; data_type: string; is_nullable: string }>;
    hasHubspotDealIdColumn: boolean;
  };
  trial?: {
    orderNumberWeWouldUse: string;
    alreadyExistsInOrdersTable: boolean;
    schemaInspectError: string | null;
  };
};

export default function DashboardActions() {
  const [signingOut, setSigningOut] = useState(false);
  const [signOutErr, setSignOutErr] = useState<string | null>(null);

  const [dealId, setDealId] = useState("");
  const [debugBusy, setDebugBusy] = useState(false);
  const [debugResp, setDebugResp] = useState<DebugResponse | null>(null);
  const [debugErr, setDebugErr] = useState<string | null>(null);

  const handleSignOut = useCallback(async () => {
    if (signingOut) return;
    setSignOutErr(null);
    setSigningOut(true);
    try {
      // Payload's REST logout — clears the auth cookie. Always POST.
      const res = await fetch("/api/users/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      // Even if the response status is non-OK, redirect to login so
      // the operator isn't stuck on a half-broken admin chrome.
      if (!res.ok && res.status !== 401 && res.status !== 200) {
        setSignOutErr(
          `Logout returned HTTP ${res.status}. Redirecting to login anyway…`
        );
      }
    } catch (err) {
      setSignOutErr(err instanceof Error ? err.message : String(err));
    } finally {
      // Hard reload — clears any in-memory React Query / Payload state.
      window.location.href = "/admin/login";
    }
  }, [signingOut]);

  const handleDebug = useCallback(async () => {
    if (debugBusy) return;
    setDebugErr(null);
    setDebugResp(null);
    setDebugBusy(true);
    try {
      const url = dealId.trim()
        ? `/api/hubspot/debug-deal?id=${encodeURIComponent(dealId.trim())}`
        : `/api/hubspot/debug-deal`;
      const res = await fetch(url, { credentials: "include" });
      // The response might come back as Payload's catch-all error if
      // the deployment hasn't picked up the new route yet. Detect that.
      const text = await res.text();
      let json: DebugResponse | { message?: string };
      try {
        json = JSON.parse(text) as DebugResponse | { message?: string };
      } catch {
        setDebugErr(`Non-JSON response (HTTP ${res.status}): ${text.slice(0, 200)}`);
        return;
      }
      if ("message" in json && typeof json.message === "string" && /Route not found/i.test(json.message)) {
        setDebugErr(
          "The /api/hubspot/debug-deal route is missing from the deployed " +
            "build. Wait for Vercel to finish deploying the latest commit, " +
            "then try again."
        );
        return;
      }
      if (!res.ok || ("ok" in json && json.ok === false)) {
        const detail = ("error" in json && json.error) || `HTTP ${res.status}`;
        setDebugErr(String(detail));
        return;
      }
      setDebugResp(json as DebugResponse);
    } catch (err) {
      setDebugErr(err instanceof Error ? err.message : String(err));
    } finally {
      setDebugBusy(false);
    }
  }, [dealId, debugBusy]);

  return (
    <section className="jood-actions">
      {/* Account row */}
      <div className="jood-actions__bar">
        <div className="jood-actions__left">
          <a href="/admin/account" className="jood-actions__link">
            My account
          </a>
          <a href="/admin-tools/data-browser" className="jood-actions__link">
            Data browser
          </a>
          <a href="/admin-tools/hubspot-sync" className="jood-actions__link">
            HubSpot sync
          </a>
        </div>
        <div className="jood-actions__right">
          {signOutErr ? (
            <span className="jood-actions__inline-error">{signOutErr}</span>
          ) : null}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="jood-actions__btn jood-actions__btn--danger"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>

      {/* HubSpot deal inspector */}
      <div className="jood-actions__debug">
        <h3 className="jood-actions__debug-title">Inspect HubSpot deal</h3>
        <p className="jood-actions__debug-hint">
          Paste a HubSpot deal id (or leave blank for the first one returned)
          and we&apos;ll show its raw payload, the local{" "}
          <code>orders</code> table schema, and whether the upsert would
          collide with an existing order. Use this when an Orders sync run
          reports &quot;0 inserted&quot;.
        </p>
        <div className="jood-actions__debug-form">
          <input
            type="text"
            value={dealId}
            onChange={(e) => setDealId(e.target.value)}
            placeholder="HubSpot deal id (optional)"
            className="jood-actions__input"
          />
          <button
            type="button"
            onClick={handleDebug}
            disabled={debugBusy}
            className="jood-actions__btn jood-actions__btn--primary"
          >
            {debugBusy ? "Inspecting…" : "Inspect"}
          </button>
        </div>

        {debugErr ? (
          <div className="jood-actions__debug-err">{debugErr}</div>
        ) : null}

        {debugResp ? (
          <div className="jood-actions__debug-result">
            <div className="jood-actions__debug-block">
              <h4>Order number we&apos;d use</h4>
              <code>{debugResp.trial?.orderNumberWeWouldUse ?? "—"}</code>
              {debugResp.trial?.alreadyExistsInOrdersTable ? (
                <span className="jood-actions__pill">already in DB</span>
              ) : (
                <span className="jood-actions__pill jood-actions__pill--ok">new</span>
              )}
            </div>

            <div className="jood-actions__debug-block">
              <h4>HubSpot deal {debugResp.deal?.id}</h4>
              <pre>{JSON.stringify(debugResp.deal?.properties, null, 2)}</pre>
              {debugResp.deal?.contactEmail ? (
                <p>
                  Associated contact email:{" "}
                  <strong>{debugResp.deal.contactEmail}</strong>
                </p>
              ) : null}
            </div>

            <div className="jood-actions__debug-block">
              <h4>
                Local <code>orders</code> table columns
                {debugResp.schema?.hasHubspotDealIdColumn ? (
                  <span className="jood-actions__pill jood-actions__pill--ok">
                    hubspot_deal_id present
                  </span>
                ) : (
                  <span className="jood-actions__pill jood-actions__pill--warn">
                    hubspot_deal_id MISSING
                  </span>
                )}
              </h4>
              <ul>
                {(debugResp.schema?.orders ?? []).map((c) => (
                  <li key={c.column_name}>
                    <code>{c.column_name}</code>{" "}
                    <span className="jood-actions__col-type">
                      {c.data_type}
                      {c.is_nullable === "NO" ? " · NOT NULL" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
