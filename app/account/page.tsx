import { headers as nextHeaders } from "next/headers";
import { getPayloadInstance } from "@/lib/payload";
import AccountAuthForms from "./AccountAuthForms";
import AccountDashboard from "./AccountDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Account — JoodLife",
};

export default async function AccountPage() {
  // Check auth on the server. If logged in, show the dashboard;
  // otherwise show the sign-in / sign-up tabs.
  let user: Awaited<
    ReturnType<Awaited<ReturnType<typeof getPayloadInstance>>["auth"]>
  >["user"] = null;

  try {
    const payload = await getPayloadInstance();
    const result = await payload.auth({ headers: await nextHeaders() });
    user = result.user;
  } catch {
    user = null;
  }

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-12 md:px-[60px] md:py-16">
      <h1 className="font-display text-[32px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[44px]">
        {user
          ? `Hi, ${(user as { name?: string }).name ?? user.email ?? "there"}`
          : "My account"}
      </h1>
      <p className="mt-2 max-w-[560px] font-ui text-[15px] text-[#142e2a]/75">
        {user
          ? "Your profile and orders in one place."
          : "Sign in to view your orders, or create an account to get started."}
      </p>

      <div className="mt-8">
        {user ? (
          <AccountDashboard
            user={{
              id: String(user.id),
              // Payload types `email` as string | undefined for custom
              // auth collections, but in practice our Users slug always
              // has one (the built-in auth requires it).
              email: user.email ?? "",
              name: (user as { name?: string }).name,
              role: (user as { role?: string }).role ?? "customer",
            }}
          />
        ) : (
          <AccountAuthForms />
        )}
      </div>
    </main>
  );
}
