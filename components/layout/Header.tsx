import { getHeaderContent } from "@/lib/siteContent";
import HeaderClient from "./HeaderClient";

/**
 * Server wrapper: reads the Header global and hands the nav links, logos and
 * mega menu content to the client component. Exists so the ~20 pages that
 * render <Header /> keep working unchanged.
 *
 * getHeaderContent() falls back to the built-in values, so a missing or
 * empty global renders exactly what shipped before.
 */
export default async function Header() {
  const { navLinks, logoDesktop, logoMobile, ...mega } = await getHeaderContent();
  return (
    <HeaderClient
      navLinks={navLinks}
      mega={mega}
      logoDesktop={logoDesktop}
      logoMobile={logoMobile}
    />
  );
}
