import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { groupedCmsNav } from "@/lib/cmsSections";
import { getPayloadInstance } from "@/lib/payload";

export const dynamic = "force-dynamic";

/** Live counts for the "ready" areas. Failures degrade to null, never throw. */
async function getCounts(): Promise<{ posts: number | null; media: number | null }> {
  try {
    const payload = await getPayloadInstance();
    const [posts, media] = await Promise.all([
      payload.count({ collection: "posts" }),
      payload.count({ collection: "media" }),
    ]);
    return { posts: posts.totalDocs, media: media.totalDocs };
  } catch {
    return { posts: null, media: null };
  }
}

export default async function CmsDashboard() {
  const user = await getCurrentUser();
  const groups = groupedCmsNav(user?.role ?? "customer", user?.permissions ?? []);
  const { posts, media } = await getCounts();

  const countFor = (href: string) =>
    href === "/cms/blogs" ? posts : href === "/cms/media" ? media : null;

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <header className="mb-8">
        <h1 className="text-[24px] font-semibold text-[#1a1a1a] md:text-[28px]">
          Content management
        </h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Everything that appears on the JoodLife site — articles, page copy,
          navigation and images. Changes go live on save; no deploy needed.
        </p>
      </header>

      {groups.length === 0 ? (
        <p className="rounded-xl border border-[#e4e7de] bg-white p-6 text-[14px] text-[#616161]">
          You don&apos;t have access to any content sections yet. Ask an admin to
          grant them on your user account.
        </p>
      ) : (
        <div className="space-y-9">
          {groups.map((group) => (
            <section key={group.key}>
              <div className="mb-3">
                <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                  {group.label}
                </h2>
                <p className="mt-0.5 text-[13px] text-[#8a8a8a]">
                  {group.description}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => {
                  const count = countFor(item.href);
                  const planned = item.status === "planned";
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group rounded-xl border border-[#e4e7de] bg-white p-5 transition-shadow hover:shadow-md ${
                        planned ? "opacity-80" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-[16px] font-medium text-[#1a1a1a]">
                          {item.label}
                        </h3>
                        {planned ? (
                          <span className="shrink-0 rounded-full bg-[#f0f0f0] px-2 py-[2px] text-[10px] font-medium text-[#6a6a6a]">
                            Not built yet
                          </span>
                        ) : (
                          count !== null && (
                            <span className="shrink-0 text-[20px] font-semibold tabular-nums text-[#1a1a1a]">
                              {count}
                            </span>
                          )
                        )}
                      </div>
                      <p className="mt-2 text-[13px] leading-relaxed text-[#616161]">
                        {item.description}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
