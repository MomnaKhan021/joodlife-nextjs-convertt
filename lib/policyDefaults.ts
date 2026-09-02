import type { PolicySection } from "@/app/(site)/policies/PolicyPage";

/**
 * Default copy for the three policy pages.
 *
 * Moved out of the route files so both the pages and the /cms editors can
 * read them: the editor pre-fills from these, and a page falls back to them
 * whenever the CMS has nothing saved. Editing a policy is legally
 * significant - these are the terms the pharmacy operates under.
 */

export const TERMS_DEFAULT = {
  title: "Terms &",
  titleAccent: "conditions",
  intro: "These terms govern your use of JoodLife and the clinical, pharmacy and delivery services we provide. Please read them carefully before using our services.",
  updated: "11 August 2026",
  sections: [
  {
    heading: "1. About us",
    blocks: [
      {
        type: "p",
        text: "JoodLife is operated by Jood Ltd (“Jood”, “we”, “us”, “our”). Prescribing, dispensing and delivery services are provided by Jood Pharmacy, a pharmacy registered with the General Pharmaceutical Council (GPhC registration number 9012990). Pharmacy operations are currently taking place at Weaverham Pharmacy (1029683).",
      },
      {
        type: "p",
        text: "Our Superintendent Pharmacist is Zahhaad Khalil (GPhC number 2228969). Clinical, consultation and prescribing services are provided by UK-registered prescribers, and all medicines are dispensed and delivered in accordance with GPhC and MHRA guidance.",
      },
    ],
  },
  {
    heading: "2. Acceptance of these terms",
    blocks: [
      {
        type: "p",
        text: "By accessing joodlife.shop, completing a consultation, or placing an order, you confirm that you accept these terms and conditions and that you agree to comply with them. If you do not agree to these terms, you must not use our services.",
      },
      {
        type: "p",
        text: "We may update these terms from time to time. The version published on this page is the version that applies to your use of the service.",
      },
    ],
  },
  {
    heading: "3. Eligibility",
    blocks: [
      { type: "p", text: "To use our services you must:" },
      {
        type: "list",
        items: [
          "Be aged 18 or over;",
          "Be a resident of, and located in, the United Kingdom;",
          "Provide accurate, complete and truthful information during your consultation and at all times; and",
          "Be able to enter into a legally binding contract.",
        ],
      },
      {
        type: "p",
        text: "The information you provide is used by our clinicians to make prescribing decisions. Providing inaccurate or incomplete information may put your health at risk and may result in treatment being declined.",
      },
    ],
  },
  {
    heading: "4. Consultations and prescribing",
    blocks: [
      {
        type: "p",
        text: "Treatment is only supplied where a JoodLife prescriber considers it clinically appropriate following an online consultation. Completing a consultation or placing an order does not guarantee that treatment will be prescribed.",
      },
      {
        type: "p",
        text: "Our prescribers may decline to prescribe, request further information, or recommend that you speak to your GP or another healthcare professional. Where we decline to prescribe after payment has been taken, you will not be charged for the medicine and any payment made will be refunded in line with our Refund & Complaints Procedure.",
      },
      {
        type: "p",
        text: "Our services are not a substitute for emergency care. If you experience a medical emergency, call 999 or attend your nearest A&E department.",
      },
    ],
  },
  {
    heading: "5. Orders, pricing and payment",
    blocks: [
      {
        type: "p",
        text: "Prices are shown at checkout and include VAT where applicable. We take reasonable care to ensure that prices are correct, but if we discover an error in the price of an item you have ordered we will contact you before the order is dispatched.",
      },
      {
        type: "p",
        text: "Payment is taken securely at checkout. A contract between you and Jood is only formed once a prescriber has approved your treatment and your order has been accepted for dispatch.",
      },
    ],
  },
  {
    heading: "6. Delivery",
    blocks: [
      {
        type: "p",
        text: "We deliver within the United Kingdom. Medicines are dispatched in plain, discreet packaging with no external branding indicating the contents. Estimated delivery times are provided as a guide and are not guaranteed.",
      },
      {
        type: "p",
        text: "It is your responsibility to provide an accurate delivery address and to ensure someone is available to receive the parcel where a signature is required.",
      },
    ],
  },
  {
    heading: "7. Use of medicines",
    blocks: [
      {
        type: "p",
        text: "You must use any medicine supplied strictly in accordance with the instructions provided and the patient information leaflet. Do not share prescribed medicines with anyone else. Keep all medicines out of the sight and reach of children.",
      },
      {
        type: "p",
        text: "If you experience any side effects, stop treatment where advised and contact us or seek medical attention. Suspected side effects can also be reported through the MHRA Yellow Card scheme.",
      },
    ],
  },
  {
    heading: "8. Your account",
    blocks: [
      {
        type: "p",
        text: "You are responsible for keeping your account details and password secure and for all activity that takes place under your account. Please notify us immediately if you believe your account has been accessed without your permission.",
      },
    ],
  },
  {
    heading: "9. Intellectual property",
    blocks: [
      {
        type: "p",
        text: "All content on joodlife.shop — including text, graphics, logos, images and the JoodLife name — is owned by or licensed to Jood and is protected by intellectual property laws. You may not reproduce, distribute or use our content without our prior written permission.",
      },
    ],
  },
  {
    heading: "10. Liability",
    blocks: [
      {
        type: "p",
        text: "Nothing in these terms limits or excludes our liability for death or personal injury caused by our negligence, for fraud, or for any other liability that cannot be limited or excluded by law. Subject to that, we are not liable for losses that were not foreseeable or that arise from your failure to follow the instructions provided with your treatment.",
      },
    ],
  },
  {
    heading: "11. Governing law",
    blocks: [
      {
        type: "p",
        text: "These terms are governed by the laws of England and Wales, and any disputes will be subject to the exclusive jurisdiction of the courts of England and Wales.",
      },
    ],
  },
] as PolicySection[],
};

