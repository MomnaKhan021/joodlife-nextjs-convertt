import Image from "next/image";

/**
 * "Your next steps" — the 3-step timeline shown on the Final Product
 * page (Figma node 1:51). Each step shows an illustration, then a numbered,
 * connected timeline on desktop that stacks to a vertical list on mobile.
 */

const STEPS = [
  {
    n: 1,
    title: "Health assessment",
    body: "Fill out a quick form about your medical background, daily habits, and wellness goals.",
    img: "/assets/figma/hiw-step1.png",
  },
  {
    n: 2,
    title: "Expert review",
    body: "Licensed providers review your info and recommend the best course of action.",
    img: "/assets/figma/hiw-step2.png",
  },
  {
    n: 3,
    title: "Get medication",
    body: "Order affordable medication from vetted pharmacies and trusted brands.",
    img: "/assets/figma/hiw-step3-v2.png",
  },
];

export default function NextSteps() {
  return (
    <section className="w-full bg-white px-6 py-[30px] md:px-10 md:py-10 lg:px-[60px]">
      <div className="mx-auto w-full max-w-[880px] rounded-[20px] border border-[#142e2a]/10 bg-white p-6 md:p-10">
        <h2 className="text-center font-display text-[26px] font-bold leading-[1.1] tracking-[-0.01em] text-[#142e2a] md:text-[34px]">
          Your next{" "}
          <em className="font-serif font-normal italic">steps</em>
        </h2>

        <ol className="relative mt-8 grid grid-cols-1 gap-10 md:mt-12 md:grid-cols-3 md:gap-6">
          {/* Connecting line (desktop) — sits at the number-circle row, i.e.
              below the illustrations (image h-[88px] + mb-4). */}
          <span
            aria-hidden
            className="absolute left-0 right-0 top-[104px] hidden h-px bg-[#142e2a]/15 md:block"
          />
          {STEPS.map((s) => (
            <li key={s.n} className="relative flex flex-col items-center text-center">
              <span className="relative mb-4 h-[88px] w-[88px]">
                <Image
                  src={s.img}
                  alt=""
                  fill
                  sizes="88px"
                  className="object-contain"
                />
              </span>
              <span className="relative z-10 grid h-8 w-8 place-items-center rounded-full bg-[#142e2a] font-ui text-[14px] font-bold text-white">
                {s.n}
              </span>
              <h3 className="mt-4 font-display text-[18px] font-bold text-[#142e2a] md:text-[19px]">
                {s.title}
              </h3>
              <p className="mt-1.5 max-w-[26ch] font-ui text-[13px] leading-[19px] text-[#142e2a]/70">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
