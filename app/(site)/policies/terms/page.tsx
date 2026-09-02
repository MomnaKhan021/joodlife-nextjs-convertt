import PolicyPage from "../PolicyPage";
import { getPolicy } from "@/lib/policyContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Terms & Conditions — JoodLife",
  description:
    "The terms and conditions that govern your use of JoodLife and the clinical, pharmacy and delivery services provided by Jood Pharmacy.",
};

/** Content comes from the CMS, falling back to lib/policyDefaults.ts. */
export default async function TermsPage() {
  const p = await getPolicy("terms");
  return (
    <PolicyPage
      title={p.title}
      titleAccent={p.titleAccent}
      intro={p.intro}
      updated={p.updated}
      sections={p.sections}
    />
  );
}
