import { redirect } from "next/navigation";

/**
 * This screen edited the trust strip, feature panel and questions shared by
 * the treatment pages. All of it now lives where it shows: the Period delay
 * screen (strip, panel, its questions, the shared heading) and the ED screen
 * (its questions). Its "Weight loss" questions edited a list no page shows -
 * /weight-loss uses the Home page's questions. Old links land on Period delay.
 */
export default function CmsCategoryPages() {
  redirect("/cms/period-delay");
}
