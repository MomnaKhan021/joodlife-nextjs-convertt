"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Sign-out button for the account page. */
export default function SignOutButton() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/users/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore — redirect either way */
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={signingOut}
      className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg border border-[#142e2a]/20 bg-white px-6 font-ui text-[13px] font-semibold text-[#142e2a] transition-colors hover:bg-[#142e2a] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {signingOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
