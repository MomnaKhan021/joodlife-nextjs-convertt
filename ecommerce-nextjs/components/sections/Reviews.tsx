import Image from 'next/image';

const reviews = [
  {
    initials: 'HC',
    name: 'Hayley Churchyard',
    text: 'My medication always arrives well packaged and promptly and I don\'t have to answer hundreds of questions to receive it',
  },
  {
    initials: 'GR',
    name: 'Gillian Rhodes',
    text: 'Always helpful and understanding. I did find it difficult to order at first but soon got the hang of it I am a bit of a dinosaur when it comes to technology! Brilliant company ordered then collect fr...',
  },
  {
    initials: 'JR',
    name: 'Jacqueline Riley',
    text: "I've had a fantastic experience with Jood life, quick service support on hand 24/7, reasonable prices and no pressure to constantly buy injections.",
  },
  {
    initials: 'MI',
    name: 'Mike',
    text: 'For me personally it\'s perfect. I started at around 161kg (25st plus) I\'m currently at 122kg (19.2st) in 9 months in to a 2 year program. My life has changed completely, my health is loads better...',
  },
];

export default function Reviews() {
  return (
    <section id="reviews" className="bg-white py-16 md:py-20">
      <div className="max-w-[1320px] mx-auto px-5">
        {/* Trustpilot badge */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-accent-green text-lg">&#9733;</span>
          <Image src="/icons/trustpilot-logo.svg" alt="Trustpilot" width={80} height={20} />
          <Image src="/icons/trustpilot-stars.svg" alt="4.4 stars" width={86} height={16} />
          <span className="text-[18px] font-normal text-primary underline">
            4.4 <span className="text-sm">(50+) Reviews</span>
          </span>
        </div>

        {/* Heading */}
        <h2 className="text-center font-[family-name:var(--font-gilroy)] font-semibold text-[48px] leading-[52px] tracking-[-1.2px] text-primary mb-4 md:text-[48px] text-[32px] md:leading-[52px] leading-[36px]">
          3000+ happy <em className="font-[family-name:var(--font-clearface)] italic font-normal">customers</em>
        </h2>

        {/* Subtitle */}
        <p className="text-center text-[16.3px] font-[380] tracking-[-0.32px] leading-[19.5px] text-primary max-w-2xl mx-auto mb-10">
          Thousands have trusted Jood for safe, clinically guided weight-loss care. Our patients value the expert support,
          clear communication, and lasting results that make every journey unique.
        </p>

        {/* Review cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {reviews.map((review) => (
            <div key={review.name} className="bg-bg-card rounded-2xl p-6 flex flex-col">
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect width="20" height="20" fill="#00B67A" />
                    <path d="M10 2.5l2 4.2 4.5.6-3.3 3.2.8 4.5L10 12.6 5.9 15l.8-4.5L3.5 7.3l4.5-.6z" fill="white" />
                  </svg>
                ))}
              </div>

              {/* Review text */}
              <p className="text-[16.3px] font-[380] tracking-[-0.32px] leading-[19.5px] text-gray-review flex-1 mb-6">
                {review.text}
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-primary">
                  {review.initials}
                </div>
                <div>
                  <p className="text-[16px] font-[570] tracking-[-0.32px] leading-[19px] text-primary">{review.name}</p>
                  <p className="text-[12px] font-[380] tracking-[-0.2px] text-primary flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="6" r="5.5" stroke="#00B67A" />
                      <path d="M4 6l1.5 1.5L8 5" stroke="#00B67A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Verified
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
