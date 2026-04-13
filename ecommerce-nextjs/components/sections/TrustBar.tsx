import Image from 'next/image';

const trustItems = [
  { icon: '/icons/usp-clinicians.svg', text: 'UK Licensed medication' },
  { icon: '/icons/usp-support.svg', text: '24-Hour WhatsApp support' },
  { icon: '/icons/usp-delivery-2.svg', text: 'Free next-day delivery' },
  { icon: '/icons/usp-time.svg', text: 'Cancel anytime subscription' },
  { icon: '/icons/usp-clinicians-2.svg', text: 'Ongoing medical support' },
];

export default function TrustBar() {
  const items = [...trustItems, ...trustItems, ...trustItems];

  return (
    <section className="bg-white py-4 border-y border-gray-100 overflow-hidden">
      <div className="marquee-track flex">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 shrink-0 px-8">
            <Image src={item.icon} alt="" width={32} height={32} className="shrink-0" />
            <span className="text-[16px] font-[500] tracking-[-0.16px] text-primary whitespace-nowrap">
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
