import CmsSectionPage from "../CmsSectionPage";

export const dynamic = "force-dynamic";

export default function CmsNavigationPage() {
  return (
    <CmsSectionPage
      title="Header & Footer"
      description="Navigation links, footer columns and contact details."
      planned
      note="Needs two Payload globals (Header, Footer), then components/layout/Header.tsx and sections/home/Footer.tsx refactored to read from them instead of hardcoded copy."
    />
  );
}
