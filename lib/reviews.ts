/**
 * Real customer reviews sourced from the JoodLife Trustpilot profile:
 *   https://www.trustpilot.com/review/joodlife.com
 *
 * These are genuine, verbatim 5-star reviews (name + text, and the reviewer's
 * Trustpilot profile photo where one was uploaded). No fabricated testimonials
 * and no category tags — the client asked that only real reviews be shown.
 *
 * To refresh: re-read the Trustpilot page and update this list. `avatar` points
 * to a local copy of the reviewer's Trustpilot photo under /assets/reviews.
 */

export type Review = {
  /** Reviewer display name as shown on Trustpilot. */
  name: string;
  /** Verbatim review body. */
  text: string;
  /** Star rating (all shown reviews are 5). */
  rating: 5;
  /** Local path to the reviewer's profile photo, if they uploaded one. */
  avatar?: string;
  /** Fallback initials shown when there's no profile photo. */
  initials?: string;
};

/**
 * Only substantial reviews are shown (roughly 3–4 lines each) so every card
 * carries a similar amount of text and the slider reads consistently. Very
 * short one-liners from the profile are intentionally left out — not because
 * they aren't genuine, but because a two-word card next to a four-line card
 * looks uneven. All entries below are verbatim from Trustpilot.
 */
/**
 * Only the more substantial reviews are shown (each runs ~3–4 lines) so every
 * card carries a similar amount of text and the slider reads consistently.
 * The genuine one-line reviews on the profile are intentionally left out — not
 * because they aren't real, but because a two-word card beside a four-line card
 * looks uneven. Every entry below is verbatim from Trustpilot; nothing added.
 */
export const REVIEWS: Review[] = [
  {
    name: "J Y",
    text: "So far, amazing customer service. Jood have been very quick to look into an issue with accessing my account to track my weight. Great at responding to my queries, even over the weekend. They've kept me updated and offered to log the weight for me. Thanks Jood Life!",
    rating: 5,
    initials: "JY",
  },
  {
    name: "Mr & Mrs Gamble",
    text: "Great service, very prompt with the orders coming out. Having a WhatsApp chat is fantastic — post your questions and you get an answer almost straight away. Staff so very helpful, 10/10.",
    rating: 5,
    initials: "MG",
  },
  {
    name: "Michelle Barraza",
    text: "The pen arrived 4 days after the order was placed. All great and the price is very competitive. I have recommended the company to a friend today. Thanks!",
    rating: 5,
    avatar: "/assets/reviews/michelle-barraza.png",
  },
  {
    name: "Linsey Robinson",
    text: "Amazing fast service ... very helpful & friendly.. felt at ease.. did video call and the following day my item came .. price is very good.",
    rating: 5,
    initials: "LR",
  },
  {
    name: "Amanda",
    text: "I was a little sceptical about ordering but they are great. The video call was great, lovely lady. Will definitely recommend these for jabs.",
    rating: 5,
    initials: "AM",
  },
  {
    name: "MS Susan Mayes",
    text: "I've been using MJ for 18 months and lost 6 stones .. it's life changing. Great service from Kelly at Jood. Many thanks ☺️",
    rating: 5,
    initials: "SM",
  },
];

/** Overall Trustpilot summary shown alongside the reviews. */
export const TRUSTPILOT = {
  score: "4.4",
  url: "https://www.trustpilot.com/review/joodlife.com",
};
