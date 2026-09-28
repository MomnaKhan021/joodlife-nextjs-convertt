import { mergeWeightLoss } from "@/lib/weightLossContentTypes";

import { LoadFailed, loadGlobal } from "../loadGlobal";
import WeightLossForm from "./WeightLossForm";

export const dynamic = "force-dynamic";

export default async function CmsWeightLossPage() {
  const doc = await loadGlobal("weight-loss-page");
  if (!doc) return <LoadFailed what="weight loss page" />;
  return <WeightLossForm initial={mergeWeightLoss(doc)} />;
}
