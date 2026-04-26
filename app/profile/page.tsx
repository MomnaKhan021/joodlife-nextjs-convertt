import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import ProfileClient from "./ProfileClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profile — JoodLife",
};

export default async function ProfilePage() {
  // Belt & braces — middleware already redirects anonymous users,
  // but verify on the server in case the cookie was tampered with.
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-12 md:px-[60px] md:py-16">
      <h1 className="font-display text-[32px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[40px]">
        Hi, {user.name ?? user.email.split("@")[0]}
      </h1>
      <p className="mt-2 max-w-[560px] font-ui text-[15px] text-[#142e2a]/75">
        Your profile and orders in one place.
      </p>

      <div className="mt-8">
        <ProfileClient user={user} />
      </div>
    </main>
  );
}
