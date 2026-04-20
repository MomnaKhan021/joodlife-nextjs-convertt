import Image from 'next/image';

const starsSrc = "https://s3-alpha-sig.figma.com/img/2734/b5a1/bef1bae56770bba951cf6ce5a71eb9bd?Expires=1777852800&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=W~TDkVqlXAJDYG6h4ECoBIWghJaK8WVMfOof7xhjTU3ST-u053AsrdCV0yRug0nBpYpwzErgDzjNoOeBc7voBdAWIQ0VRz39Tvl5mEEhR8pHelRfJd1qAF5hPGJT28uOm30~u9bACitdsdXmcbOeKpco~GMQPBphiU7PMZLbHgZ36x3GVKxYWVsikgqoZXYbVJODQi1QywuJnMwETrrv72FFYllpNBMoe33ax5ndwZCAvNpcUGeXMnv8qBA3Wawv59qBWOyG6m9oEH4Gtj~T8SpKmAPvXbPxLTeM2R5jEIMjFhWNhm2GyjxpriL39i3IAUq1gWIYOl2Few1oiRQrtw__";

const reviewsData = [
  {
    quote: 'Jood Life made my weight loss journey easy and effective. Great support and noticeable results!',
    name: 'Sarah Johnson',
  },
  {
    quote: 'The personalized approach and expert guidance really made a difference in my weight loss.',
    name: 'Emma Williams',
  },
  {
    quote: 'Incredible results in just 6 months! The team was supportive every step of the way.',
    name: 'Lisa Anderson',
  },
  {
    quote: 'Best decision I made for my health. Highly recommend to anyone serious about weight loss.',
    name: 'Jennifer Davis',
  },
  {
    quote: 'The medication combined with coaching transformed my relationship with food and health.',
    name: 'Michael Chen',
  },
  {
    quote: 'Finally found something that works! The support team is incredibly responsive and caring.',
    name: 'Rachel Thompson',
  },
];

export default function Reviews() {
  return (
    <section className="w-full bg-white py-[80px] px-[20px] md:px-[80px]">
      <div className="max-w-[1440px] mx-auto">
        {/* Heading */}
        <div className="text-center mb-[60px]">
          <h2
            className="text-[32px] md:text-[40px] leading-[1.2] tracking-[-1.6px] text-primary mb-[16px]"
            style={{ fontFamily: 'var(--font-gilroy)' }}
          >
            Everyone's talking about Jood Life{' '}
            <span
              style={{
                fontFamily: 'var(--font-playfair)',
                fontStyle: 'italic',
              }}
            >
              because it works
            </span>
          </h2>
          <p
            className="text-dark-text text-[16px] md:text-[18px] leading-[1.5] max-w-[846px] mx-auto"
            style={{ fontFamily: 'var(--font-outfit)' }}
          >
            Join thousands of people who have achieved real results. Our patients consistently report life-changing transformations with sustained weight loss and improved health.
          </p>
        </div>

        {/* Reviews Grid - 6 columns on desktop, responsive on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px] md:gap-[24px]">
          {reviewsData.map((review, idx) => (
            <div
              key={idx}
              className="bg-cream rounded-[12px] p-[28px] md:p-[32px] flex flex-col gap-[16px] border border-sage/10 hover:border-sage/30 hover:shadow-md transition-all duration-300"
            >
              {/* Stars */}
              <div className="w-[100px] h-[18px] relative">
                <Image
                  src={starsSrc}
                  alt="5 stars"
                  fill
                  className="object-contain"
                />
              </div>

              {/* Quote */}
              <p
                className="text-dark-text text-[16px] md:text-[16px] leading-[1.6] flex-grow"
                style={{ fontFamily: 'var(--font-outfit)' }}
              >
                "{review.quote}"
              </p>

              {/* Author */}
              <div>
                <p
                  className="text-dark-text text-[16px] leading-[1.5] font-semibold"
                  style={{ fontFamily: 'var(--font-outfit)' }}
                >
                  {review.name}
                </p>
                <p
                  className="text-sage text-[14px] font-medium"
                  style={{ fontFamily: 'var(--font-outfit)' }}
                >
                  Verified Patient
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
