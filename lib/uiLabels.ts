/**
 * The small fixed words around the site - menu buttons, the cart panel,
 * footer labels, the blog's buttons and its enquiry form.
 *
 * Each group is stored as one `labels` json field on the global it belongs
 * to (header, footer, blog-page). Every default is the wording the site
 * shipped with, and a cleared field falls back to it, so an empty field can
 * never leave a button blank.
 *
 * Client-safe: no server imports.
 */

export const HEADER_LABELS_DEFAULT = {
  login: "Log in",
  account: "Account",
  drawerCta: "Get started",
  drawerCtaHref: "/consultation",
  drawerBack: "Back",
  drawerExplore: "Explore Treatment",
  drawerExploreHref: "/shop",
  cartTitle: "Your cart",
  cartEmpty: "Your cart is empty",
  cartEmptyBody: "Browse the shop to find your treatment plan.",
  cartBrowse: "Browse shop",
  cartSubtotal: "Subtotal",
  cartNote:
    "Tax + delivery calculated at checkout. A clinical consultation is required before dispatch.",
  cartCheckout: "Checkout",
  cartConsultation: "Start consultation",
};
export type HeaderLabels = typeof HEADER_LABELS_DEFAULT;

export const FOOTER_LABELS_DEFAULT = {
  whatsapp: "WhatsApp",
  email: "Email",
  newsletterPlaceholder: "Your email here",
};
export type FooterLabels = typeof FOOTER_LABELS_DEFAULT;

export const BLOG_LABELS_DEFAULT = {
  readMore: "Read Blog Post",
  allArticles: "All articles",
  previous: "← Previous",
  next: "Next →",
  breadcrumbHome: "Home",
  breadcrumbJournal: "Journal",
  backToJournal: "← Back to journal",
  moreFromJournal: "More from the journal",
  viewAll: "View all →",
  enquiryHeading: "Have a question?",
  enquiryHeadingAccent: "Send an enquiry",
  enquiryBody:
    "Ask us anything about this article or our treatments — a member of the JoodLife team will reply by email.",
  enquiryName: "Name",
  enquiryNamePlaceholder: "Your name",
  enquiryEmail: "Email *",
  enquiryEmailPlaceholder: "you@example.com",
  enquiryMessage: "Message *",
  enquiryMessagePlaceholder: "Write your question here…",
  enquirySubmit: "Send enquiry",
  enquirySending: "Sending…",
  enquiryThanks: "Thank you — we’ve received your enquiry ✅",
  enquiryThanksBody: "Our team will get back to you by email as soon as possible.",
};
export type BlogLabels = typeof BLOG_LABELS_DEFAULT;

/** Stored labels over the defaults, key by key; blanks fall back. */
export function mergeLabels<T extends Record<string, string>>(stored: unknown, defaults: T): T {
  const src =
    stored && typeof stored === "object" && !Array.isArray(stored)
      ? (stored as Record<string, unknown>)
      : {};
  const out = { ...defaults };
  for (const k of Object.keys(defaults) as (keyof T)[]) {
    const v = src[k as string];
    if (typeof v === "string" && v.trim()) out[k] = v as T[keyof T];
  }
  return out;
}
