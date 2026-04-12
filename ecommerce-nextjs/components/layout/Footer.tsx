import Image from 'next/image';
import Link from 'next/link';

const footerLinks = {
  jood: ['Log in', 'Treatments', 'How it work', 'Library', 'Support'],
  treatments: ['Mounjaro', 'Wegovy', 'Saxenda'],
  policy: ['Terms & conditions', 'Refund & Complaints Procedure', 'Cookies policy'],
};

export default function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="max-w-[1320px] mx-auto px-5 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          {/* Logo & nav */}
          <div className="md:col-span-2">
            <Image src="/icons/jood-logo.svg" alt="JOOD" width={95} height={30} className="brightness-0 invert mb-6" />
            <nav className="flex flex-col gap-2">
              {footerLinks.jood.map((link) => (
                <Link key={link} href="#" className="text-[16.3px] font-[380] tracking-[-0.32px] text-white/80 hover:text-white transition-colors">
                  {link}
                </Link>
              ))}
            </nav>
          </div>

          {/* Treatments */}
          <div className="md:col-span-2">
            <h4 className="text-[16.3px] font-[790] tracking-[-0.32px] mb-4">Treatments</h4>
            <nav className="flex flex-col gap-2">
              {footerLinks.treatments.map((link) => (
                <Link key={link} href="#" className="text-[16.3px] font-[380] tracking-[-0.32px] text-white/80 hover:text-white transition-colors">
                  {link}
                </Link>
              ))}
            </nav>
          </div>

          {/* Policy */}
          <div className="md:col-span-2">
            <h4 className="text-[16.3px] font-[790] tracking-[-0.32px] mb-4">Policy</h4>
            <nav className="flex flex-col gap-2">
              {footerLinks.policy.map((link) => (
                <Link key={link} href="#" className="text-[16.3px] font-[380] tracking-[-0.32px] text-white/80 hover:text-white transition-colors">
                  {link}
                </Link>
              ))}
            </nav>
          </div>

          {/* Follow */}
          <div className="md:col-span-2">
            <h4 className="text-[16.3px] font-[790] tracking-[-0.32px] mb-4">Follow</h4>
            <div className="flex gap-3">
              <Link href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Image src="/icons/social-tiktok.svg" alt="TikTok" width={13} height={13} className="brightness-0 invert" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Image src="/icons/social-facebook.svg" alt="Facebook" width={7} height={13} className="brightness-0 invert" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Image src="/icons/social-instagram.svg" alt="Instagram" width={14} height={14} className="brightness-0 invert" />
              </Link>
            </div>
          </div>

          {/* Contact card */}
          <div className="md:col-span-4">
            <div className="bg-white rounded-2xl p-6 text-primary">
              <h4 className="font-[family-name:var(--font-outfit)] font-[500] text-[24px] leading-[28px] text-primary mb-4">
                Have a question?
              </h4>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Image src="/icons/icon-chat.svg" alt="" width={16} height={16} />
                  <span className="font-[family-name:var(--font-outfit)] font-[500] text-[18px] leading-[22px]">Email</span>
                </div>
                <span className="font-[family-name:var(--font-outfit)] text-[16px] leading-[22px] text-primary/70">
                  Joodlife @info.com
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-white/20 pt-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h4 className="font-[family-name:var(--font-saans)] font-[790] text-[24.4px] tracking-[-0.49px] mb-2">
                Sign Up For Our Newsletter
              </h4>
              <p className="text-[16.3px] font-[380] tracking-[-0.32px] text-white/80">
                Stay up to date on our news, education and offers
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <input
                type="email"
                placeholder="Your email here"
                className="flex-1 md:w-[300px] px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 text-[16.3px] font-[380] focus:outline-none focus:border-white/50"
              />
              <button className="w-12 h-12 rounded-full bg-accent-green flex items-center justify-center hover:opacity-90 transition-opacity shrink-0">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10h12M12 6l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Copyright & badges */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4 border-t border-white/10">
          <p className="text-[14.2px] font-[380] tracking-[-0.43px] leading-[17px] text-white/60 max-w-2xl">
            &copy; 2025 Jood. All rights reserved. Superintendent Pharmacist: Zahir Isazil Khalil C2269628.
            Powered by Jood Pharmacy, a GPhC-registered pharmacy (9012093) operating under Jood
            Ltd. Clinical, consultation and prescribing services are provided by UK-registered
            prescribers. All medicines are dispensed and delivered in accordance with GPhC and MHRA
            guidance.
          </p>
          <div className="flex items-center gap-3">
            <Image src="/icons/payment-visa.svg" alt="Visa" width={38} height={24} />
            <Image src="/icons/payment-mastercard.svg" alt="Mastercard" width={38} height={24} />
            <Image src="/icons/payment-stripe.svg" alt="Stripe" width={50} height={21} />
          </div>
        </div>
      </div>
    </footer>
  );
}
