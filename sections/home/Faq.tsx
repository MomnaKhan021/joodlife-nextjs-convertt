import { getHomeContent } from "@/lib/pageContent";
import FaqClient from "./FaqClient";

/**
 * Server wrapper: reads the FAQ from the Home global and hands it to the
 * client component (which owns the open/closed accordion state).
 *
 * Falls back to the built-in questions, so an empty global renders the
 * section exactly as it shipped.
 */
export default async function Faq() {
  const { faqs, faqHeading, faqHeadingEmphasis, styles, textStyles } = await getHomeContent();
  return (
    <FaqClient
      style={styles.faq}
      text={textStyles}
      heading={faqHeading}
      headingEmphasis={faqHeadingEmphasis}
      faqs={faqs}
    />
  );
}
