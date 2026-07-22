import QueueView from "./QueueView";

/**
 * Clinical Approval Queue — consultations from patients who ALSO placed an
 * order. Leads without an order live in the Marketing queue instead
 * (/admin-tools/marketing-queue); both render the same QueueView.
 */
export default function ClinicalQueuePage() {
  return <QueueView mode="clinical" />;
}
