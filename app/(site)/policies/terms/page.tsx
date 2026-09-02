import PolicyPage, { type PolicySection } from "../PolicyPage";

export const metadata = {
  title: "Terms & Conditions — JoodLife",
  description:
    "The terms and conditions that govern your use of JoodLife and the clinical, pharmacy and delivery services provided by Jood Pharmacy.",
};

const UPDATED = "11 August 2026";

const SECTIONS: PolicySection[] = [
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
        text: "By accessing joodlife.com, completing a consultation, or placing an order, you confirm that you accept these terms and conditions and that you agree to comply with them. If you do not agree to these terms, you must not use our services.",
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
        text: "All content on joodlife.com — including text, graphics, logos, images and the JoodLife name — is owned by or licensed to Jood and is protected by intellectual property laws. You may not reproduce, distribute or use our content without our prior written permission.",
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
];

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms &"
      titleAccent="conditions"
      intro="These terms govern your use of JoodLife and the clinical, pharmacy and delivery services we provide. Please read them carefully before using our services."
      updated={UPDATED}
      sections={SECTIONS}
    />
  );
}
