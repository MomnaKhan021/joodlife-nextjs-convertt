import {
  getTreatmentLook,
  getTreatmentOverrides,
  overridesFromDefaults,
} from "@/lib/treatmentContent";
import TreatmentsForm from "./TreatmentsForm";

export const dynamic = "force-dynamic";

export default async function CmsTreatmentsPage() {
  const [saved, look] = await Promise.all([getTreatmentOverrides(), getTreatmentLook()]);
  // Pre-fill from the built-in copy so the editor sees the live text rather
  // than empty boxes.
  const rows = overridesFromDefaults(saved);
  return <TreatmentsForm initial={rows} look={look} />;
}
