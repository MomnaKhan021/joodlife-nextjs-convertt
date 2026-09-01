import { getFooterContent } from "@/lib/siteContent";
import FooterClient from "./FooterClient";

/**
 * Server wrapper: reads the Footer global and hands its content to the
 * client component. See components/layout/Header.tsx for the same pattern
 * and why it's a wrapper rather than a rewrite of every call site.
 */
export default async function Footer() {
  const content = await getFooterContent();
  return <FooterClient {...content} />;
}
