import Link from "next/link";

import { journalSeedPosts } from "@/lib/journalSeed";
import { getPayloadInstance } from "@/lib/payload";
import { categoryLabel } from "@/lib/postCategories";

import ImportStarter from "./ImportStarter";
import PostActions from "./PostActions";

export const dynamic = "force-dynamic";

type PostRow = {
  id: string | number;
  title?: string;
  slug?: string;
  status?: string;
  category?: string | null;
  updatedAt?: string;
  publishedAt?: string | null;
};

async function listPosts(): Promise<PostRow[] | null> {
  try {
    const payload = await getPayloadInstance();
    const { docs } = await payload.find({
      collection: "posts",
      limit: 200,
      depth: 0,
      sort: "-updatedAt",
      overrideAccess: true,
    });
    return docs as PostRow[];
  } catch {
    // Table missing or the database is waking — show the empty state rather
    // than a 500.
    return null;
  }
}

function fmt(iso?: string | null) {
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

export default async function CmsBlogsList() {
  const posts = await listPosts();
  const published = posts?.filter((p) => p.status === "published").length ?? 0;
  const drafts = (posts?.length ?? 0) - published;

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
          <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">
            Blog posts
          </h1>
          <p className="mt-1 text-[14px] text-[#616161]">
            Articles at <code className="rounded bg-[#eef1e8] px-1.5 py-0.5">/blogs</code>.
            Publishing takes effect immediately — no deploy needed. The page
            around them is under{" "}
            <Link
              href="/cms/blog-page"
              className="underline underline-offset-2"
            >
              Blog listing page
            </Link>
            .
          </p>
          {posts && posts.length > 0 && (
            <p className="mt-2 text-[13px] text-[#8a8a8a]">
              {published} published · {drafts} draft{drafts === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <Link
          href="/cms/blogs/new"
          className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
        >
          New post
        </Link>
      </header>

      {posts === null ? (
        <p className="rounded-xl border border-[#e4e7de] bg-white p-6 text-[14px] text-[#616161]">
          Couldn&apos;t read the posts table — the database may still be waking
          up. Reload in a few seconds.
        </p>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-[#e4e7de] bg-white p-8 text-center">
          <p className="text-[15px] font-medium text-[#1a1a1a]">
            No posts in the database yet
          </p>
          <p className="mx-auto mt-2 max-w-[440px] text-[13px] leading-relaxed text-[#616161]">
            Write your first article — give it a title, a cover image and a
            body, then publish. It appears on /blogs straight away.
          </p>
          <Link
            href="/cms/blogs/new"
            className="mt-5 inline-block rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            New post
          </Link>
          {journalSeedPosts.length > 0 && (
            <ImportStarter count={journalSeedPosts.length} />
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#e4e7de] bg-white">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-[#e4e7de] text-[12px] uppercase tracking-wide text-[#8a8a8a]">
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Published</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr
                  key={String(p.id)}
                  className="border-b border-[#f0f2ec] last:border-0 hover:bg-[#fafbf7]"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/cms/blogs/${p.id}`}
                      className="text-[14px] font-medium text-[#1a1a1a] underline-offset-2 hover:underline"
                    >
                      {p.title || "(untitled)"}
                    </Link>
                    <span className="block text-[12px] text-[#8a8a8a]">
                      /blogs/{p.slug}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-[#616161]">
                    {categoryLabel(p.category)}
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
                    {fmt(p.publishedAt)}
                  </td>
                  <td className="px-5 py-3">
                    <PostActions
                      id={p.id}
                      title={p.title || "(untitled)"}
                      slug={p.slug || ""}
                      published={p.status === "published"}
                    />
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
