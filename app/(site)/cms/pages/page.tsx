import Link from "next/link";

import { getPayloadInstance } from "@/lib/payload";

export const dynamic = "force-dynamic";

type PageRow = {
  id: string | number;
  title?: string;
  slug?: string;
  status?: string;
  updatedAt?: string;
};

async function listPages(): Promise<PageRow[] | null> {
  try {
    const payload = await getPayloadInstance();
    const { docs } = await payload.find({
      collection: "pages",
      limit: 100,
      depth: 0,
      sort: "-updatedAt",
      overrideAccess: true,
    });
    return docs as PageRow[];
  } catch {
    // Table missing (schema repair hasn't run yet) — show the empty state
    // rather than a 500.
    return null;
  }
}

function fmt(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default async function CmsPagesList() {
  const pages = await listPages();

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/cms"
            className="text-[13px] text-[#616161] underline-offset-2 hover:underline"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">Pages</h1>
          <p className="mt-1 text-[14px] text-[#616161]">
            Standalone pages rendered at <code>/slug</code>. Publishing takes
            effect immediately — no deploy needed.
          </p>
        </div>
        <Link
          href="/cms/pages/new"
          className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
        >
          New page
        </Link>
      </header>

      {pages === null ? (
        <p className="rounded-xl border border-[#e4e7de] bg-white p-6 text-[14px] text-[#616161]">
          Couldn&apos;t read the pages table — the database may still be setting
          up. Restart the dev server and try again.
        </p>
      ) : pages.length === 0 ? (
        <div className="rounded-xl border border-[#e4e7de] bg-white p-8 text-center">
          <p className="text-[15px] font-medium text-[#1a1a1a]">No pages yet</p>
          <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-relaxed text-[#616161]">
            Create your first page — give it a title and a slug, write the body,
            and publish. It appears on the site straight away.
          </p>
          <Link
            href="/cms/pages/new"
            className="mt-5 inline-block rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            New page
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#e4e7de] bg-white">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="border-b border-[#e4e7de] text-[12px] uppercase tracking-wide text-[#8a8a8a]">
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">URL</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr
                  key={String(p.id)}
                  className="border-b border-[#f0f2ec] last:border-0 hover:bg-[#fafbf7]"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/cms/pages/${p.id}`}
                      className="text-[14px] font-medium text-[#1a1a1a] underline-offset-2 hover:underline"
                    >
                      {p.title || "(untitled)"}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-[#616161]">
                    /{p.slug}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-[3px] text-[11px] font-medium ${
                        p.status === "published"
                          ? "bg-[#e3f0e0] text-[#2f6b33]"
                          : "bg-[#f0f0f0] text-[#6a6a6a]"
                      }`}
                    >
                      {p.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-[#616161]">
                    {fmt(p.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