export const REFUND_DEFAULT = {
  title: "Refund & Complaints",
  titleAccent: "Procedure",
  intro: "How we handle refunds and returns, and how to raise a complaint if something isn't right. We're committed to putting things right whenever we can.",
  updated: "11 August 2026",
  sections: [
  {
    heading: "Our commitment",
    blocks: [
      {
        type: "p",
        text: "We want you to be completely satisfied with your treatment and the service you receive from JoodLife. This procedure explains when you are entitled to a refund, how returns work for medicines, and how to raise a complaint if something has gone wrong.",
      },
    ],
  },
  {
    heading: "Refunds",
    blocks: [
      { type: "h", text: "Before your treatment is dispatched" },
      {
        type: "p",
        text: "If a prescriber declines to prescribe your treatment after payment has been taken, or if your order is cancelled before it is dispatched, you will receive a full refund of any amount paid. Refunds are made to your original payment method.",
      },
      { type: "h", text: "After your treatment is dispatched" },
      {
        type: "p",
        text: "For safety and legal reasons, prescription-only and pharmacy medicines cannot be returned, resold or reused once they have left our pharmacy — even if the packaging is unopened. This means we are generally unable to offer a refund on medicines that have already been dispatched.",
      },
      {
        type: "p",
        text: "We will, however, always put things right where an error has been made on our side — for example if you received the wrong item, a damaged item, or a faulty product. In these cases please contact us and we will arrange a replacement or refund as appropriate.",
      },
    ],
  },
  {
    heading: "Damaged, faulty or incorrect items",
    blocks: [
      {
        type: "p",
        text: "If your order arrives damaged, faulty, or is not what you ordered, please contact us within 14 days of receiving it. Where possible, include a photo of the item and packaging so we can resolve the issue quickly. We will arrange a replacement or refund at no cost to you.",
      },
    ],
  },
  {
    heading: "How to request a refund",
    blocks: [
      { type: "p", text: "To request a refund, please get in touch with our care team:" },
      {
        type: "list",
        items: [
          "Email support@joodlife.com with your order number and the reason for your request;",
          "Or message us on WhatsApp at 07756 099075; or",
          "Call us on 01494 424435.",
        ],
      },
      {
        type: "p",
        text: "Approved refunds are processed to your original payment method. Once processed, it may take a few working days for the funds to appear, depending on your bank or card provider.",
      },
    ],
  },
  {
    heading: "Making a complaint",
    blocks: [
      {
        type: "p",
        text: "We take all complaints seriously and use them to improve our service. If you are unhappy with any aspect of your care or the service you have received, please let us know so we can put it right.",
      },
      { type: "h", text: "How to complain" },
      {
        type: "p",
        text: "You can raise a complaint by emailing support@joodlife.com, messaging us on WhatsApp at 07756 099075, or calling 01494 424435. Please include your name, order number (if relevant) and a description of what went wrong.",
      },
      { type: "h", text: "What happens next" },
      {
        type: "list",
        items: [
          "We will acknowledge your complaint within 3 working days of receiving it;",
          "We will investigate and aim to provide a full response within 10 working days. If we need more time, we will let you know and keep you updated;",
          "Complaints involving clinical matters are reviewed by our Superintendent Pharmacist or an appropriate clinician.",
        ],
      },
    ],
  },
  {
    heading: "If you are still not satisfied",
    blocks: [
      {
        type: "p",
        text: "If we are unable to resolve your complaint to your satisfaction, you can escalate it to the General Pharmaceutical Council (GPhC), the independent regulator for pharmacies in Great Britain. Jood Pharmacy is registered with the GPhC under registration number 9012990.",
      },
    ],
  },
] as PolicySection[],
};

