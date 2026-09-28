import "server-only";

import { getPayloadInstance } from "@/lib/payload";

/**
 * Read a global for an editor, failing loudly.
 *
 * The page readers fall back to the shipped copy when the database cannot be
 * reached - right for a visitor, wrong for an editor. A screen filled from the
 * fallback would show the shipped wording, and saving it would write that
 * wording over whatever was stored. So editors read through this instead and
 * show LoadFailed rather than a form when it returns null.
 */
export async function loadGlobal(slug: string): Promise<Record<string, unknown> | null> {
  try {
    const payload = await getPayloadInstance();
    return (await payload.findGlobal({
      slug: slug as never,
      depth: 0,
      overrideAccess: true,
    })) as Record<string, unknown>;
  } catch (err) {
    console.error(`[cms] could not load ${slug}:`, err);
    return null;
  }
}

export function LoadFailed({ what }: { what: string }) {
  return (
    <div className="mx-auto w-full max-w-[1000px] rounded-xl border border-[#e5b3b3] bg-[#fdf3f3] p-5 text-[14px] text-[#8a2b2b]">
      <p className="font-medium">The {what} could not be loaded.</p>
      <p className="mt-1">
        The database did not answer, so this screen is not shown - saving it
        would have replaced what is stored with the default wording. Reload the
        page in a moment; a database that has been idle can take a few seconds
        to wake.
      </p>
    </div>
  );
}
