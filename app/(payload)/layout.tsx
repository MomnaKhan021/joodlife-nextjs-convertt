/* eslint-disable no-restricted-exports */
// Payload admin layout — kept separate from the marketing site's root layout.
import type { Metadata } from "next";
import type { ServerFunctionClient } from "payload";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";

import config from "@/payload.config";
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

const Layout = ({ children }: Args) => (
  <RootLayout
    config={config}
    importMap={importMap}
    serverFunction={serverFunction}
  >
    {children}
  </RootLayout>
);

export default Layout;
