import Image from "next/image";

type Item = { icon: string; label: string };

// Mapped to the 5 Figma items in the Upsell Bar (Component 139):
//  1. UK Licensed medication   → usp-licensed (person in circle)
//  2. 24-Hour WhatsApp support → usp-whatsapp (24/7 dashed circle)
//  3. Free next-day delivery   → usp-delivery (package box)
//  4. Cancel anytime           → usp-cancel (clock)
//  5. Ongoing medical support  → usp-support (chat bubble)
const ITEMS: Item[] = [
  { icon: "/assets/figma/usp-licensed.svg", label: "UK Licensed medication" },
  { icon: "/assets/figma/usp-whatsapp.svg", label: "24-Hour WhatsApp support" },
  { icon: "/assets/figma/usp-delivery.svg", label: "Free next-day delivery" },
  { icon: "/assets/figma/usp-cancel.svg", label: "Cancel anytime subscription" },
  { icon: "/assets/figma/usp-support.svg", label: "Ongoing medical support" },
];

function Row() {
  return (
    <>
      {ITEMS.map((item, i) => (
        <li key={i} className="flex shrink-0 items-center gap-3 pr-14">
          <Image
            src={item.icon}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0"
            aria-hidden
          />
          <span className="whitespace-nowrap font-ui text-[16.3px] font-semibold leading-[19.5px] tracking-[-0.02em] text-[#142e2a]">
            {item.label}
          </span>
        </li>
      ))}
    </>
  );
}

export default function UspStrip() {
  return (
    <section
      aria-label="USP marquee"
      className="w-full overflow-hidden border-b border-[#142e2a]/10 bg-white py-4"
    >
      <div className="group relative flex">
        <ul
          className="flex animate-marquee items-center"
          style={{ animationDuration: "30s" }}
        >
          <Row />
          <Row />
        </ul>
        <ul
          aria-hidden
          className="flex animate-marquee items-center"
          style={{ animationDuration: "30s" }}
        >
          <Row />
          <Row />
        </ul>
      </div>
    </section>
  );
}
