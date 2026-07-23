/**
 * Instant loading state for the profile / account area.
 *
 * The account page is rendered on the server (session check + order and
 * consultation queries), which can take a couple of seconds on a cold
 * start. Next.js shows this skeleton the moment the user clicks the
 * account icon, so the page always "opens" immediately.
 */
export default function ProfileLoading() {
  return (
    <main
      className="min-h-screen bg-[#f7f9f2] px-4 py-8 md:px-8"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mx-auto w-full max-w-[880px]">
        {/* Greeting card */}
        <div className="rounded-[16px] bg-white p-6 shadow-[0_1px_2px_rgba(20,46,42,0.06)]">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 animate-pulse rounded-full bg-[#e7efe0]" />
            <div>
              <div className="h-5 w-44 animate-pulse rounded-md bg-[#e5e7eb]" />
              <div className="mt-2 h-3.5 w-56 animate-pulse rounded-md bg-[#ececec]" />
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <div className="h-10 w-36 animate-pulse rounded-lg bg-[#e7efe0]" />
            <div className="h-10 w-24 animate-pulse rounded-lg bg-[#ececec]" />
          </div>
        </div>

        {/* Stat cards */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-[16px] bg-white shadow-[0_1px_2px_rgba(20,46,42,0.06)]" />
          ))}
        </div>

        {/* Orders list */}
        <div className="mt-4 rounded-[16px] bg-white p-6 shadow-[0_1px_2px_rgba(20,46,42,0.06)]">
          <div className="h-5 w-32 animate-pulse rounded-md bg-[#e5e7eb]" />
          <div className="mt-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-[#f3f4f6]" />
            ))}
          </div>
        </div>

        <p className="mt-6 text-center font-ui text-[12px] text-[#9ca3af]">
          Loading your account…
        </p>
      </div>
    </main>
  );
}
