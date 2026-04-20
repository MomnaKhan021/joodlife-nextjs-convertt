import Image from 'next/image';

const cliniciansIcon = "https://www.figma.com/api/mcp/asset/d1999b1f-d8b2-46bd-97e2-86a09f62eb0b";
const deliveryIcon = "https://www.figma.com/api/mcp/asset/0fe33594-f396-4330-b257-6f9b8c0ecc93";
const timeIcon = "https://www.figma.com/api/mcp/asset/dbabf05e-7832-400a-a876-7a1f7e30c5e4";
const supportIcon = "https://www.figma.com/api/mcp/asset/6c3e639e-e809-4661-8b3d-b2c46dd6d99c";

const uspItems = [
  { icon: cliniciansIcon, text: 'UK Licensed medication' },
  { icon: cliniciansIcon, text: 'Clinically proven' },
  { icon: deliveryIcon, text: 'Free next-day delivery' },
  { icon: timeIcon, text: 'Cancel anytime subscription' },
  { icon: supportIcon, text: 'Ongoing medical support' },
];

export default function UspBar() {
  // Duplicate items for infinite scroll effect
  const items = [...uspItems, ...uspItems];

  return (
    <section
      className="relative w-full h-[64px] bg-sage overflow-hidden"
    >
      {/* Marquee Container */}
      <div className="flex items-center h-full animate-marquee gap-[65px] px-[65px]">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-[12px] whitespace-nowrap flex-shrink-0"
          >
            <div className="w-[32.4px] h-[32.4px] relative">
              <Image
                src={item.icon}
                alt={item.text}
                fill
                className="object-contain"
              />
            </div>
            <span
              className="text-white font-medium text-[16px]"
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
