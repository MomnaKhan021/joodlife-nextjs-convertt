import Image from 'next/image';
import Link from 'next/link';

const posts = [
  {
    category: 'Jood Updates',
    title: 'How Weight Loss Medications Are Changing Everyday Lives',
    image: '/images/quiz-section.png',
  },
  {
    category: 'Health & Diet',
    title: 'How Weight Loss Medications Are Changing Everyday Lives',
    image: '/images/product-card-3.png',
  },
  {
    category: 'Health & Diet',
    title: 'How Weight Loss Medications Are Changing Everyday Lives',
    image: '/images/product-card-1.png',
  },
];

export default function BlogPosts() {
  return (
    <section className="bg-primary-dark py-16 md:py-20">
      <div className="max-w-[1320px] mx-auto px-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <h2 className="font-[family-name:var(--font-clearface)] italic font-semibold text-[48px] leading-[52px] tracking-[-1.2px] text-white md:text-[48px] text-[28px] md:leading-[52px] leading-[32px]">
            Recent <em>blog</em> posts
          </h2>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Blog cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {posts.map((post, i) => (
            <div key={i} className="relative rounded-2xl overflow-hidden group min-h-[400px] md:min-h-[500px]">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Category tag */}
              <div className="absolute top-5 left-5">
                <span className="inline-flex px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white text-[16.3px] font-[790] tracking-[-0.32px]">
                  {post.category}
                </span>
              </div>

              {/* Content */}
              <div className="absolute bottom-5 left-5 right-5">
                <h3 className="text-white text-[16.3px] font-[790] tracking-[-0.32px] leading-[19.5px] mb-4">
                  {post.title}
                </h3>
                <Link
                  href="#"
                  className="inline-flex items-center justify-center px-5 py-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white text-[16.3px] font-[790] tracking-[-0.32px] uppercase rounded-lg hover:bg-white/20 transition-colors"
                >
                  Read Blog Post
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/30'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
