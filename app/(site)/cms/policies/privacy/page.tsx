import { getPolicy } from "@/lib/policyContent";
import PolicyForm from "../PolicyForm";

export const dynamic = "force-dynamic";

export default async function CmsPolicyPage() {
  const doc = await getPolicy("privacy");
  return <PolicyForm slug="privacy" initial={doc} />;
}
