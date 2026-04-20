export default function BlogPosts() {
  const posts = [
    {
      category: 'Nutrition',
      title: '5 Essential Tips for Sustainable Weight Loss',
      date: 'Mar 15, 2025',
      image: '📝',
    },
    {
      category: 'Wellness',
      title: 'The Role of Exercise in Your Weight Loss Journey',
      date: 'Mar 12, 2025',
      image: '💪',
    },
    {
      category: 'Health',
      title: 'Understanding BMI and Your Health Metrics',
      date: 'Mar 10, 2025',
      image: '📊',
    },
  ];

  return (
    <section className="w-full bg-white py-[80px] px-[80px]">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex justify-between items-center mb-[60px]">
          <h2
            className="text-[40px] leading-[1.1] tracking-[-1.6px] text-primary"
            style={{ fontFamily: 'var(--font-gilroy)' }}
          >
            Recent blog posts
          </h2>
          <div className="flex gap-[12px]">
            <button className="w-[40px] h-[40px] rounded-full border border-primary text-primary hover:bg-cream transition-colors">
              ←
            </button>
            <button className="w-[40px] h-[40px] rounded-full border border-primary text-primary hover:bg-cream transition-colors">
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[40px]">
          {posts.map((post, idx) => (
            <article
              key={idx}
              className="rounded-[12px] overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="bg-sage-light h-[250px] flex items-center justify-center text-[80px]">
                {post.image}
              </div>

              <div className="bg-white p-[24px] flex flex-col gap-[16px]">
                <div className="flex items-center justify-between">
                  <span
                    className="text-sage text-[14px] font-semibold uppercase tracking-[1px]"
                    style={{ fontFamily: 'var(--font-outfit)' }}
                  >
                    {post.category}
                  </span>
                  <span
                    className="text-dark-text text-[14px]"
                    style={{ fontFamily: 'var(--font-outfit)' }}
                  >
                    {post.date}
                  </span>
                </div>

                <h3
                  className="text-primary text-[20px] font-semibold leading-[1.3]"
                  style={{ fontFamily: 'var(--font-outfit)' }}
                >
                  {post.title}
                </h3>

                <button
                  className="text-sage font-semibold text-[14px] hover:text-primary transition-colors text-left"
                  style={{ fontFamily: 'var(--font-outfit)' }}
                >
                  Read More →
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
