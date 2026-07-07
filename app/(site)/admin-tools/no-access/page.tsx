export const dynamic = "force-dynamic";

export const metadata = { title: "No access — JoodLife" };

/**
 * Shown to a staff member who has no dashboard sections granted yet.
 * The layout allows this path through without a section check.
 */
export default function NoAccessPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f5f6] px-4 py-10 font-ui text-[#303030]">
      <div className="w-full max-w-[440px] rounded-[14px] border border-[#e6e8ea] bg-white p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f1f1f1]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 8v5M12 16h.01M12 3l9 16H3l9-16z" stroke="#616161" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-4 text-[18px] font-semibold text-[#1a1a1a]">No sections assigned yet</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[#616161]">
          Your account doesn&rsquo;t have access to any dashboard sections. Ask
          an administrator to grant you access under your user&rsquo;s
          Permissions.
        </p>
      </div>
    </main>
  );
}
