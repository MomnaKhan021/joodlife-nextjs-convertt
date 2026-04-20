export default function Features() {
  const features = [
    {
      icon: '💊',
      title: 'UK Licensed Medication',
      description: 'Clinically proven weight loss medication prescribed by UK registered doctors.',
    },
    {
      icon: '📱',
      title: 'Smart Tracking',
      description: 'Monitor your progress with our intuitive app and detailed analytics.',
    },
    {
      icon: '🚚',
      title: 'Discreet Delivery',
      description: 'Fast, confidential delivery direct to your door with free next-day shipping.',
    },
    {
      icon: '👨‍⚕️',
      title: 'Expert Support',
      description: '24/7 access to our team of weight loss specialists and nutritionists.',
    },
    {
      icon: '📊',
      title: 'Personalized Plans',
      description: 'Customized treatment plans based on your unique health profile.',
    },
    {
      icon: '🔄',
      title: 'Flexible Subscription',
      description: 'No long-term commitment. Cancel anytime if you decide to stop.',
    },
  ];

  return (
    <section className="w-full bg-sage-light py-[80px] px-[80px]">
      <div className="max-w-[1440px] mx-auto">
        <h2
          className="text-[40px] leading-[1.1] tracking-[-1.6px] text-primary mb-[60px] text-center"
          style={{ fontFamily: 'var(--font-gilroy)' }}
        >
          Everything you need
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[40px]">
          {features.map((feature, idx) => (
            <div key={idx} className="flex flex-col gap-[16px]">
              <div className="text-[48px]">{feature.icon}</div>
              <h3
                className="text-[20px] font-semibold text-primary"
                style={{ fontFamily: 'var(--font-outfit)' }}
              >
                {feature.title}
              </h3>
              <p
                className="text-dark-text text-[16px] leading-[1.5]"
                style={{ fontFamily: 'var(--font-outfit)' }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
