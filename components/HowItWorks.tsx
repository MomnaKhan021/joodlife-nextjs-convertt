export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Book a Consultation',
      description: 'Start with a free consultation with one of our healthcare professionals.',
    },
    {
      number: '02',
      title: 'Medical Assessment',
      description: 'We assess your health profile and weight loss goals in detail.',
    },
    {
      number: '03',
      title: 'Receive Medication',
      description: 'Get your personalized prescription delivered discreetly to your home.',
    },
    {
      number: '04',
      title: 'Begin Your Journey',
      description: 'Start your weight loss journey with ongoing expert support.',
    },
  ];

  return (
    <section className="w-full bg-white py-[80px] px-[80px]">
      <div className="max-w-[1440px] mx-auto">
        <h2
          className="text-[40px] leading-[1.1] tracking-[-1.6px] text-primary mb-[80px] text-center"
          style={{ fontFamily: 'var(--font-gilroy)' }}
        >
          How it works
        </h2>

        <div className="flex flex-col gap-[60px]">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-[50px]">
              <div
                className="text-[80px] font-bold text-sage flex-shrink-0 w-[120px]"
                style={{ fontFamily: 'var(--font-gilroy)' }}
              >
                {step.number}
              </div>

              <div className="flex-1">
                <h3
                  className="text-[28px] font-semibold text-primary mb-[12px]"
                  style={{ fontFamily: 'var(--font-outfit)' }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-dark-text text-[18px] leading-[1.5]"
                  style={{ fontFamily: 'var(--font-outfit)' }}
                >
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
