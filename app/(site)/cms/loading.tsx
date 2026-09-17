/**
 * Shown the moment a CMS tab is clicked, for every /cms route that doesn't
 * define its own loading file.
 *
 * Every editor screen is `force-dynamic` and reads its global from Postgres
 * before it can render, so without this Next keeps the *previous* page on
 * screen until that query returns — a click appears to do nothing, and on a
 * sleeping database that lasts seconds. A skeleton shaped like the editor
 * underneath turns that dead time into visible progress.
 *
 * Deliberately static markup: no data, no client JS, so it paints instantly.
 */

/** One grey bar. `w` is a Tailwind width class so it stays build-time visible. */
function Bar({ w, h = "h-4" }: { w: string; h?: string }) {
  return <div className={`${h} ${w} rounded bg-[#e9ece3]`} />;
}

function Card({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5">
      <Bar w="w-40" h="h-5" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Bar key={i} w={i % 3 === 0 ? "w-full" : i % 3 === 1 ? "w-5/6" : "w-2/3"} />
        ))}
      </div>
    </div>
  );
}

export default function CmsLoading() {
  return (
    <div className="mx-auto w-full max-w-[1000px] animate-pulse" aria-busy="true">
      <span className="sr-only">Loading…</span>

      {/* Page heading block */}
      <header className="mb-6 space-y-2">
        <Bar w="w-24" h="h-3" />
        <Bar w="w-56" h="h-7" />
        <Bar w="w-80" h="h-3" />
      </header>

      <div className="space-y-5">
        <Card rows={2} />
        <Card rows={4} />
        <Card rows={3} />
      </div>

      {/* Save button */}
      <div className="mt-5">
        <Bar w="w-32" h="h-9" />
      </div>
    </div>
  );
}
