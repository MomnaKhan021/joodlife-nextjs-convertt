/**
 * Header layout presets — the arrangement of the bar, not its colours.
 *
 * Deliberately three named presets rather than free positioning of each
 * piece. A header has to stay balanced at every width, and "logo 63% across"
 * is not a thing anyone wants; what people actually want is the handful of
 * arrangements a storefront theme offers. Each preset is a layout that has
 * been thought about, not a coordinate.
 *
 * Client-safe — no `server-only`, no Payload import.
 */

export type HeaderLayout =
  /** Logo left, links beside it, Log in button right. As shipped. */
  | "logo-left"
  /** Links left, logo centred, Log in button right. */
  | "logo-centre"
  /** Menu button left, logo centred — the mobile drawer, on desktop too. */
  | "drawer";

export const HEADER_LAYOUTS: {
  value: HeaderLayout;
  label: string;
  hint: string;
}[] = [
  {
    value: "logo-left",
    label: "Logo left",
    hint: "Logo, then the links, with the Log in button on the right.",
  },
  {
    value: "logo-centre",
    label: "Logo centred",
    hint: "Links on the left, logo in the middle, Log in button right.",
  },
  {
    value: "drawer",
    label: "Menu button",
    hint: "Hides the links behind a menu button on desktop as well as mobile.",
  },
];

export type HeaderSettings = {
  layout: HeaderLayout;
  /** Keep the bar on screen as the page scrolls. */
  sticky: boolean;
};

export const DEFAULT_HEADER_SETTINGS: HeaderSettings = {
  layout: "logo-left",
  sticky: true,
};

const LAYOUTS = new Set<string>(HEADER_LAYOUTS.map((l) => l.value));

/**
 * Merge a stored value over the defaults.
 *
 * An unrecognised layout falls back to the shipped one rather than rendering
 * nothing, so a hand-edited or stale value can only ever mean "as it was".
 */
export function mergeHeaderSettings(stored: unknown): HeaderSettings {
  const v = (stored ?? {}) as Partial<HeaderSettings>;
  return {
    layout: LAYOUTS.has(String(v.layout))
      ? (v.layout as HeaderLayout)
      : DEFAULT_HEADER_SETTINGS.layout,
    sticky:
      typeof v.sticky === "boolean" ? v.sticky : DEFAULT_HEADER_SETTINGS.sticky,
  };
}
