import { getPolicy } from "@/lib/policyContent";
import PolicyForm from "../PolicyForm";

export const dynamic = "force-dynamic";

export default async function CmsPolicyPage() {
  const doc = await getPolicy("terms");
  return <PolicyForm slug="terms" initial={doc} />;
}
