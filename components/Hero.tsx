import Image from 'next/image';

// Figma CDN URLs - extracted from Figma API
const heroBg = "https://s3-alpha-sig.figma.com/img/0128/c350/948ec3e26db65852c6a22cf3047efc14?Expires=1777852800&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=e4cf0MUrDfW7hO2KHV0XQ7iE13bnSs9ckI10GuPZXg-qfVQYfitatJGlY3sc6O36i91T~8Tr93i~D2oryL0Ybj-MB07d-N6FxvjNiPsP~rIQd0Ad71GCNwR6XeOWsfJBey2i1CLtQ-FgL~YHhSS2ZVFH57Lzcazmlo9G47ayw1dUhOAVXIH~yDkEjeYneWd3X1-knkKvG~rFZyR1HPdbq9ZsNr6pdRbj6KqErKAfThh9-RY~Sro0p4-HlZ9ZH8cxv8sffsCWd9A5SlX8FOyqqOsPoZaa~fbY2wlecp7KlLTIo4vIHx7cYb4E2ps7eOlmESVBb6A2RHlRxMSiuXPc0Q__";
const verifyIcon = "https://s3-alpha-sig.figma.com/img/1332/c477/cae928dd8b08e7669a702d7691775859?Expires=1777852800&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=kCrNYb4fm6vsd444lb1bNH5yCZTUJoLGEy2QRES7y~qbe6AFiqZG97thAXzOVtMCPlpIEmSrLxAZQJcSnbKJvjU-dtQ5Rp4-heNXMh0xKE2ws1rKAlpahtg1Gz15QSnBot92yjU4CThrgx6gJptnKWEE~xifzjwDgjJWJPNAMWQASnakw5mKEIV9eiOf0uszYH0lVJeH8wqZ4s0cmKMObVseuc4X372rDKbBQuTQ4LdFrsKhnJwN5f8gQ7adytMvAQ1Vu~9mu0zdYknNZP6rAibXw-cbMF64i8CaPiQ5qYGwDpZALzBX~AKjL6s3arzoS9zKNoK6SUC00~5eOAv4gQ__";

export default function Hero() {
  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      {/* Background Image - Layer 1 */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <Image
          src={heroBg}
          alt="Weight loss journey"
          fill
          className="object-cover w-full h-full"
          priority
          quality={100}
          sizes="100vw"
        />
      </div>

      {/* Dark Overlay - Layer 2 (STRONG OVERLAY for contrast - 65% opacity) */}
      <div className="absolute inset-0 z-10 bg-black/65" />

      {/* Dark Gradient Overlay - Layer 2.5 (Additional gradient for depth) */}
      <div
        className="absolute inset-0 z-10"
        style={{
          backgroundImage:
            'linear-gradient(135deg, rgba(12, 36, 33, 0.4) 0%, rgba(0, 0, 0, 0.3) 100%)',
        }}
      />

      {/* Content Container - Layer 3 (ABOVE overlays) */}
      <div className="relative z-20 h-full flex items-center">
        <div className="max-w-[1440px] mx-auto px-[80px] w-full">
          <div className="flex flex-col gap-[40px] max-w-[564px]">
            {/* Stars + Social Proof */}
            <div className="flex items-center gap-[12px]">
              <div className="flex gap-[2px]">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-sage text-lg font-bold">★</span>
                ))}
              </div>
              <span
                className="text-white font-normal text-[16px]"
                style={{ fontFamily: 'var(--font-outfit)' }}
              >
                <strong>3K+</strong> happy customers
              </span>
            </div>

            {/* Main Headline */}
            <div className="flex flex-col gap-[19px]">
              <h1
                className="text-white text-[56px] leading-[1.1] tracking-[-2.24px] font-bold"
                style={{ fontFamily: 'var(--font-gilroy)' }}
              >
                Innovative{' '}
                <span
                  className="text-white font-bold"
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    fontStyle: 'italic',
                    fontWeight: '700',
                  }}
                >
                  weight loss,
                </span>{' '}
                made just for you.
              </h1>

              {/* Bullet Points */}
              <div className="flex flex-col gap-[15px] pt-[20px]">
                {[
                  'Lose up to 27% body weight',
                  'Guidance for lasting results',
                  'Plans tailored to you',
                ].map((bullet, idx) => (
                  <div key={idx} className="flex items-center gap-[15px]">
                    <div className="w-[24px] h-[24px] relative flex-shrink-0">
                      <Image
                        src={verifyIcon}
                        alt="Check"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span
                      className="text-white text-[18px] leading-[27px] font-normal"
                      style={{ fontFamily: 'var(--font-outfit)' }}
                    >
                      {bullet}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <button
              className="bg-white/30 border-2 border-white rounded-full px-[40px] py-[15px] text-white font-semibold text-[18px] w-fit hover:bg-white/40 transition-colors duration-300 backdrop-blur-sm"
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              Get started
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
