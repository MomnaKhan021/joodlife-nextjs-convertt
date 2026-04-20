import Image from 'next/image';

const starsSrc = "https://s3-alpha-sig.figma.com/img/2734/b5a1/bef1bae56770bba951cf6ce5a71eb9bd?Expires=1777852800&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=W~TDkVqlXAJDYG6h4ECoBIWghJaK8WVMfOof7xhjTU3ST-u053AsrdCV0yRug0nBpYpwzErgDzjNoOeBc7voBdAWIQ0VRz39Tvl5mEEhR8pHelRfJd1qAF5hPGJT28uOm30~u9bACitdsdXmcbOeKpco~GMQPBphiU7PMZLbHgZ36x3GVKxYWVsikgqoZXYbVJODQi1QywuJnMwETrrv72FFYllpNBMoe33ax5ndwZCAvNpcUGeXMnv8qBA3Wawv59qBWOyG6m9oEH4Gtj~T8SpKmAPvXbPxLTeM2R5jEIMjFhWNhm2GyjxpriL39i3IAUq1gWIYOl2Few1oiRQrtw__";

const reviewsData = [
  {
    quote: '"Jood Life made my weight loss journey easy and effective. Great support and noticeable results!."',
    name: 'Sarah Johnson',
  },
  {
    quote: '"The personalized approach and expert guidance really made a difference in my weight loss."',
    name: 'Emma Williams',
  },
  {
    quote: '"Incredible results in just 6 months! The team was supportive every step of the way."',
    name: 'Lisa Anderson',
  },
  {
    quote: '"Best decision I made for my health. Highly recommend to anyone serious about weight loss."',
    name: 'Jennifer Davis',
  },
];

export default function Reviews() {
  return (
    <section className="w-full bg-white py-[80px] px-[80px]">
      <div className="max-w-[1440px] mx-auto">
        {/* Heading */}
        <div className="text-center mb-[50px]">
          <h2
            className="text-[40px] leading-[1.1] tracking-[-1.6px] text-primary mb-[16px]"
            style={{ fontFamily: 'var(--font-gilroy)' }}
          >
            10,000+ 5 star{' '}
            <span
              style={{
                fontFamily: 'var(--font-playfair)',
                fontStyle: 'italic',
              }}
            >
              reviews
            </span>
          </h2>
          <p
            className="text-dark-text text-[18px] leading-[1.5] max-w-[846px] mx-auto"
            style={{ fontFamily: 'var(--font-outfit)' }}
          >
            Our dedicated care team provides ongoing guidance, progress monitoring, and personalized
            adjustments to ensure every patient achieves lasting results.
          </p>
        </div>

        {/* Reviews Grid - 4 columns on desktop, responsive on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[16px] mb-[30px]">
          {reviewsData.map((review, idx) => (
            <div
              key={idx}
              className="bg-cream rounded-[4px] p-[32px] flex flex-col gap-[24px] cursor-pointer hover:shadow-lg transition-shadow"
            >
              {/* Stars */}
              <div className="w-[116px] h-[18.889px] relative">
                <Image
                  src={starsSrc}
                  alt="5 stars"
                  fill
                  className="object-contain"
                />
              </div>

              {/* Quote */}
              <p
                className="text-dark-text text-[18px] leading-[1.5]"
                style={{ fontFamily: 'var(--font-outfit)' }}
              >
                {review.quote}
              </p>

              {/* Author */}
              <p
                className="text-dark-text text-[18px] leading-[1.5] font-medium"
                style={{ fontFamily: 'var(--font-outfit)' }}
              >
                {review.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
