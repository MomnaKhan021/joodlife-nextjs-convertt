export default function WhatToExpect() {
  const steps = [
    {
      number: '1',
      title: 'Initial Consultation',
      description: 'Connect with our medical team to understand your goals and medical history.',
    },
    {
      number: '2',
      title: 'Personalized Plan',
      description: 'Receive a customized weight loss plan tailored to your unique needs.',
    },
    {
      number: '3',
      title: 'Weekly Support',
      description: 'Get ongoing guidance and adjustments to ensure you stay on track.',
    },
    {
      number: '4',
      title: 'Transform',
      description: 'Achieve lasting weight loss with our comprehensive support system.',
    },
  ];

  return (
    <section className="w-full bg-cream py-[80px] px-[80px]">
      <div className="max-w-[1440px] mx-auto">
        <h2
          className="text-[40px] leading-[1.1] tracking-[-1.6px] text-primary mb-[60px] text-center"
          style={{ fontFamily: 'var(--font-gilroy)' }}
        >
          What to expect in your first month
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[30px]">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col gap-[20px]">
              <div
                className="text-[60px] font-bold text-sage leading-none"
                style={{ fontFamily: 'var(--font-gilroy)' }}
              >
                {step.number}
              </div>
              <div>
                <h3
                  className="text-[20px] font-semibold text-primary mb-[10px]"
                  style={{ fontFamily: 'var(--font-outfit)' }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-dark-text text-[16px] leading-[1.5]"
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
