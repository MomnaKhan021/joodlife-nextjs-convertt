import Image from "next/image";

type Item = { icon: string; title: string; copy: string };

const ITEMS: Item[] = [
  {
    icon: "/assets/icons/usp-clinicians.svg",
    title: "Ongoing clinical support",
    copy: "Talk to experienced medical professionals whenever you need.",
  },
  {
    icon: "/assets/icons/usp-time.svg",
    title: "Pause or cancel any time",
    copy: "You're always in control of your treatment.",
  },
  {
    icon: "/assets/icons/usp-support.svg",
    title: "Clinical support",
    copy: "Access expert clinicians and medical advice.",
  },
  {
    icon: "/assets/icons/usp-delivery.svg",
    title: "Free, discreet delivery",
    copy: "No names, no logos, no delivery fee.",
  },
];

export default function TrustBar() {
  return (
    <section
      aria-label="Trust and benefits"
      className="w-full bg-white"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-20 pt-[30px] pb-[10px]">
        <ul className="flex flex-col md:flex-row md:items-center md:justify-center md:gap-0 gap-6">
          {ITEMS.map((item, i) => (
            <li
              key={item.title}
              className="flex md:flex-1 md:max-w-[295px] items-start gap-4"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#21346e]">
                <Image
                  src={item.icon}
                  alt=""
                  width={25}
                  height={25}
                  className="h-[25px] w-[25px]"
                  aria-hidden
                />
              </div>
              <div className="flex flex-col gap-[6px]">
                <p className="font-sofia text-[18px] leading-[18px] font-medium text-[#21346e]">
                  {item.title}
                </p>
                <p className="font-outfit text-[16px] leading-[20px] font-medium text-[#21346e]/80">
                  {item.copy}
                </p>
              </div>
              {i < ITEMS.length - 1 && (
                <span
                  aria-hidden
                  className="hidden md:block ml-auto h-16 w-px bg-[#d9d9d9]"
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
