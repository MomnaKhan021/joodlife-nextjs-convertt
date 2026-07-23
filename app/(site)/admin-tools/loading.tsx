/**
 * Instant loading state for every admin-tools tab.
 *
 * Next.js shows this the moment a nav link is clicked, while the target
 * page's server render (session check + DB queries) is still in flight —
 * so tab clicks respond immediately instead of appearing stuck for the
 * 1–3s a cold serverless/DB wake-up can take.
 */
export default function AdminToolsLoading() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 md:px-6" aria-busy="true" aria-live="polite">
      {/* Title bar */}
      <div className="mb-5">
        <div className="h-6 w-56 animate-pulse rounded-md bg-[#e5e7eb]" />
        <div className="mt-2 h-3.5 w-80 max-w-full animate-pulse rounded-md bg-[#ececec]" />
      </div>
      {/* KPI / filter strip */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-[12px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]" />
        ))}
      </div>
      {/* Rows */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-[88px] animate-pulse rounded-[12px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]" />
        ))}
      </div>
      <p className="mt-5 text-center text-[12px] text-[#9ca3af]">Loading…</p>
    </div>
  );
}
