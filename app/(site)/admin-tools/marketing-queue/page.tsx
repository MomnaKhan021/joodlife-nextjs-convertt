import AbandonedCheckoutView from "./AbandonedCheckoutView";

/**
 * Abandoned Checkout — true cart abandonment. Shoppers who added items to their
 * basket but didn't complete checkout (captured by /api/cart/track), with
 * manual + automated (daily cron) reminder emails to recover the sale.
 */
export default function MarketingQueuePage() {
  return <AbandonedCheckoutView />;
}
