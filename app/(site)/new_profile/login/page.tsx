import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import PortalLogin from "./PortalLogin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Log in — Jood",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ next?: string | string[] }>;
};

/** Login for the new portal (testing at /new_profile; /login is unchanged). */
export default async function NewPortalLoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const rawNext = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/new_profile";
  if (await getCurrentUser()) redirect(next);
  return <PortalLogin redirectTo={next} />;
}
