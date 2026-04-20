import Image from 'next/image';

const heroBg = "https://www.figma.com/api/mcp/asset/ab4ecfb9-9fae-457e-9814-8162677b3e37";
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
              className="text-white text-[56px] leading-[1.1] tracking-[-2.24px] whitespace-nowrap"
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
