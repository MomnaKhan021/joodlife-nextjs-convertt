/**
 * Payload renders <Icon /> alongside <Logo /> in some sidebar layouts —
 * if they're different artworks they end up colliding visually.
 *
 * To keep the brand consistent, we reuse the same Jood wordmark for
 * both slots. CSS sizes them differently:
 *   .jood-admin-logo  — full-size on the login screen + nav header
 *   .jood-admin-icon  — compact, used on collapsed nav / breakpoints
 */
import { JoodWordmark } from "./Logo";

export function Icon() {
  return <JoodWordmark className="jood-admin-icon" />;
}

export default Icon;
