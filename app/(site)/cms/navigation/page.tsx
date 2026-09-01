import { getFooterContent, getHeaderContent } from "@/lib/siteContent";
import NavigationForm from "./NavigationForm";

export const dynamic = "force-dynamic";

export default async function CmsNavigationPage() {
  const [header, footer] = await Promise.all([
    getHeaderContent(),
    getFooterContent(),
  ]);
  return (
    <NavigationForm
      initial={{
        navLinks: header.navLinks,
        joodLinks: footer.joodLinks,
        treatmentLinks: footer.treatmentLinks,
        policyLinks: footer.policyLinks,
        contactHeading: footer.contactHeading,
        phone: footer.phone,
        email: footer.email,
        newsletterHeading: footer.newsletterHeading,
        newsletterSubtext: footer.newsletterSubtext,
        legalText: footer.legalText,
      }}
    />
  );
}
