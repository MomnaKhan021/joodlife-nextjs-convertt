import PortalLogin from "./PortalLogin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Log in — Jood",
};

type Props = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const rawNext = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/profile";
  return <PortalLogin redirectTo={next} />;
}
