/**
 * Flow registry — selects which questionnaire the engine runs, by productSlug.
 *
 *   weight-loss (default)  → flow.ts          (existing)
 *   erectile-dysfunction   → flow-ed.ts
 *   period-delay           → flow-pd.ts
 *   reorder                → flow-reorder.ts
 *
 * Each flow is a SlideDef[] with a slide whose id is "s0" (the entry point)
 * and a terminal "s_success" slide. ConsultationFlow.tsx calls getFlow() once
 * from the productSlug query param and walks the returned slides.
 */
import { SLIDES as WL_SLIDES, TOTAL_STEPS as WL_TOTAL, type SlideDef } from "./flow";
import { ED_SLIDES, ED_TOTAL_STEPS } from "./flow-ed";
import { PD_SLIDES, PD_TOTAL_STEPS } from "./flow-pd";
import { REORDER_SLIDES, REORDER_TOTAL_STEPS } from "./flow-reorder";

export type Flow = { slides: SlideDef[]; total: number; index: Record<string, SlideDef> };

function build(slides: SlideDef[], total: number): Flow {
  const index: Record<string, SlideDef> = {};
  for (const s of slides) index[s.id] = s;
  return { slides, total, index };
}

const FLOWS: Record<string, Flow> = {
  "weight-loss": build(WL_SLIDES, WL_TOTAL),
  "erectile-dysfunction": build(ED_SLIDES, ED_TOTAL_STEPS),
  "period-delay": build(PD_SLIDES, PD_TOTAL_STEPS),
  reorder: build(REORDER_SLIDES, REORDER_TOTAL_STEPS),
};

export function getFlow(productSlug?: string): Flow {
  return (productSlug && FLOWS[productSlug]) || FLOWS["weight-loss"];
}
