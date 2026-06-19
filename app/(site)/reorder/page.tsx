import { redirect } from "next/navigation";

/**
 * /reorder — entry point for returning patients placing a repeat supply.
 * Runs the reorder questionnaire (flow-reorder.ts) via the shared engine.
 */
export default function ReorderPage() {
  redirect("/consultation?product=reorder");
}
