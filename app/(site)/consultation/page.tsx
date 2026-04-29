import Image from "next/image";
import Link from "next/link";

import ConsultationFlow from "./ConsultationFlow";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Consultation — JoodLife",
};

type Props = {
  searchParams: Promise<{
    product?: string | string[];
    dose?: string | string[];
  }>;
};

export default async function ConsultationPage({ searchParams }: Props) {
  const sp = await searchParams;
  const productSlug = Array.isArray(sp.product) ? sp.product[0] : sp.product;
  const dose = Array.isArray(sp.dose) ? sp.dose[0] : sp.dose;

  return (
    <main className="flex min-h-screen flex-col bg-[#f7f9f2]">
      {/* Top bar — wordmark only, no nav (matches joodlife.com /pages/consultation) */}
      <header className="flex w-full items-center justify-center border-b border-[#142e2a]/10 bg-white px-6 py-5">
        <Link
          href="/"
          aria-label="Back to home"
          className="inline-flex items-center transition-opacity hover:opacity-70"
        >
          <Image
            src="/assets/icons/logo-wesmount.svg"
            alt="JoodLife"
            width={95}
            height={30}
            priority
            className="h-7 w-auto"
          />
        </Link>
      </header>

      <ConsultationFlow productSlug={productSlug} dose={dose} />
    </main>
  );
}
