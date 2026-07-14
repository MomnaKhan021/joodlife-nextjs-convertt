/* eslint-disable no-restricted-exports */
// Payload admin layout — kept separate from the marketing site's root layout.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ServerFunctionClient } from "payload";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";

import config from "@/payload.config";
import { requiresTwoFactor } from "@/lib/twoFactor";
import { importMap } from "./admin/importMap";

import "@payloadcms/next/css";
import "./custom.scss";

type Args = {
  children: React.ReactNode;
};

export const metadata: Metadata = {
  title: "JoodLife CMS",
};

// Payload 3.x uses React Server Actions for admin interactions.
// This thin wrapper is required for things like live preview, drafts,
// and component import-map resolution.
const serverFunction: ServerFunctionClient = async function (args) {
  "use server";
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

const Layout = async ({ children }: Args) => {
  // Enforce 2FA on the CMS admin too (not just /admin-tools): once an admin has
  // enabled it, they must pass a code before the CMS renders. No-op for anyone
  // who hasn't enabled 2FA, and for the login page (no user yet).
  if (await requiresTwoFactor()) {
    redirect("/admin-tools/verify-2fa?next=/admin");
  }
  return (
    <RootLayout
      config={config}
      importMap={importMap}
      serverFunction={serverFunction}
    >
      {children}
    </RootLayout>
  );
};

export default Layout;
