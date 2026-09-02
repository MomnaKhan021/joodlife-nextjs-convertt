import PolicyPage from "../PolicyPage";
import { getPolicy } from "@/lib/policyContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Privacy & Cookies Policy — JoodLife",
  description:
    "How JoodLife and Jood Pharmacy collect, use and protect your personal and health information, and how we use cookies on joodlife.shop.",
};

/** Content comes from the CMS, falling back to lib/policyDefaults.ts. */
export default async function PrivacyPage() {
  const p = await getPolicy("privacy");
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
