import QueueView from "../clinical-queue/QueueView";

/**
 * Marketing Queue — patients who completed a consultation but have NOT placed
 * an order yet (follow-up leads). Same view as the Clinical Queue, filtered
 * server-side by "no matching order for this email".
 */
export default function MarketingQueuePage() {
  return <QueueView mode="marketing" />;
}
