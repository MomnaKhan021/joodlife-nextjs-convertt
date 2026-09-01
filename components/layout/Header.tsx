import { getHeaderContent } from "@/lib/siteContent";
import HeaderClient from "./HeaderClient";

/**
 * Server wrapper: reads the Header global and hands the nav links to the
 * client component. Exists so the ~20 pages that render <Header /> keep
 * working unchanged — they get CMS-driven navigation for free.
 *
 * getHeaderContent() falls back to the built-in links, so a missing or
 * empty global renders exactly what shipped before.
 */
export default async function Header() {
  const { navLinks } = await getHeaderContent();
  return <HeaderClient navLinks={navLinks} />;
}
