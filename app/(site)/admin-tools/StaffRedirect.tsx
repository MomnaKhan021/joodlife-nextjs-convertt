"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Browser-side hop for a staff member who reaches the admin home, which is
 * admin-only. Done on the client because a server redirect() from this page
 * runs inside the layout's Suspense boundary and is not followed during a
 * client-side navigation — the click just showed an empty page until the user
 * refreshed. router.replace works the same for a click and a full load.
 */
export default function StaffRedirect({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(to);
  }, [router, to]);
  return (
    <div className="grid min-h-screen place-items-center bg-[#f1f1f1] font-ui text-[14px] text-[#616161]">
      Opening your dashboard…
    </div>
  );
}
