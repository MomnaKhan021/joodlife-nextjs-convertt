'use client';

import Image from 'next/image';

const trustItems = [
  { icon: '/icons/usp-clinicians.svg', text: 'UK Licensed medication' },
  { icon: '/icons/usp-support.svg', text: '24-Hour WhatsApp support' },
  { icon: '/icons/usp-delivery-2.svg', text: 'Free next-day delivery' },
  { icon: '/icons/usp-time.svg', text: 'Cancel anytime subscription' },
  { icon: '/icons/usp-clinicians-2.svg', text: 'Ongoing medical support' },
];

export default function TrustBar() {
  return (
    <section className="bg-white py-5 border-y border-gray-100 overflow-hidden">
      <div className="flex animate-scroll">
        {[...trustItems, ...trustItems].map((item, i) => (
          <div key={i} className="flex items-center gap-3 shrink-0 px-8">
            <Image src={item.icon} alt="" width={32} height={32} />
            <span className="text-[16px] font-[500] tracking-[-0.16px] text-primary whitespace-nowrap font-[family-name:var(--font-saans)]">
              {item.text}
            </span>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
