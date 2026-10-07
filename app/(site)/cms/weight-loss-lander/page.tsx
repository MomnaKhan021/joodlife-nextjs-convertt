import { mergeLander } from "@/lib/landerContentTypes";

import { LoadFailed, loadGlobal } from "../loadGlobal";
import LanderForm from "./LanderForm";

export const dynamic = "force-dynamic";

export default async function CmsWeightLossLanderPage() {
  const doc = await loadGlobal("weight-loss-lander");
  if (!doc) return <LoadFailed what="weight loss ads lander" />;
  return <LanderForm initial={mergeLander(doc)} />;
}
