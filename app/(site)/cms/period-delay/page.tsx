import { mergeCategoryPage } from "@/lib/categoryPageContentTypes";
import { TREATMENT_STYLE_KEYS, mergeStyles } from "@/lib/sectionStyle";
import { TREATMENT_TEXT_KEYS, mergeTextStyles } from "@/lib/textStyle";
import {
  overridesFromDefaults,
  toTreatmentOverrides,
} from "@/lib/treatmentContentTypes";

import { LoadFailed, loadGlobal } from "../loadGlobal";
import PeriodDelayForm from "./PeriodDelayForm";

export const dynamic = "force-dynamic";

/**
 * /period-delay is assembled from two documents: its hero is the period delay
 * row of the treatments global (also the period delay band on the home page),
 * and its trust strip, feature panel and questions are on the category-pages
 * global. This screen edits the period delay parts of both and writes each
 * back whole, so nothing else in either document can be lost from here.
 */
export default async function CmsPeriodDelayPage() {
  const [treatments, shared] = await Promise.all([
    loadGlobal("treatments"),
    loadGlobal("category-pages"),
  ]);
  if (!treatments || !shared) return <LoadFailed what="period delay page" />;

  return (
    <PeriodDelayForm
      rows={overridesFromDefaults(toTreatmentOverrides(treatments.categories))}
      look={{
        styles: mergeStyles(treatments.styles, TREATMENT_STYLE_KEYS),
        textStyles: mergeTextStyles(treatments.textStyles, TREATMENT_TEXT_KEYS),
      }}
      shared={mergeCategoryPage(shared)}
    />
  );
}
