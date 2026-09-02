import PolicyPage, { type PolicySection } from "../PolicyPage";

export const metadata = {
  title: "Privacy & Cookies Policy — JoodLife",
  description:
    "How JoodLife and Jood Pharmacy collect, use and protect your personal and health information, and how we use cookies on joodlife.com.",
};

const UPDATED = "11 August 2026";

const SECTIONS: PolicySection[] = [
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
        text: "Cookies are small text files stored on your device when you visit a website. We use them to make joodlife.com work, to remember your preferences, and to understand how the site is used so we can improve it.",
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
];

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy &"
      titleAccent="Cookies"
      intro="How we collect, use and protect your personal and health information, and how we use cookies on joodlife.com. Your privacy matters to us."
      updated={UPDATED}
      sections={SECTIONS}
    />
  );
}
