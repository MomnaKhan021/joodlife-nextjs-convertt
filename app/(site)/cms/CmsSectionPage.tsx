import Link from "next/link";

/**
 * Shared body for a CMS section screen.
 *
 * Two states:
 *   - `planned`  → the feature isn't built yet; say so plainly rather than
 *     shipping a dead link.
 *   - `external` → the feature exists, but editing currently happens in
 *     Payload's own admin (posts, media). Link straight through.
 */
export default function CmsSectionPage({
  title,
  description,
  planned,
  externalHref,
  externalLabel,
  note,
}: {
  title: string;
  description: string;
  planned?: boolean;
  externalHref?: string;
  externalLabel?: string;
  note?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[820px]">
      <header className="mb-6">
        <Link
          href="/cms"
          className="text-[13px] text-[#616161] underline-offset-2 hover:underline"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">{title}</h1>
        <p className="mt-1 text-[14px] text-[#616161]">{description}</p>
      </header>

      <div className="rounded-xl border border-[#e4e7de] bg-white p-6">
        {planned ? (
          <>
            <p className="text-[14px] font-medium text-[#1a1a1a]">
              Not built yet
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[#616161]">
              {note ??
                "This section is part of the CMS plan but hasn't been implemented. The dashboard layout and access control are in place, so the screen can be added here without touching anything else."}
            </p>
          </>
        ) : (
          <>
            <p className="text-[13px] leading-relaxed text-[#616161]">
              {note ??
                "Editing currently happens in Payload's admin, which already provides the rich text editor, media library and draft/publish workflow."}
            </p>
            {externalHref && (
              <Link
                href={externalHref}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
              >
                {externalLabel ?? "Open editor"}
                <span aria-hidden>→</span>
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
