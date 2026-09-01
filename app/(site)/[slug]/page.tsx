import Image from "next/image";
import { notFound, permanentRedirect, redirect } from "next/navigation";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";
import RichText from "@/components/blog/RichText";
import { getPageBySlug } from "@/lib/pages";

export const dynamic = "force-dynamic";

/**
 * Catch-all renderer for CMS-managed pages at `/<slug>`.
 *
 * Static routes win over this one in Next.js, so `/shop`, `/login` and
 * friends are unaffected — this only handles slugs nothing else claims.
 * (The Pages collection also rejects those slugs at save time, so the
 * clash surfaces in the editor rather than as a silent no-op.)
 *
 * Unpublished or unknown slugs → 404, same as any missing page.
 */

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) return {};
  return {
    title: page.metaTitle || `${page.title} — JoodLife`,
    description: page.metaDescription || page.excerpt || undefined,
  };
}

export default async function CmsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) notFound();

  // A page with a redirect target never renders — it forwards instead.
  // Guard against a page pointing at itself, which would loop forever.
  if (page.redirectUrl && page.redirectUrl !== `/${slug}`) {
    if (page.redirectPermanent) permanentRedirect(page.redirectUrl);
    redirect(page.redirectUrl);
  }

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />

      <article className="mx-auto w-full max-w-[760px] px-6 pt-10 pb-12 md:px-0 md:pt-14 md:pb-20">
        <h1 className="font-ui text-[30px] leading-tight font-semibold text-[#142e2a] md:text-[40px]">
          {page.title}
        </h1>

        {page.excerpt ? (
          <p className="mt-4 font-ui text-[17px] leading-[1.6] text-[#142e2a]/70">
            {page.excerpt}
          </p>
        ) : null}

        {page.heroImageUrl ? (
          <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-2xl">
            <Image
              src={page.heroImageUrl}
              alt={page.title}
              fill
              sizes="(max-width: 768px) 100vw, 760px"
              className="object-cover"
            />
          </div>
        ) : null}

        <div className="mt-8">
          {page.bodyHtml ? (
            // Raw HTML authored by an admin — the Pages collection restricts
            // create/update to admins, the same trust model /blogs uses for
            // its imported bodyHtml.
            <div
              className="prose-blog font-ui text-[16px] leading-[1.7] text-[#142e2a]/85 md:text-[17px]"
              dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
            />
          ) : (
            <RichText data={page.content} />
          )}
        </div>
      </article>

      <Footer />
    </main>
  );
}