export const PRIVACY_DEFAULT = {
  title: "Privacy &",
  titleAccent: "Cookies",
  intro: "How we collect, use and protect your personal and health information, and how we use cookies on joodlife.shop. Your privacy matters to us.",
  updated: "11 August 2026",
  sections: [
  {
    heading: "Who we are",
    blocks: [
      {
        type: "p",
        text: "JoodLife is operated by Jood Ltd, with pharmacy services provided by Jood Pharmacy (GPhC registration number 9012990). For the purposes of UK data protection law, Jood Ltd is the data controller responsible for your personal information. This policy explains what information we collect, how we use it, and the rights you have over it.",
      },
    ],
  },
  {
    heading: "Information we collect",
    blocks: [
      { type: "p", text: "Depending on how you use our services, we may collect:" },
      {
        type: "list",
        items: [
          "Identity and contact details — such as your name, date of birth, email address, phone number and delivery address;",
          "Health information — the answers you give during your consultation, your medical history, and details relevant to your treatment;",
          "Order information — the products you order, payment confirmation (we do not store full card details) and delivery details;",
          "Technical information — such as your device, browser and IP address, and how you use our website.",
        ],
      },
    ],
  },
  {
    heading: "How we use your information",
    blocks: [
      { type: "p", text: "We use your information to:" },
      {
        type: "list",
        items: [
          "Provide clinical consultations and make safe prescribing decisions;",
          "Dispense, package and deliver your treatment;",
          "Manage your account, orders and reorders;",
          "Keep the records we are legally and professionally required to keep as a pharmacy;",
          "Communicate with you about your care, orders and — where you have agreed — our news and offers;",
          "Improve, secure and operate our website and services.",
        ],
      },
      {
        type: "p",
        text: "Our lawful bases for processing include the performance of our contract with you, our legal and regulatory obligations as a pharmacy, your consent (for example for marketing), and the provision of health care by professionals bound by a duty of confidentiality.",
      },
    ],
  },
  {
    heading: "Sharing your information",
    blocks: [
      {
        type: "p",
        text: "We only share your information where necessary — for example with our clinicians and pharmacy team, with delivery partners to fulfil your order, with payment providers to process payments, and with trusted service providers who help us operate the platform. We may also share information where required by law or by our regulators.",
      },
      {
        type: "p",
        text: "We never sell your personal or health information.",
      },
    ],
  },
  {
    heading: "How long we keep it",
    blocks: [
      {
        type: "p",
        text: "We keep your information for as long as necessary to provide our services and to meet our legal and professional record-keeping obligations as a pharmacy. Clinical and prescribing records are retained in line with NHS and GPhC guidance.",
      },
    ],
  },
  {
    heading: "Your rights",
    blocks: [
      { type: "p", text: "Under UK data protection law you have the right to:" },
      {
        type: "list",
        items: [
          "Access the personal information we hold about you;",
          "Ask us to correct inaccurate or incomplete information;",
          "Ask us to delete information, where we are not legally required to keep it;",
          "Object to or restrict certain processing;",
          "Withdraw consent for marketing at any time.",
        ],
      },
      {
        type: "p",
        text: "To exercise any of these rights, contact us at support@joodlife.com. You also have the right to complain to the Information Commissioner's Office (ICO) at ico.org.uk.",
      },
    ],
  },
  {
    heading: "Cookies",
    blocks: [
      {
        type: "p",
        text: "Cookies are small text files stored on your device when you visit a website. We use them to make joodlife.shop work, to remember your preferences, and to understand how the site is used so we can improve it.",
      },
      { type: "h", text: "Types of cookies we use" },
      {
        type: "list",
        items: [
          "Essential cookies — required for the site to function, such as keeping you signed in and remembering your basket. These cannot be switched off;",
          "Analytics cookies — help us understand how visitors use the site so we can improve it. These are only used where you have agreed;",
          "Marketing cookies — used, with your consent, to measure and improve the relevance of our advertising.",
        ],
      },
      {
        type: "p",
        text: "You can control or delete cookies through your browser settings at any time. Blocking essential cookies may affect how the site works.",
      },
    ],
  },
  {
    heading: "Contact us",
    blocks: [
      {
        type: "p",
        text: "If you have any questions about this policy or how we handle your information, please contact us at support@joodlife.com or call 01494 424435.",
      },
    ],
  },
] as PolicySection[],
};

export const POLICY_DEFAULTS = {
  terms: TERMS_DEFAULT,
  "refund-complaints": REFUND_DEFAULT,
  privacy: PRIVACY_DEFAULT,
};

export type PolicySlug = keyof typeof POLICY_DEFAULTS;
export const POLICY_SLUGS: PolicySlug[] = ["terms", "refund-complaints", "privacy"];
