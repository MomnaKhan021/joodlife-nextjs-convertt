import { redirect } from "next/navigation";

/** Weigh-ins now live in the portal (Treatment → Progress). Keep old links working. */
export default function WeightLogsPage() {
  redirect("/profile");
}
