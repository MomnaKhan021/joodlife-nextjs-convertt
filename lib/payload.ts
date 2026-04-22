/**
 * Server-only helpers for fetching Payload data from Next.js Server Components.
 *
 * Two modes:
 *  1. `getPayloadInstance()` — direct DB access via the local Payload API
 *     (fastest; no HTTP overhead). Use inside Server Components or route
 *     handlers that already run on the same Node process as Payload.
 *  2. `payloadFetch()` — REST fetch, useful when you want to talk to a
 *     remote Payload deployment or want full HTTP caching semantics.
 */
import "server-only";
import { getPayload, type Payload } from "payload";
import config from "@/payload.config";

let cached: Promise<Payload> | null = null;

export function getPayloadInstance(): Promise<Payload> {
  if (!cached) {
    cached = getPayload({ config });
  }
  return cached;
}

export async function payloadFetch<T = unknown>(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number; tags?: string[] } }
): Promise<T> {
  const base =
    process.env.PAYLOAD_PUBLIC_SERVER_URL ??
    process.env.NEXT_PUBLIC_SERVER_URL ??
    "http://localhost:3000";

  const url = `${base.replace(/\/$/, "")}/api${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Payload fetch failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}
