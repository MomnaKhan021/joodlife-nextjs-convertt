"use client";

import Script from "next/script";

/**
 * Initialises the GA4/GTM ecommerce dataLayer, and loads a Google Tag Manager
 * container when one is configured.
 *
 * - The dataLayer is ALWAYS initialised, so the ecommerce events fired from
 *   lib/dataLayer.ts (view_item, add_to_cart, begin_checkout, purchase) queue
 *   up and are inspectable in the console even before a container exists.
 * - Set NEXT_PUBLIC_GTM_ID (e.g. "GTM-XXXXXXX") to load the marketing team's
 *   GTM container — it then reads those events live with zero further changes.
 */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "";

export default function GtmDataLayer() {
  return (
    <>
      <Script id="datalayer-init" strategy="beforeInteractive">
        {`window.dataLayer = window.dataLayer || [];`}
      </Script>
      {GTM_ID ? (
        <Script id="gtm-loader" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      ) : null}
    </>
  );
}
