import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import ConsultationFlow from "./ConsultationFlow";
import { getCurrentUser } from "@/lib/auth";
import { getOrdersForEmail } from "@/lib/accountData";

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
  const requestedSlug = Array.isArray(sp.product) ? sp.product[0] : sp.product;
  const dose = Array.isArray(sp.dose) ? sp.dose[0] : sp.dose;

  // Returning patient → short reorder form, not the full consultation.
  //
  // If the signed-in user has ANY paid order (per the customer's eligibility
  // rule: "Has any paid order ever"), and they didn't explicitly ask for a
  // specific product flow, switch the questionnaire to the reorder flow so
  // they don't repeat the full consultation. They can still force the full
  // flow by hitting /consultation?product=weight-loss explicitly.
  let productSlug = requestedSlug;
  if (!productSlug || productSlug === "reorder") {
    const user = await getCurrentUser();

    // Reorder is for signed-in returning customers only: we need their account
    // to find their treatment records. Not signed in → sign in first, then
    // come straight back to the reorder flow.
    if (!user?.email) {
      if (requestedSlug === "reorder") {
        redirect("/login?next=/reorder");
      }
    } else {
      const orders = await getOrdersForEmail(user.email);
      const hasPaidOrder = orders.some(
        (o) =>
          o.status !== "cancelled" &&
          o.paymentStatus !== "refunded" &&
          o.paymentStatus !== "failed",
      );
      if (hasPaidOrder) {
        productSlug = "reorder";
      } else if (requestedSlug === "reorder") {
        // Signed in but never ordered — not a returning patient, so the short
        // resupply form doesn't apply. Run the full consultation instead.
        productSlug = "weight-loss";
      }
    }
  }

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
