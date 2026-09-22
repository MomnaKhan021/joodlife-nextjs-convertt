import { getPolicy } from "@/lib/policyContent";
import PolicyForm from "../PolicyForm";

export const dynamic = "force-dynamic";

export default async function CmsPolicyPage() {
  const doc = await getPolicy("refund-complaints");
  return <PolicyForm slug="refund-complaints" initial={doc} />;
}
