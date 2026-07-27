import type { CategoryKey } from "@/lib/categories";

export type Faq = { q: string; a: string };

/** Per-category FAQ content for the sub-pages. */
export const CATEGORY_FAQS: Record<CategoryKey, Faq[]> = {
  "weight-loss": [
    {
      q: "How does JoodLife's weight-loss treatment work?",
      a: "We combine clinically proven GLP-1 medication with personalised coaching, ongoing clinical support and evidence-based guidance to help you achieve lasting results.",
    },
    {
      q: "Is the medication safe and evidence-based?",
      a: "Yes. All medications are MHRA/GPhC licensed and prescribed by UK-registered clinicians after reviewing your full health assessment.",
    },
    {
      q: "Can I pause or cancel my plan?",
      a: "You're always in control. You can pause or cancel at any time from your account dashboard.",
    },
  ],
  "erectile-dysfunction": [
    {
      q: "How do erectile dysfunction treatments work?",
      a: "Erectile dysfunction treatments help improve blood flow to the penis, making it easier to get and maintain an erection when you are sexually aroused. After your online consultation, a licensed provider will review your health details and recommend a suitable treatment option.",
    },
    {
      q: "Are ED treatments safe?",
      a: "Yes. All treatments are MHRA/GPhC licensed and prescribed by UK-registered clinicians only after reviewing your full health assessment to confirm they are appropriate for you.",
    },
    {
      q: "Is the consultation private?",
      a: "Completely. Your assessment is confidential and treatments arrive in plain, unbranded packaging with discreet next-day delivery, so your privacy is always protected.",
    },
    {
      q: "How quickly can I receive my medication?",
      a: "Once approved, your treatment is dispensed by our pharmacy and sent with discreet, next-day delivery so you can start when it suits you.",
    },
    {
      q: "Can my treatment be adjusted if needed?",
      a: "Yes — our clinical team is available to review how you're getting on and can adjust your treatment plan for the best results.",
    },
  ],
  "period-delay": [
    {
      q: "How does period-delay treatment work?",
      a: "Norethisterone is a clinically approved tablet taken a few days before your period is due. It safely delays your period for as long as you keep taking it.",
    },
    {
      q: "When should I start taking it?",
      a: "Typically three days before your period is due. After a quick assessment, your prescriber gives clear, personalised guidance on timing.",
    },
    {
      q: "Is it safe?",
      a: "Norethisterone is widely used and MHRA/GPhC regulated. A UK-registered clinician reviews your health assessment to confirm it's right for you.",
    },
    {
      q: "How quickly will it arrive?",
      a: "Discreet, next-day delivery means you can be ready in time for holidays, weddings or any important event.",
    },
  ],
};
