"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Per-row actions on the Pages list: Edit, View (published only) and
 * Delete. Delete goes through Payload's REST endpoint so the collection's
 * admin-only rule is enforced server-side, then refreshes the list.
 */
export default function PageActions({
  id,
  title,
  slug,
  published,
}: {
  id: string | number;
  title: string;
  slug: string;
  published: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/pages/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json?.errors?.[0]?.message || `Delete failed (${res.status})`);
        return;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-3">
      {error && (
        <span className="text-[12px] text-[#8a2b2b]" title={error}>
          {error}
        </span>
      )}
      <Link
        href={`/cms/pages/${id}`}
        className="text-[13px] text-[#1a1a1a] underline-offset-2 hover:underline"
      >
        Edit
      </Link>
      {published && (
        <Link
          href={`/${slug}`}
          target="_blank"
          className="text-[13px] text-[#616161] underline-offset-2 hover:underline"
        >
          View
        </Link>
      )}
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="text-[13px] text-[#8a2b2b] underline-offset-2 hover:underline disabled:opacity-40"
      >
        {busy ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
