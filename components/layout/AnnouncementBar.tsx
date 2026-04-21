import Image from "next/image";

export default function AnnouncementBar() {
  return (
    <div className="w-full bg-[#142e2a] text-white">
      {/* Desktop: 42px tall, padded horizontally */}
      <div className="hidden md:flex mx-auto h-[42px] w-full max-w-[1440px] items-center justify-between px-10 lg:px-20">
        <span className="w-[65px]" aria-hidden />
        <div className="flex items-center gap-[7px]">
          <Image
            src="/assets/icons/icon-ticket.svg"
            alt=""
            width={18}
            height={18}
            className="h-[18px] w-[18px]"
            aria-hidden
          />
          <p className="font-outfit text-[13px] leading-[16.9px] text-white">
            Limited-Time Offer: Buy 1 Month, Get 1 Month FREE!
          </p>
        </div>
        <a
          href="#faq"
          className="font-outfit text-[13px] leading-[16.9px] text-white underline-offset-2 hover:underline"
        >
          Help
        </a>
      </div>

      {/* Mobile: 36px tall, centered content */}
      <div className="flex md:hidden mx-auto h-[36px] w-full items-center justify-center px-4">
        <div className="flex items-center gap-[7px]">
          <Image
            src="/assets/icons/icon-ticket.svg"
            alt=""
            width={18}
            height={18}
            className="h-[18px] w-[18px]"
            aria-hidden
          />
          <p className="font-outfit text-[12px] leading-[16px] text-white">
            Limited-Time Offer: Buy 1 Month, Get 1 Month FREE!
          </p>
        </div>
      </div>
    </div>
  );
}
