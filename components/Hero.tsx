import Image from 'next/image';

// Figma CDN URLs - extracted from Figma API
const heroBg = "https://s3-alpha-sig.figma.com/img/0128/c350/948ec3e26db65852c6a22cf3047efc14?Expires=1777852800&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=e4cf0MUrDfW7hO2KHV0XQ7iE13bnSs9ckI10GuPZXg-qfVQYfitatJGlY3sc6O36i91T~8Tr93i~D2oryL0Ybj-MB07d-N6FxvjNiPsP~rIQd0Ad71GCNwR6XeOWsfJBey2i1CLtQ-FgL~YHhSS2ZVFH57Lzcazmlo9G47ayw1dUhOAVXIH~yDkEjeYneWd3X1-knkKvG~rFZyR1HPdbq9ZsNr6pdRbj6KqErKAfThh9-RY~Sro0p4-HlZ9ZH8cxv8sffsCWd9A5SlX8FOyqqOsPoZaa~fbY2wlecp7KlLTIo4vIHx7cYb4E2ps7eOlmESVBb6A2RHlRxMSiuXPc0Q__";
const verifyIcon = "https://www.figma.com/api/mcp/asset/75af0110-625d-4cb8-a0b6-8454104b47b5";

export default function Hero() {
  return (
    <section className="relative w-full h-screen bg-cover bg-center overflow-hidden pt-20">
      {/* Background Image */}
      <div className="absolute inset-0 -z-10">
        <Image
          src={heroBg}
          alt="Weight loss journey"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Dark Gradient Overlay */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'linear-gradient(84.71727173079357deg, rgba(29, 29, 29, 0.26) 1.0243%, rgba(0, 0, 0, 0) 97.423%)',
        }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 -z-10 bg-black/20" />

      {/* Content */}
      <div className="max-w-[1440px] mx-auto px-[80px] h-full flex items-center">
        <div className="flex flex-col gap-[40px] w-full max-w-[564px]">
          {/* Stars + Social Proof */}
          <div className="flex items-center gap-[12px]">
            <div className="flex gap-[2px]">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-green-500 text-lg">★</span>
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
              className="text-white text-[56px] leading-[1.1] tracking-[-2.24px]"
              style={{ fontFamily: 'var(--font-gilroy)' }}
            >
              Innovative{' '}
              <span
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontStyle: 'italic',
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
                    className="text-white text-[18px] leading-[27px]"
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
            className="bg-white/30 border border-white rounded-full px-[40px] py-[15px] text-white font-semibold text-[18px] w-fit hover:bg-white/40 transition-colors"
            style={{ fontFamily: 'var(--font-outfit)' }}
          >
            Get started
          </button>
        </div>
      </div>
    </section>
  );
}
