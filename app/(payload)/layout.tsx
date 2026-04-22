/* eslint-disable no-restricted-exports */
// Payload admin layout — kept separate from the marketing site's root layout.
import type { Metadata } from "next";
import { RootLayout } from "@payloadcms/next/layouts";
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

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap}>
    {children}
  </RootLayout>
);

export default Layout;
