"use client";

/**
 * The sticky Save bar the page editors share.
 *
 * Save stays disabled until something differs from what the screen loaded
 * with, and the confirmation sits beside the button because the bar never
 * leaves the screen - a message at the top of the form would be off-screen.
 */
export default function SaveBar({
  onSave,
  saving,
  dirty,
  saved,
  error,
  label,
  viewHref,
}: {
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
  saved: boolean;
  error: string | null;
  label: string;
  /** The live page this screen edits; omitted when there is no single page. */
  viewHref?: string;
}) {
  return (
    <div className="sticky bottom-0 z-20 mt-6 flex flex-wrap items-center gap-3 border-t border-[#e4e7de] bg-[#f7f9f2]/95 py-3 backdrop-blur">
      <button
        type="button"
        onClick={onSave}
        disabled={saving || !dirty}
        className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {saving ? "Saving…" : label}
      </button>
      {viewHref ? (
        <a
          href={viewHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] text-[#616161] underline-offset-2 hover:underline"
        >
          View the page ↗
        </a>
      ) : null}
      {saved ? (
        <span className="text-[13px] text-[#2f6b33]">
          Saved. Reload the page to see the change.
        </span>
      ) : null}
      {error ? <span className="text-[13px] text-[#8a2b2b]">{error}</span> : null}
    </div>
  );
}
