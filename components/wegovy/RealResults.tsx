import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

/**
 * "Real results with Wegovy" — Figma node 1:1948.
 * Two-column: left dark-green stat panel, right lifestyle image with a
 * "Health gains beyond numbers" overlay card.
 */

export default function RealResults() {
  return (
    <section
      aria-label="Real results with Wegovy"
      className="w-full bg-white"
    >
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-5 px-6 py-14 md:px-10 md:py-16 lg:grid-cols-2 lg:px-[60px] lg:py-[80px]">
        {/* Left — solid purple #4a4074 per Figma, carousel image overlay */}
        <Reveal as="div" className="h-full">
          <div className="relative flex h-full min-h-[460px] flex-col justify-between gap-6 overflow-hidden rounded-[24px] bg-[#4a4074] py-10 px-5 md:min-h-[560px]">
            {/* Carousel image — blurred outdoor scene sits on top of purple like Figma */}
            <Image
              src="/assets/wegovy/why-runner.png"
              alt=""
              fill
              aria-hidden
              sizes="(max-width:1024px) 100vw, 50vw"
              className="object-cover object-center opacity-50 mix-blend-luminosity"
            />
            {/* Subtle dark veil so text stays legible */}
            <div className="absolute inset-0 bg-[#4a4074]/40" aria-hidden />

            <h2 className="relative font-display text-[36px] font-semibold leading-[1.1] tracking-[-0.02em] text-white md:text-[48px] md:leading-[52px]">
              Real Results{" "}
              <span className="font-serif italic font-normal">With Wegovy</span>
            </h2>

            {/* ~14% frosted panel */}
            <div className="relative rounded-2xl border border-white/20 bg-white/[0.06] p-5 md:p-6">
              <span className="flex items-center gap-2.5">
                <span className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full bg-white">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect width="24" height="24" rx="5" transform="matrix(1 0 0 -1 0 24)" fill="#142E2A"/>
                    <path d="M19.9981 16.4515L19.6794 13.3137C19.6425 12.9692 19.229 12.8212 18.9919 13.0634L18.2386 13.8331L13.4949 8.98646C13.1973 8.68237 12.6731 8.68237 12.3755 8.98646L9.76262 11.656L5.34815 7.14307C5.19538 6.98699 4.99258 6.90625 4.78976 6.90625C4.58694 6.90625 4.38414 6.98699 4.23137 7.14307C3.9232 7.45793 3.9232 7.96922 4.23137 8.28677L9.20423 13.3675C9.50186 13.6716 10.026 13.6716 10.321 13.3675L12.9365 10.698L17.1218 14.9741L16.2394 15.8756C15.9998 16.1205 16.1446 16.543 16.4818 16.578L19.5529 16.9036C19.8084 16.9332 20.0244 16.7125 19.9981 16.4515Z" fill="white"/>
                  </svg>
                </span>
                <span className="font-ui text-[18px] text-white/85 md:text-[22px]">Up to</span>
              </span>
              <p className="mt-1 font-display text-[80px] font-medium leading-none text-white md:text-[120px] lg:text-[150px]">
                ~14%
              </p>
              <p className="mt-3 font-ui text-[18px] font-semibold text-white/90 md:text-[25px]">
                average body weight loss at 64 weeks*
              </p>
              <p className="mt-3 font-ui text-[11px] leading-[16px] text-white/55">
                *Based on a manufacturer 64-week medical study of 307 adults
                living with obesity, or with overweight and at least one
                weight-related medical problem, along with a reduced-calorie diet
                and increased physical activity. Adults taking Wegovy® Pill lost
                an average of 14% body weight (~33 lb) compared with people taking
                placebo (not on medicine) who lost 2.4% (~6 lb).
              </p>
            </div>

            {/* 1-in-4 frosted panel */}
            <div className="relative flex items-start gap-3 rounded-2xl border border-white/20 bg-white/[0.06] px-5 py-4">
              <span className="mt-0.5 grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full bg-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M22.4 4.4C21.5175 4.4 20.8 5.11752 20.8 6C20.8 6.88248 21.5175 7.6 22.4 7.6C23.2825 7.6 24 6.88248 24 6C24 5.11752 23.2825 4.4 22.4 4.4ZM16.4 3.6C17.0616 3.6 17.6 3.0616 17.6 2.4C17.6 1.7384 17.0616 1.2 16.4 1.2C15.7384 1.2 15.2 1.7384 15.2 2.4C15.2 3.0616 15.7384 3.6 16.4 3.6ZM21.2 2.4C21.8616 2.4 22.4 1.8616 22.4 1.2C22.4 0.5384 21.8616 0 21.2 0C20.5384 0 20 0.5384 20 1.2C20 1.8616 20.5384 2.4 21.2 2.4ZM3.6 18.4C3.6 18.6209 3.42092 18.8 3.2 18.8C2.97908 18.8 2.8 18.6209 2.8 18.4C2.8 18.1791 2.97908 18 3.2 18C3.42092 18 3.6 18.1791 3.6 18.4ZM4.4 22C4.4 22.2209 4.22092 22.4 4 22.4C3.77908 22.4 3.6 22.2209 3.6 22C3.6 21.7791 3.77908 21.6 4 21.6C4.22092 21.6 4.4 21.7791 4.4 22ZM8 18.4C8 18.6209 7.82092 18.8 7.6 18.8C7.37908 18.8 7.2 18.6209 7.2 18.4C7.2 18.1791 7.37908 18 7.6 18C7.82092 18 8 18.1791 8 18.4ZM19.7859 10.7512L13.2484 4.2144C13.111 4.07756 12.9251 4.00051 12.7312 4C12.328 4 12 4.328 12 4.7316C12 4.92672 12.0759 5.1108 12.2141 5.24876L17.0828 10.1172L16.5172 10.6828L12.4 6.56592L11.7656 7.2L13.4828 8.9172L12.9172 9.4828L11.2 7.7656L10.5656 8.4L11.4828 9.3172L10.9172 9.8828L10 8.9656L9.3656 9.6L11.0828 11.3172L10.5172 11.8828L8.8 10.1656L8.1656 10.8L9.0828 11.7172L8.5172 12.2828L7.6 11.3656L6.9656 12L8.6828 13.7172L8.1172 14.2828L6.4 12.5656L5.7656 13.2L6.6828 14.1172L6.1172 14.6828L5.2 13.7656L3.7656 15.2H13.8344L18 11.0344L18.7516 11.7856C18.889 11.9224 19.0749 11.9995 19.2688 12C19.672 12 20 11.672 20 11.2684C20 11.0733 19.9241 10.8897 19.7859 10.7512Z" fill="#142E2A"/>
                  <path d="M1.04236 17.9233C0.37032 18.5955 0 19.4897 0 20.4405C0 22.4031 1.59688 24 3.55952 24C4.51032 24 5.40452 23.6297 6.07672 22.9576L13.0344 16H2.96564L1.04236 17.9233ZM7.6 17.2C8.2616 17.2 8.8 17.7384 8.8 18.4C8.8 19.0616 8.2616 19.6 7.6 19.6C6.9384 19.6 6.4 19.0616 6.4 18.4C6.4 17.7384 6.9384 17.2 7.6 17.2ZM5.2 22C5.2 22.6616 4.6616 23.2 4 23.2C3.3384 23.2 2.8 22.6616 2.8 22C2.8 21.3384 3.3384 20.8 4 20.8C4.6616 20.8 5.2 21.3384 5.2 22ZM4.4 18.4C4.4 19.0616 3.8616 19.6 3.2 19.6C2.5384 19.6 2 19.0616 2 18.4C2 17.7384 2.5384 17.2 3.2 17.2C3.8616 17.2 4.4 17.7384 4.4 18.4Z" fill="#142E2A"/>
                </svg>
              </span>
              <div>
                <p className="font-display text-[18px] font-semibold leading-tight text-white md:text-[22px]">
                  1 in 4 participants
                </p>
                <p className="font-ui text-[22px] font-semibold leading-[1.1] text-white/80 md:text-[34px]">
                  lost 20% or more of their body weight
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Right — image with overlay card */}
        <Reveal as="div" delay={120} className="h-full">
          <div className="relative h-full min-h-[460px] overflow-hidden rounded-[24px] md:min-h-[560px]">
            <Image
              src="/assets/wegovy/results-woman.png"
              alt="Women walking outdoors in a sunlit field"
              fill
              sizes="(max-width:1024px) 100vw, 50vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-x-4 bottom-4 flex items-start gap-3 rounded-2xl bg-[#142e2a]/85 px-5 py-4 backdrop-blur-sm">
              <span className="mt-0.5 grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full bg-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M11.1531 2.08721L11.2221 2.08411C11.2838 2.16686 11.2567 3.59995 11.2567 3.81077V7.16695L11.2569 16.839C11.2569 18.5313 11.2342 20.2743 11.2617 21.9622C9.42034 21.8711 7.68116 20.9177 6.36713 19.6643C5.5332 18.8372 4.79926 17.6324 4.42939 16.5262C2.7668 11.5536 6.1238 3.77665 11.1531 2.08721Z" fill="#142E2A"/>
                  <path d="M19.9288 12.6016C19.9581 12.6328 19.9623 12.6471 19.9661 12.6891C20.1787 15.0421 19.673 17.219 18.1596 19.0664C16.838 20.7064 14.9147 21.7491 12.8192 21.9616L12.7702 21.9479C12.718 21.8302 12.7438 20.0922 12.751 19.8216C12.8378 19.6825 13.2061 19.3307 13.3362 19.201L14.3682 18.1715L18.0465 14.4946L19.2193 13.323C19.4422 13.1007 19.7231 12.8339 19.9288 12.6016Z" fill="#142E2A"/>
                  <path d="M18.881 8.66602L18.9267 8.68313C19.1327 8.9029 19.5468 10.4223 19.6593 10.7974C19.5606 10.9292 19.1665 11.3036 19.0273 11.4424L17.7193 12.7481L13.1361 17.328C12.9666 17.4896 12.9064 17.5544 12.7561 17.7401C12.7501 17.6249 12.7478 17.4966 12.7483 17.3812C12.7522 16.5387 12.7258 15.6865 12.7519 14.845C12.8719 14.646 13.249 14.2946 13.4271 14.118L14.4145 13.1344L18.881 8.66602Z" fill="#142E2A"/>
                  <path d="M16.9054 5.13086C17.1104 5.2161 18.1318 6.88527 18.2623 7.18075C18.1807 7.28959 17.884 7.57366 17.7731 7.68428L16.8175 8.63821L13.4646 11.9921C13.2241 12.2309 12.9794 12.4668 12.7573 12.7225C12.7283 12.2875 12.7453 11.792 12.7433 11.353C12.7402 10.6784 12.7331 9.99435 12.7508 9.3205C12.8527 9.15707 13.8133 8.22522 13.997 8.04208L16.9054 5.13086Z" fill="#142E2A"/>
                  <path d="M12.7474 2.07031C13.4184 2.18993 14.5283 2.87971 15.0787 3.31012C15.3585 3.52891 15.6354 3.787 15.9273 4.0087C15.784 4.19154 15.5063 4.45725 15.3358 4.62754L14.3507 5.61323L13.3829 6.57726C13.1779 6.78042 12.928 7.01186 12.7561 7.2386C12.7241 6.69072 12.7449 5.95757 12.745 5.39229L12.7474 2.07031Z" fill="#142E2A"/>
                </svg>
              </span>
              <div>
                <p className="font-ui text-[18px] font-semibold text-white md:text-[22px]">
                  Health gains beyond numbers
                </p>
                <p className="mt-1 font-ui text-[13px] leading-[19.5px] text-white/80 md:text-[16.3px]">
                  The Wegovy Pill contains semaglutide — the same active
                  ingredient as the injectable Wegovy pen — now in a once-daily
                  oral form. Like the pen, it supports cardiometabolic health
                  alongside weight loss.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
