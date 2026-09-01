import CmsSectionPage from "../CmsSectionPage";

export const dynamic = "force-dynamic";

export default function CmsSectionsPage() {
  return (
    <CmsSectionPage
      title="Page sections"
      description="Home page section copy and imagery."
      planned
      note="Home page content is currently hardcoded in each component (e.g. the FAQ list in sections/home/Faq.tsx). Needs a Payload global per page with a field group per section, then each component refactored to read from it."
    />
  );
}
