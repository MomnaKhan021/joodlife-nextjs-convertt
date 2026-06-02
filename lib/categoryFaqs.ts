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
      q: "Are erectile-dysfunction treatments effective?",
      a: "Clinically approved ED treatments are highly effective for most men. After a short assessment, a UK-registered prescriber recommends the option best suited to you.",
    },
    {
      q: "Is my order discreet?",
      a: "Completely. Treatments arrive in plain, unbranded packaging with next-day delivery, so your privacy is always protected.",
    },
    {
      q: "Do I need to see a doctor in person?",
      a: "No. Complete the online assessment and a licensed clinician reviews it remotely before approving a suitable, safe treatment.",
    },
    {
      q: "Can I get ongoing support?",
      a: "Yes — our clinical team is available 24/7 via WhatsApp to answer questions and adjust your treatment if needed.",
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
