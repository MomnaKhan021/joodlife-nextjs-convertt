import Image from "next/image";

export default function AnnouncementBar() {
  return (
    <div className="w-full bg-[#142e2a] text-white">
      {/* Desktop: 44px tall, padded horizontally */}
      <div className="hidden md:flex mx-auto h-11 w-full max-w-[1440px] items-center justify-center px-10 lg:px-20">
        <div className="flex items-center gap-1.5">
          <Image
            src="/assets/icons/icon-ticket.svg"
            alt=""
            width={18}
            height={18}
            className="h-[18px] w-[18px] flex-shrink-0"
            aria-hidden
          />
          <p className="font-outfit text-sm leading-snug text-white">
            Limited-Time Offer: Buy 1 Month, Get 1 Month FREE!
          </p>
        </div>
      </div>

      {/* Mobile: 40px tall, centered content */}
      <div className="flex md:hidden mx-auto h-10 w-full items-center justify-center px-4">
        <div className="flex items-center gap-1.5">
          <Image
            src="/assets/icons/icon-ticket.svg"
            alt=""
            width={18}
            height={18}
            className="h-[18px] w-[18px] flex-shrink-0"
            aria-hidden
          />
          <p className="font-outfit text-sm leading-snug text-white">
            Limited-Time Offer: Buy 1 Month, Get 1 Month FREE!
          </p>
        </div>
      </div>
    </div>
  );
}
