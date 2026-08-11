import PolicyPage, { type PolicySection } from "../PolicyPage";

export const metadata = {
  title: "Refund & Complaints Procedure — JoodLife",
  description:
    "How JoodLife handles refunds, returns and complaints, and how to get in touch if something isn't right with your order or care.",
};

const UPDATED = "11 August 2026";

const SECTIONS: PolicySection[] = [
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
];

export default function RefundComplaintsPage() {
  return (
    <PolicyPage
      title="Refund & Complaints"
      titleAccent="Procedure"
      intro="How we handle refunds and returns, and how to raise a complaint if something isn't right. We're committed to putting things right whenever we can."
      updated={UPDATED}
      sections={SECTIONS}
    />
  );
}
