import { getHomeContent } from "@/lib/pageContent";
import HowItWorksView from "./HowItWorksView";

/**
 * Server wrapper: reads the How-it-works steps from the Home global.
 * Falls back to the built-in steps, so an empty global renders the section
 * exactly as it shipped.
 */
export default async function HowItWorks() {
  const { hiwHeading, hiwHeadingEmphasis, hiwSteps, styles, textStyles } = await getHomeContent();
  return (
    <HowItWorksView
      style={styles.howItWorks}
      text={textStyles}
      heading={hiwHeading}
      headingEmphasis={hiwHeadingEmphasis}
      steps={hiwSteps}
    />
  );
}
