import Image from 'next/image';

const trustItems = [
  { icon: '/icons/usp-clinicians.svg', text: 'UK Licensed medication' },
  { icon: '/icons/usp-support.svg', text: '24-Hour WhatsApp support' },
  { icon: '/icons/usp-delivery-2.svg', text: 'Free next-day delivery' },
  { icon: '/icons/usp-time.svg', text: 'Cancel anytime subscription' },
  { icon: '/icons/usp-clinicians-2.svg', text: 'Ongoing medical support' },
];

export default function TrustBar() {
  // Triple the items for seamless infinite scroll
  const items = [...trustItems, ...trustItems, ...trustItems];

  return (
    <section
      className="bg-white overflow-hidden"
      style={{
        borderTop: '1px solid rgba(20, 46, 42, 0.2)',
        borderBottom: '1px solid rgba(20, 46, 42, 0.2)',
        padding: '16px 0',
      }}
    >
      <div className="marquee-track flex">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 shrink-0 px-6 md:px-8">
            <Image src={item.icon} alt="" width={32} height={32} className="shrink-0" />
            <span
              className="whitespace-nowrap font-[family-name:var(--font-saans)]"
              style={{ fontSize: '16.3px', fontWeight: 380, letterSpacing: '-0.32px', color: '#3D3838' }}
            >
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
