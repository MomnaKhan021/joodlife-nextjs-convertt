export default function ExpertGuidance() {
  return (
    <section className="w-full bg-white py-[80px] px-[80px]">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[60px] items-center">
          <div className="flex flex-col gap-[30px]">
            <h2
              className="text-[40px] leading-[1.1] tracking-[-1.6px] text-primary"
              style={{ fontFamily: 'var(--font-gilroy)' }}
            >
              Continuous Expert Guidance
            </h2>
            <p
              className="text-dark-text text-[18px] leading-[1.5]"
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              Our dedicated team of UK licensed clinicians provides ongoing support and adjustments to ensure your weight loss journey is successful and sustainable.
            </p>
            <ul className="flex flex-col gap-[15px]">
              {[
                'Weekly check-ins with your care team',
                'Personalized treatment adjustments',
                'Nutritional guidance and meal planning',
                'Behavioral support and motivation',
              ].map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-[12px]"
                >
                  <span className="text-sage text-[20px] mt-1">✓</span>
                  <span
                    className="text-dark-text text-[16px]"
                    style={{ fontFamily: 'var(--font-outfit)' }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-sage-light rounded-[16px] h-[400px] flex items-center justify-center">
            <p
              className="text-primary text-[18px]"
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              [Expert Guidance Image]
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
