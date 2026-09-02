import PolicyPage from "../PolicyPage";
import { getPolicy } from "@/lib/policyContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Refund & Complaints Procedure — JoodLife",
  description:
    "How JoodLife handles refunds, returns and complaints, and how to get in touch if something isn't right with your order or care.",
};

/** Content comes from the CMS, falling back to lib/policyDefaults.ts. */
export default async function RefundComplaintsPage() {
  const p = await getPolicy("refund-complaints");
  return (
    <PolicyPage {...p} />
  );
}
