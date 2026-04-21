import Image from "next/image";

type Item = { icon: string; label: string };

const ITEMS: Item[] = [
  { icon: "/assets/icons/usp-clinicians.svg", label: "UK Licensed medication" },
  { icon: "/assets/icons/usp-clinicians.svg", label: "24-Hour WhatsApp support" },
  { icon: "/assets/icons/usp-delivery.svg", label: "Free next-day delivery" },
  { icon: "/assets/icons/usp-time.svg", label: "Cancel anytime subscription" },
  { icon: "/assets/icons/usp-support.svg", label: "Ongoing medical support" },
];

function Row() {
  return (
    <>
      {ITEMS.map((item, i) => (
        <li
          key={i}
          className="flex shrink-0 items-center gap-3 pr-[65px]"
        >
          <Image
            src={item.icon}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0"
            aria-hidden
          />
          <span className="whitespace-nowrap font-ui text-[16.3px] leading-[20px] text-[#3d3838]">
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
