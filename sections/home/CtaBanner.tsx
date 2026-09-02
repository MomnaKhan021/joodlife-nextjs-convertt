import { getHomeContent } from "@/lib/pageContent";
import CtaBannerView from "./CtaBannerView";

/**
 * Server wrapper: reads the closing CTA from the Home global.
 *
 * `isReturningPatient` still comes from the caller — it depends on the
 * signed-in user's orders, not on CMS content.
 */
export default async function CtaBanner({
  isReturningPatient,
}: {
  isReturningPatient?: boolean;
}) {
  const { ctaTitle, ctaTitleEmphasis, ctaSubtitle, ctaImage } =
    await getHomeContent();
  return (
    <CtaBannerView
      isReturningPatient={isReturningPatient}
      title={ctaTitle}
      titleEmphasis={ctaTitleEmphasis}
      subtitle={ctaSubtitle}
      image={ctaImage}
    />
  );
}
