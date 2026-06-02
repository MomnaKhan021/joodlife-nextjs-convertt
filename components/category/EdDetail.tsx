import Image from "next/image";
import Link from "next/link";

import Reveal from "@/components/ui/Reveal";

/**
 * Erectile-dysfunction section content (Figma Component 290, below the
 * hero):
 *   • treatment card — copy + pill image + CTA
 *   • "What are your goals?" image card + a patient testimonial
 */

const GOALS = [
  "Address erectile difficulties",
  "Improve sexual confidence",
  "All the above",
];

export default function EdDetail() {
  return (
    <div className="flex flex-col gap-5">
      {/* Treatment card */}
      <Reveal
        as="div"
        className="grid items-center gap-6 rounded-[24px] bg-black/12 p-6 backdrop-blur-[20px] md:grid-cols-[1.3fr_auto_auto] md:p-8"
      >
        <p className="max-w-[46ch] font-ui text-[15px] leading-relaxed text-white/90">
          Take control of erectile health safely and discreetly. Clinically approved treatments are
          delivered to your door, helping you regain confidence and performance.
        </p>
        <div className="relative mx-auto h-[120px] w-[180px]">
          <Image
            src="/assets/category/ed-pill.png"
            alt="Clinically approved ED treatment tablet"
            fill
            quality={90}
            sizes="180px"
            className="object-contain"
          />
        </div>
        <Link
          href="/erectile-dysfunction#assessment"
          className="inline-flex h-12 items-center justify-center rounded-lg bg-[#0c2a3a] px-7 font-ui text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-[#08222f] md:justify-self-end"
        >
          Get started
        </Link>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Goals card */}
        <Reveal as="div" className="relative min-h-[300px] overflow-hidden rounded-[24px]">
          <Image
            src="/assets/category/ed-goals.png"
            alt="Man considering his treatment goals"
            fill
            quality={85}
            sizes="(max-width: 1024px) 90vw, 560px"
            className="object-cover"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8">
            <h3 className="font-display text-[24px] font-semibold leading-tight text-white md:text-[28px]">
              What are your goals?
            </h3>
            <ul className="flex flex-col gap-2.5">
              {GOALS.map((g) => (
                <li
                  key={g}
                  className="w-fit rounded-full bg-white/15 px-4 py-2 font-ui text-[13px] font-medium text-white backdrop-blur-sm"
                >
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* Testimonial */}
        <Reveal
          as="div"
          delay={120}
          className="flex min-h-[300px] flex-col items-center justify-center gap-5 rounded-[24px] bg-black/12 p-8 text-center backdrop-blur-[20px]"
        >
          <p className="max-w-[34ch] font-serif text-[20px] font-normal italic leading-snug text-white md:text-[22px]">
            &ldquo;This treatment completely restored my confidence. I no longer worry about
            performance, and I feel in control.&rdquo;
          </p>
          <div className="flex flex-col gap-0.5">
            <span className="font-ui text-[15px] font-semibold text-white">Jordan, 42</span>
            <span className="font-ui text-[13px] text-white/70">2 months completed</span>
          </div>
          <div className="flex gap-1.5" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${i === 0 ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
