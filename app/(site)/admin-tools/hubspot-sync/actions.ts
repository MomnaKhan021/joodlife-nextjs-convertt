"use server";

import { getCurrentUser } from "@/lib/auth";
import { isHubSpotEnabled } from "@/lib/hubspot";
import { runHubSpotSyncAll, type SyncAllResult } from "@/lib/hubspot-sync-all";
import { pushAllOrdersToHubSpot, type PushOrdersResult } from "@/lib/hubspot-push-orders";

export type SyncActionResult =
  | ({ ok: true } & SyncAllResult)
  | { ok: false; error: string };

/**
 * Admin "Sync now" — runs as a SERVER ACTION, not a client fetch. Server
 * actions execute inside the authenticated request context, so the admin
 * session is read server-side via getCurrentUser() — exactly like the page
 * gate that already works. This avoids the client-fetch cookie problem that
 * caused "session cookie missing or expired" on the button.
 */
export async function syncAllAction(): Promise<SyncActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { ok: false, error: "Admin sign-in required. Please sign in again." };
  }
  if (!isHubSpotEnabled()) {
    return { ok: false, error: "HUBSPOT_ACCESS_TOKEN is not set in this deployment." };
  }
  try {
    const result = await runHubSpotSyncAll();
    return { ok: true, ...result };
  } catch (err) {
    return {
      ok: false,
      error: `Sync failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export type PushOrdersActionResult =
  | ({ ok: true } & PushOrdersResult)
  | { ok: false; error: string };

/**
 * One-time backfill of existing DB orders → HubSpot (contact + deal + note).
 * Idempotent: orders already pushed (have a hubspot_deal_id) are skipped.
 */
export async function pushOrdersAction(): Promise<PushOrdersActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { ok: false, error: "Admin sign-in required. Please sign in again." };
  }
  if (!isHubSpotEnabled()) {
    return { ok: false, error: "HUBSPOT_ACCESS_TOKEN is not set in this deployment." };
  }
  try {
    const result = await pushAllOrdersToHubSpot();
    return { ok: true, ...result };
  } catch (err) {
    return {
      ok: false,
      error: `Push failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
