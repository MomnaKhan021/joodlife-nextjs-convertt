"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

/**
 * Microsoft Clarity — session recordings and heatmaps.
 *
 * Loads only when NEXT_PUBLIC_CLARITY_ID is set (the Project ID from
 * clarity.microsoft.com → Settings → Overview). It is a public client-side
 * identifier, like the GTM ID, so NEXT_PUBLIC_ is fine.
 *
 * Privacy: Clarity records what visitors see. It never STARTS on staff or
 * patient-private areas (admin tools, CMS, the account page), and those areas
 * are also wrapped in data-clarity-mask, so if a recording that began on a
 * public page navigates there, the content is masked. App Router client
 * navigations are tracked by Clarity itself (it follows history changes), so
 * the tag is loaded once and never reloaded.
 */
const CLARITY_ID = (process.env.NEXT_PUBLIC_CLARITY_ID ?? "").trim();
// Project IDs are short lowercase alphanumerics; refuse anything else so the
// value can never inject script.
const VALID_ID = /^[a-z0-9]{6,20}$/i.test(CLARITY_ID);
const PRIVATE_PATHS = [/^\/admin(\/|-tools|$)/, /^\/cms(\/|$)/, /^\/profile(\/|$)/];

export default function Clarity() {
  const pathname = usePathname() || "/";
  if (!VALID_ID) return null;
  if (PRIVATE_PATHS.some((re) => re.test(pathname))) return null;
  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
    </Script>
  );
}
