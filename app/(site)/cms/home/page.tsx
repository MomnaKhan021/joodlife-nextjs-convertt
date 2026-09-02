import { getHomeContent } from "@/lib/pageContent";
import {
  getTreatmentOverrides,
  overridesFromDefaults,
} from "@/lib/treatmentContent";
import SectionsForm from "./SectionsForm";

export const dynamic = "force-dynamic";

export default async function CmsHomePage() {
  const [content, saved] = await Promise.all([
    getHomeContent(),
    getTreatmentOverrides(),
  ]);
  // The treatment bands sit between the hero and reviews on the page, so they
  // are edited in place here rather than on a separate screen.
  const treatments = overridesFromDefaults(saved);
  return <SectionsForm initial={content} treatments={treatments} />;
}
