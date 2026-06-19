import Image from "next/image";
import Link from "next/link";

/**
 * "Recent blog posts" — Figma node 67:2691. Dark-green band, heading +
 * prev/next arrows, three photo cards (category tag + title + Read Blog
 * Post), dots beneath. Responsive: 3-up on desktop, stacks on mobile.
 */
const POSTS = [
  {
    tag: "Weight loss",
    img: "/assets/figma/blog-wl.png",
    title: "How Weight Loss Medications Are Changing Everyday Lives",
    href: "/blogs",
  },
  {
    tag: "Erectile dysfunction",
    img: "/assets/figma/blog-ed.png",
    title: "Understanding Erectile Dysfunction: Causes, Symptoms & Treatment Options",
    href: "/blogs",
  },
  {
    tag: "Period Delay",
    img: "/assets/figma/blog-pd.png",
    title: "When Should You Start Period Delay Treatment?",
    href: "/blogs",
  },
];

function ArrowBtn({ dir }: { dir: "left" | "right" }) {
  return (
    <span
      aria-hidden
      className="grid h-11 w-11 place-items-center rounded-full border border-white/40 text-white"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d={dir === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function Blog() {
  return (
    <section
      aria-label="Recent blog posts"
      className="w-full bg-[#142e2a] py-14 md:py-16 lg:py-[80px]"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10 lg:px-[60px]">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h2 className="font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] text-white md:text-[44px]">
            Recent{" "}
            <em className="font-serif font-normal italic">blog</em> posts
          </h2>
          <div className="hidden gap-3 md:flex">
            <ArrowBtn dir="left" />
            <ArrowBtn dir="right" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((p) => (
            <Link
              key={p.title}
              href={p.href}
              className="group relative flex h-[440px] flex-col justify-end overflow-hidden rounded-[16px]"
            >
              <Image
                src={p.img}
                alt=""
                fill
                sizes="(max-width: 1024px) 90vw, 420px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"
              />
              <span className="absolute left-4 top-4 rounded-full bg-white/15 px-3 py-1 font-ui text-[12px] font-medium text-white backdrop-blur-sm">
                {p.tag}
              </span>
              <div className="relative z-10 flex flex-col gap-4 p-5">
                <h3 className="font-ui text-[16px] font-semibold leading-[21px] text-white">
                  {p.title}
                </h3>
                <span className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-white/40 bg-white/5 font-ui text-[13px] font-semibold text-white transition-colors duration-200 group-hover:bg-white/15">
                  Read Blog Post
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-7 flex items-center justify-center gap-1.5" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-2 rounded-full ${i === 0 ? "w-5 bg-white" : "w-2 bg-white/30"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
