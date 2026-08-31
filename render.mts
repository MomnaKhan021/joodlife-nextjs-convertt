import { sendAssessmentReminderEmail } from "./lib/account-email.js";
import { writeFileSync } from "node:fs";

const captured: { subject?: string; html?: string } = {};
const payload = {
  sendEmail: async (m: { subject: string; html: string }) => {
    captured.subject = m.subject;
    captured.html = m.html;
  },
} as never;

await sendAssessmentReminderEmail(payload, {
  email: "momnakhan021@gmail.com",
  name: "Momna Khan",
  productSlug: "weight-loss",
  attempt: 1,
});
writeFileSync("/tmp/email-preview/assessment-reminder.html", captured.html ?? "");
console.log("SUBJECT:", captured.subject);
console.log("bytes:", (captured.html ?? "").length);
