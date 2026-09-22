"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Offers to copy the curated starter articles into the posts collection.
 *
 * Shown only when the CMS list is empty, which is exactly when /blogs is
 * being served from that starter content — the situation where the site
 * looks full and the editor looks empty.
 */
export default function ImportStarter({ count }: { count: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (
      !confirm(
        `Import ${count} starter articles as published posts?\n\n` +
          "/blogs will look the same afterwards — the same articles, now " +
          "editable here. Nothing existing is overwritten.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/cms/import-starter-posts", {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error || `Import failed (HTTP ${res.status})`);
        return;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 border-t border-[#e4e7de] pt-6">
      <p className="text-[13px] font-medium text-[#1a1a1a]">
        Already seeing articles on /blogs?
      </p>
      <p className="mx-auto mt-2 max-w-[520px] text-[13px] leading-relaxed text-[#616161]">
        Those {count} articles are starter content that ships with the site, not
        database records — which is why they can&apos;t be edited here. Import
        them and they become normal posts you can edit, reorder and delete.
        /blogs keeps showing the same articles.
      </p>
      {error && (
        <p className="mt-3 text-[13px] text-[#8a2b2b]">{error}</p>
      )}
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy}
        className="mt-4 rounded-lg border border-[#d8ddd0] bg-white px-4 py-2 text-[13px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0] disabled:opacity-40"
      >
        {busy ? "Importing…" : `Import ${count} starter articles`}
      </button>
    </div>
  );
}
