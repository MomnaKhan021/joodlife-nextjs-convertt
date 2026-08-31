/**
 * Account-creation ("welcome") email.
 *
 * Sent once, when a customer account is first created. Delivery goes through
 * whatever email adapter is configured on the Payload instance
 * (see `resolveEmailAdapter` in payload.config.ts) — real SMTP in production,
 * the console adapter (logs only) in dev when SMTP env vars are absent.
 *
 * Called fire-and-forget from the Users `afterChange` hook, mirroring the
 * HubSpot sync: a mail failure must never break account creation itself.
 */
import type { Payload } from "payload";

/** HubSpot meeting scheduler the "Book consultation" CTA links to. */
const BOOKING_URL = "https://meetings-eu1.hubspot.com/jood-life";

function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SERVER_URL ||
    process.env.PAYLOAD_PUBLIC_SERVER_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://joodlife.com");
  return raw.replace(/\/$/, "");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const BRAND = "#142e2a";

/**
 * Shared branded email shell. Every outbound email is wrapped in this so they
 * all carry the Jood logo, typography, colours and pharmacy footer — one
 * consistent, trustworthy look instead of the plain, scam-looking messages.
 */
export function emailShell(
  inner: string,
  opts?: { preheader?: string; baseUrl?: string },
): string {
  const url = (opts?.baseUrl || siteUrl()).replace(/\/$/, "");
  const logo = `${url}/assets/figma/footer-logo-2.png`;
  const year = new Date().getFullYear();
  const preheader = opts?.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(
        opts.preheader,
      )}</div>`
    : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light only" /></head>
<body style="margin:0;padding:0;background:#eef1e9;-webkit-font-smoothing:antialiased">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1e9;padding:24px 0">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:92%;background:#ffffff;border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
      <tr><td style="background:${BRAND};padding:22px 32px">
        <img src="${logo}" alt="JoodLife" height="34" style="height:34px;width:auto;display:block;border:0" />
      </td></tr>
      <tr><td style="padding:32px;color:${BRAND}">
        ${inner}
      </td></tr>
      <tr><td style="background:${BRAND};padding:22px 32px">
        <p style="margin:0 0 6px;font-size:13px;line-height:19px;color:#ffffff;font-weight:600">JoodLife — clinically guided care, delivered discreetly.</p>
        <p style="margin:0 0 8px;font-size:12px;line-height:18px;color:rgba(255,255,255,.72)">
          <a href="${url}" style="color:#d3dabe;text-decoration:none">${escapeHtml(url.replace(/^https?:\/\//, ""))}</a>
          &nbsp;·&nbsp; Questions? Just reply to this email.
        </p>
        <p style="margin:0;font-size:11px;line-height:16px;color:rgba(255,255,255,.55)">
          © ${year} Jood Pharmacy, a GPhC-registered pharmacy (9012990). Medicines are dispensed and delivered in accordance with GPhC and MHRA guidance.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

/** A brand CTA button (dark-green pill). */
function btn(href: string, label: string): string {
  return `<p style="margin:0 0 8px"><a href="${href}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:13px 24px;border-radius:10px;font-size:14px;font-weight:600">${label}</a></p>`;
}

/**
 * "Please book your video consultation" reminder — sent from the Clinical
 * Queue for patients who submitted but haven't booked their call yet. Uses the
 * same HubSpot scheduler CTA as the order emails. Delivery goes through the
 * configured adapter (real SMTP in prod, console in dev).
 */
export async function sendConsultationReminderEmail(
  payload: Payload,
  opts: { email: string; name?: string | null },
): Promise<void> {
  const url = siteUrl();
  const firstName = String(opts.name ?? "").trim().split(/\s+/)[0] || "there";

  const html = emailShell(
    `<h1 style="font-size:22px;margin:0 0 12px;color:#142e2a">Book your consultation, ${escapeHtml(firstName)}</h1>
     <p style="font-size:15px;line-height:22px;margin:0 0 20px;color:#142e2a">
       We've received your questionnaire, but we still need a short video
       consultation with our clinician before your treatment can be approved and
       dispatched. It only takes a few minutes.
     </p>
     ${btn(BOOKING_URL, "Book my consultation")}`,
    { preheader: "Book your video consultation to continue" },
  );

  const text = `Hi ${firstName},

We've received your questionnaire, but we still need a short video consultation before your treatment can be approved and dispatched.

Book your consultation: ${BOOKING_URL}

From the team at ${url}.`;

  await payload.sendEmail({
    to: opts.email,
    subject: "Book your JoodLife video consultation",
    html,
    text,
  });
}

/**
 * Two-factor login code — the "email code" alternative to an authenticator
 * app. Sent to an admin's own address; valid for a few minutes.
 */
export async function sendTwoFactorCodeEmail(
  payload: Payload,
  opts: { email: string; code: string; name?: string | null },
): Promise<void> {
  const firstName = String(opts.name ?? "").trim().split(/\s+/)[0] || "there";
  const html = emailShell(
    `<h1 style="font-size:20px;margin:0 0 12px;color:#142e2a">Your JoodLife admin code</h1>
     <p style="font-size:15px;line-height:22px;margin:0 0 16px;color:#142e2a">
       Hi ${escapeHtml(firstName)}, use this code to finish signing in to the admin portal. It expires in 5 minutes.
     </p>
     <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:0 0 16px;color:#142e2a">${escapeHtml(opts.code)}</p>
     <p style="font-size:13px;line-height:20px;color:#142e2a;opacity:.7;margin:0">
       If you didn't try to sign in, someone may have your password — change it as soon as you can.
     </p>`,
    { preheader: "Your admin sign-in code" },
  );
  const text = `Your JoodLife admin sign-in code is ${opts.code}. It expires in 5 minutes. If you didn't request it, change your password.`;
  await payload.sendEmail({
    to: opts.email,
    subject: `${opts.code} is your JoodLife admin code`,
    html,
    text,
  });
}

/**
 * HTML for the "reset your password" email. Wired into the Users auth config
 * (`auth.forgotPassword.generateEmailHTML`) so the link points at the
 * STOREFRONT reset page (`/reset-password?token=…`) instead of Payload's
 * default admin reset route. Delivery uses the configured email adapter +
 * `serverURL`.
 */
export function resetPasswordEmailHTML(opts: {
  siteUrl: string;
  token: string;
  name?: string | null;
}): string {
  const url = (opts.siteUrl || "https://joodlife.com").replace(/\/$/, "");
  const resetUrl = `${url}/reset-password?token=${encodeURIComponent(opts.token)}`;
  const firstName =
    String(opts.name ?? "").trim().split(/\s+/)[0] || "there";

  return emailShell(
    `<h1 style="font-size:22px;margin:0 0 16px;color:#142e2a">Reset your password</h1>
     <p style="font-size:15px;line-height:22px;margin:0 0 20px;color:#142e2a">
       Hi ${escapeHtml(firstName)}, we received a request to reset the password for
       your JoodLife account. Click the button below to choose a new one. This
       link expires in 1 hour.
     </p>
     ${btn(resetUrl, "Reset my password")}
     <p style="font-size:13px;line-height:20px;color:#142e2a;opacity:.7;margin:12px 0 0">
       Or paste this link into your browser:<br />
       <a href="${resetUrl}" style="color:#142e2a;word-break:break-all">${escapeHtml(resetUrl)}</a>
     </p>
     <p style="font-size:13px;line-height:20px;color:#142e2a;opacity:.7;margin:12px 0 0">
       If you didn't request this, you can safely ignore this email — your
       password won't change.
     </p>`,
    { baseUrl: url, preheader: "Reset your JoodLife password" },
  );
}

export async function sendWelcomeEmail(
  payload: Payload,
  user: { email: string; name?: string | null }
): Promise<void> {
  const url = siteUrl();
  const firstName = String(user.name ?? "").trim().split(/\s+/)[0] || "there";
  // "Start My Assessment" opens the weight-loss questionnaire.
  const assessmentUrl = `${url}/consultation?product=weight-loss`;
  const howUrl = `${url}/#how-it-works`;
  const img = `${url}/assets/email`;

  const step = (n: string, thumb: string, title: string, body: string) => `
    <tr>
      <td width="64" valign="top" style="padding:0 14px 18px 0">
        <img src="${thumb}" alt="" width="56" height="56" style="width:56px;height:56px;border-radius:10px;object-fit:cover;display:block;border:0" />
      </td>
      <td valign="top" style="padding:0 0 18px">
        <p style="margin:0 0 3px;font-size:11px;font-weight:700;letter-spacing:.06em;color:#3f5c50">STEP ${n}</p>
        <p style="margin:0 0 3px;font-size:15px;font-weight:700;color:${BRAND}">${title}</p>
        <p style="margin:0;font-size:13px;line-height:19px;color:rgba(20,46,42,.72)">${body}</p>
      </td>
    </tr>`;

  const inner = `
    <!-- Hero -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7ee;border-radius:16px;overflow:hidden">
      <tr><td style="padding:28px 26px 8px">
        <h1 style="margin:0 0 4px;font-size:26px;line-height:1.15;color:${BRAND};font-weight:600">Your Journey</h1>
        <p style="margin:0 0 14px;font-size:28px;line-height:1.1;color:${BRAND};font-style:italic;font-family:Georgia,'Times New Roman',serif">Start Here</p>
        <p style="margin:0 0 20px;font-size:14px;line-height:21px;color:rgba(20,46,42,.8)">
          Hi ${escapeHtml(firstName)} — we make weight loss simple with clinician-led care, personalised treatment options, and ongoing support, all from home.
        </p>
        ${btn(assessmentUrl, "Start My Assessment")}
      </td></tr>
      <tr><td style="padding:6px 0 0">
        <img src="${img}/welcome-hero.jpg" alt="Start your weight-loss journey with JoodLife" width="600" style="width:100%;max-width:600px;height:auto;display:block;border:0" />
      </td></tr>
    </table>

    <!-- How it works -->
    <h2 style="margin:30px 0 16px;font-size:20px;color:${BRAND};font-weight:600;text-align:center">Here&rsquo;s how it <span style="font-style:italic;font-family:Georgia,serif;font-weight:400">works</span></h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${step("1", `${img}/welcome-step-1.jpg`, "Tell us about your goals.", "Complete a short online assessment so we understand your needs.")}
      ${step("2", `${img}/welcome-step-2.jpg`, "Our pharmacy team checks your suitability.", "Your answers are reviewed against clinical eligibility criteria by our GPhC-registered pharmacy.")}
      ${step("3", `${img}/welcome-step-3.jpg`, "Receive your next step.", "If your treatment is suitable, we&rsquo;ll guide you from there.")}
    </table>

    <!-- CTA banner -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;background:${BRAND};border-radius:16px;overflow:hidden">
      <tr><td style="padding:26px 26px 4px">
        <p style="margin:0 0 4px;font-size:22px;line-height:1.2;color:#ffffff;font-weight:600">It takes a few minutes.</p>
        <p style="margin:0 0 18px;font-size:22px;line-height:1.2;color:#ffffff;font-weight:600">There&rsquo;s <span style="font-style:italic;font-family:Georgia,serif;font-weight:400">no</span> commitment to begin.</p>
        <a href="${assessmentUrl}" style="display:inline-block;background:#ffffff;color:${BRAND};text-decoration:none;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:700;margin:0 8px 8px 0">Start My Assessment</a>
        <a href="${howUrl}" style="display:inline-block;background:transparent;color:#ffffff;text-decoration:none;padding:11px 21px;border-radius:10px;font-size:14px;font-weight:600;border:1px solid rgba(255,255,255,.55)">See How Jood Works</a>
      </td></tr>
      <tr><td align="right" style="padding:8px 0 0">
        <img src="${img}/welcome-cta.jpg" alt="" width="300" style="width:60%;max-width:300px;height:auto;display:block;margin-left:auto;border:0" />
      </td></tr>
    </table>

    <p style="font-size:12px;line-height:18px;color:rgba(20,46,42,.6);margin:22px 0 0;text-align:center">
      This account is registered to <strong>${escapeHtml(user.email)}</strong>. If you didn&rsquo;t create it, please ignore this email.
    </p>`;

  // Bespoke shell matching the JoodLife 2.0 welcome design: a "WELCOME TO
  // JOODLIFE" strip on top and the full pharmacy footer (contact + links +
  // GPhC badge + legal) at the bottom.
  const year = new Date().getFullYear();
  const logo = `${url}/assets/figma/footer-logo-2.png`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light only"/></head>
<body style="margin:0;padding:0;background:#eef1e9;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">Your journey starts here — begin your free assessment.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1e9;padding:24px 0">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:92%;background:#ffffff;border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
      <!-- WELCOME strip -->
      <tr><td style="background:${BRAND};padding:12px 24px;text-align:center">
        <span style="font-size:12px;font-weight:700;letter-spacing:.14em;color:#ffffff">WELCOME TO JOODLIFE</span>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:28px;color:${BRAND}">
        ${inner}
      </td></tr>
      <!-- Footer (Figma) -->
      <tr><td style="background:${BRAND};padding:28px 28px 24px">
        <p style="margin:0 0 4px;font-size:14px;color:#ffffff;text-align:center">
          <strong>Questions?</strong> <a href="${url}/support" style="color:#d3dabe;text-decoration:none">Talk to our team</a>
        </p>
        <p style="margin:0 0 18px;font-size:13px;color:rgba(255,255,255,.75);text-align:center">Or just reply to this email.</p>
        <div style="border-top:1px solid rgba(255,255,255,.16);margin:0 0 18px"></div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td valign="middle" style="font-size:13px;line-height:22px">
            <a href="${url}/shop" style="color:rgba(255,255,255,.85);text-decoration:none">Treatments</a><br/>
            <a href="${url}/policies/privacy" style="color:rgba(255,255,255,.85);text-decoration:none">Privacy Policy</a>
          </td>
          <td valign="middle" align="right">
            <img src="${logo}" alt="JOOD" height="30" style="height:30px;width:auto;display:inline-block;border:0"/>
          </td>
        </tr></table>
        <div style="margin:16px 0 14px"><img src="${url}/assets/email/badge-gphc.png" alt="GPhC registered pharmacy" height="34" style="height:34px;width:auto;display:inline-block;border:0"/></div>
        <p style="margin:0;font-size:10.5px;line-height:16px;color:rgba(255,255,255,.6)">
          © ${year} Jood. All rights reserved. Superintendent Pharmacist: Zahhaad Khalil (2228969).
          Powered by Jood Pharmacy, a GPhC-registered pharmacy (9012990) operating under Jood Ltd.
          Clinical, consultation and prescribing services are provided by UK-registered prescribers.
          All medicines are dispensed and delivered in accordance with GPhC and MHRA guidance.
          All Pharmacy operations are temporarily taking place at Weaverham Pharmacy (1029683).
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const text = `Welcome to JoodLife, ${firstName}!

Your journey starts here. We make weight loss simple with clinician-led care, personalised treatment options and ongoing support, all from home.

How it works:
1. Tell us about your goals — complete a short online assessment.
2. Our GPhC-registered pharmacy team checks your suitability.
3. Receive your next step — if suitable, we guide you from there.

Start your assessment: ${assessmentUrl}

This account is registered to ${user.email}. If you didn't create it, please ignore this email.`;

  await payload.sendEmail({
    to: user.email,
    subject: "Your JoodLife journey starts here",
    html,
    text,
  });
}

/**
 * Order-confirmation ("thank you for your purchase") email. Sent right after
 * an order is created at checkout. Delivery uses the same configured email
 * adapter — so it only actually sends when SMTP env vars are present.
 */
export type OrderEmailItem = {
  title: string;
  dose?: string | null;
  quantity: number;
  price?: number | null;
  imageUrl?: string | null;
};

/** Emails need ABSOLUTE image URLs — prefix relative /assets paths with the
 *  site origin; leave full http(s) URLs (e.g. Vercel blob) untouched. */
function absoluteImageUrl(src: string | null | undefined, base: string): string | null {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;
  return `${base}${src.startsWith("/") ? "" : "/"}${src}`;
}

export async function sendOrderConfirmationEmail(
  payload: Payload,
  opts: {
    email: string;
    name?: string | null;
    orderNumber: string;
    total: number;
    items: OrderEmailItem[];
    isReorder?: boolean;
  }
): Promise<void> {
  const url = siteUrl();
  const firstName = String(opts.name ?? "").trim().split(/\s+/)[0] || "there";
  const gbp = (n: number) =>
    `£${Number(n || 0).toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const rows = opts.items
    .map((it) => {
      const name = escapeHtml(
        `${it.title}${it.dose ? ` — ${it.dose}` : ""}`
      );
      const qty = Math.max(1, Number(it.quantity) || 1);
      const line =
        it.price != null ? gbp(Number(it.price) * qty) : "";
      const img = absoluteImageUrl(it.imageUrl, url);
      const imgCell = img
        ? `<td width="56" style="padding:8px 12px 8px 0;vertical-align:middle"><img src="${img}" width="48" height="48" alt="" style="width:48px;height:48px;border-radius:8px;object-fit:cover;display:block;background:#f2ecf2" /></td>`
        : "";
      return `<tr>
        ${imgCell}
        <td style="padding:8px 0;font-size:14px;color:#142e2a;vertical-align:middle">${name} × ${qty}</td>
        <td style="padding:8px 0;font-size:14px;color:#142e2a;text-align:right;vertical-align:middle">${line}</td>
      </tr>`;
    })
    .join("");

  // The "Book consultation" CTA appears on every order-confirmation email
  // (both first orders and reorders) and books via the HubSpot scheduler.
  const bookConsultationBtn = `<p style="margin:0 0 24px">
        <a href="${BOOKING_URL}" style="display:inline-block;background:#142e2a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600">
          Book consultation
        </a>
      </p>`;

  const nextStepHtml = opts.isReorder
    ? `<p style="font-size:15px;line-height:22px;margin:0 0 16px">
        Our pharmacist will review your resupply questionnaire and be in touch shortly.
        <strong>You need to book a consultation to get your medication.</strong>
        Click the button below to book your consultation.
      </p>
      ${bookConsultationBtn}`
    : `<p style="font-size:15px;line-height:22px;margin:0 0 16px">
        <strong>You need to book a consultation to get your medication.</strong>
        Click the button below to book your consultation.
      </p>
      ${bookConsultationBtn}`;

  const html = emailShell(
    `<h1 style="font-size:22px;margin:0 0 8px;color:#142e2a">Thank you for your order, ${escapeHtml(firstName)}</h1>
     <p style="font-size:15px;line-height:22px;margin:0 0 16px;color:#142e2a">
       We've received your order <strong>${escapeHtml(opts.orderNumber)}</strong>.
       A clinician will review it before anything is dispatched.
     </p>
     <table style="width:100%;border-collapse:collapse;border-top:1px solid #e7e8e3;border-bottom:1px solid #e7e8e3;margin:0 0 12px">
       ${rows}
     </table>
     <p style="font-size:15px;font-weight:600;margin:0 0 20px;text-align:right;color:#142e2a">
       Total: ${gbp(opts.total)}
     </p>
     ${nextStepHtml}`,
    { preheader: `Order ${opts.orderNumber} received — book your consultation` },
  );

  const bookText = `Book your consultation: ${BOOKING_URL}`;
  const nextStepText = opts.isReorder
    ? `Our pharmacist will review your resupply questionnaire and be in touch shortly. You need to book a consultation to get your medication.\n${bookText}`
    : `You need to book a consultation to get your medication. Click below to book.\n${bookText}`;

  const text = `Thank you for your order, ${firstName}!

Order ${opts.orderNumber}
${opts.items.map((it) => `- ${it.title}${it.dose ? ` (${it.dose})` : ""} x ${it.quantity}`).join("\n")}
Total: ${gbp(opts.total)}

${nextStepText}

Order placed at ${url}. Questions? Just reply to this email.`;

  // Short product summary for the subject lines, e.g. "Mounjaro (5 mg)" or
  // "Wegovy Pills +1 more".
  const firstItem = opts.items[0];
  const firstLabel = firstItem
    ? `${firstItem.title}${firstItem.dose ? ` (${firstItem.dose})` : ""}`
    : "Your order";
  const productSummary =
    opts.items.length > 1
      ? `${firstLabel} +${opts.items.length - 1} more`
      : firstLabel;

  // Customer confirmation — subject now leads with the product + price.
  await payload.sendEmail({
    to: opts.email,
    subject: `${productSummary} — ${gbp(opts.total)} · Order ${opts.orderNumber}`,
    html,
    text,
  });

  // Admin/ops notification — so the team sees every purchase and can
  // dispatch it. Sent to ORDER_NOTIFY_EMAIL (falls back to the seed admin,
  // then hello@joodlife.com). Fire-and-forget: never breaks the customer email.
  const adminTo = (
    process.env.ORDER_NOTIFY_EMAIL ||
    process.env.SEED_ADMIN_EMAIL ||
    "hello@joodlife.com"
  ).trim();
  if (adminTo) {
    const adminRows = opts.items
      .map((it) => {
        const name = escapeHtml(`${it.title}${it.dose ? ` — ${it.dose}` : ""}`);
        const qty = Math.max(1, Number(it.quantity) || 1);
        const line = it.price != null ? gbp(Number(it.price) * qty) : "";
        const img = absoluteImageUrl(it.imageUrl, url);
        const imgCell = img
          ? `<td width="52" style="padding:6px 10px 6px 0;vertical-align:middle"><img src="${img}" width="44" height="44" alt="" style="width:44px;height:44px;border-radius:8px;object-fit:cover;display:block;background:#f2ecf2" /></td>`
          : "";
        return `<tr>
          ${imgCell}
          <td style="padding:6px 0;font-size:14px;color:#142e2a;vertical-align:middle">${name} × ${qty}</td>
          <td style="padding:6px 0;font-size:14px;color:#142e2a;text-align:right;vertical-align:middle">${line}</td>
        </tr>`;
      })
      .join("");
    const adminHtml = emailShell(
      `<h1 style="font-size:20px;margin:0 0 8px;color:#142e2a">New order — ${escapeHtml(opts.orderNumber)}</h1>
       <p style="font-size:14px;line-height:22px;margin:0 0 14px;color:#142e2a">
         <strong>${escapeHtml(opts.name || "Customer")}</strong>
         (${escapeHtml(opts.email)}) placed an order${opts.isReorder ? " (reorder)" : ""}.
       </p>
       <table style="width:100%;border-collapse:collapse;border-top:1px solid #e7e8e3;border-bottom:1px solid #e7e8e3;margin:0 0 8px">
         ${adminRows}
       </table>
       <p style="font-size:15px;font-weight:700;margin:0 0 18px;text-align:right;color:#142e2a">Total: ${gbp(opts.total)}</p>
       ${btn(`${url}/admin-tools/dispensing-queue`, "Open To Dispatch")}`,
      { preheader: `New order ${opts.orderNumber} from ${opts.name || opts.email}` },
    );
    const adminText = `New order ${opts.orderNumber}
Customer: ${opts.name || "Customer"} (${opts.email})${opts.isReorder ? " (reorder)" : ""}
${opts.items
  .map(
    (it) =>
      `- ${it.title}${it.dose ? ` (${it.dose})` : ""} x ${it.quantity}${
        it.price != null ? ` — ${gbp(Number(it.price) * Math.max(1, Number(it.quantity) || 1))}` : ""
      }`,
  )
  .join("\n")}
Total: ${gbp(opts.total)}
Dispatch: ${url}/admin-tools/dispensing-queue`;
    try {
      await payload.sendEmail({
        to: adminTo,
        subject: `New order ${opts.orderNumber} — ${productSummary} — ${gbp(opts.total)}`,
        html: adminHtml,
        text: adminText,
      });
    } catch {
      /* non-fatal — the customer confirmation already went out */
    }
  }
}

/**
 * Abandoned-cart reminder — nudges a shopper who left items in their cart
 * without completing checkout. Sent from the Abandoned Checkout queue (manual)
 * and the daily reminder cron (automated). A WhatsApp contact link is included
 * so recipients can reply on WhatsApp; the message itself goes via email.
 */
export async function sendAbandonedCartEmail(
  payload: Payload,
  opts: {
    email: string;
    name?: string | null;
    items?: Array<{ title?: string | null; dose?: string | null; quantity?: number }>;
    total?: number | null;
    whatsapp?: string | null;
  },
): Promise<void> {
  const url = siteUrl();
  const firstName = String(opts.name ?? "").trim().split(/\s+/)[0] || "there";
  const checkoutUrl = `${url}/checkout`;
  const waNumber = (opts.whatsapp ?? "447756099075").replace(/[^\d]/g, "");
  const waLink = `https://wa.me/${waNumber}`;

  const lines = (opts.items ?? [])
    .filter((i) => (i.title ?? "").trim())
    .map(
      (i) =>
        `<li style="margin:0 0 4px">${escapeHtml(String(i.title))}${
          i.dose ? ` · ${escapeHtml(String(i.dose))}` : ""
        }${i.quantity && i.quantity > 1 ? ` × ${i.quantity}` : ""}</li>`,
    )
    .join("");
  const itemsHtml = lines
    ? `<ul style="font-size:14px;line-height:20px;margin:0 0 16px;padding-left:18px;color:#142e2a">${lines}</ul>`
    : "";

  const html = emailShell(
    `<h1 style="font-size:22px;margin:0 0 12px;color:#142e2a">You left something behind, ${escapeHtml(firstName)}</h1>
     <p style="font-size:15px;line-height:22px;margin:0 0 16px;color:#142e2a">
       Your items are still saved in your basket. Pick up right where you left
       off — it only takes a moment to complete your order.
     </p>
     ${itemsHtml}
     ${btn(checkoutUrl, "Complete my order")}
     <p style="font-size:13px;line-height:20px;color:#142e2a;opacity:.75;margin:12px 0 0">
       Prefer to chat? Message us on
       <a href="${waLink}" style="color:#142e2a;font-weight:600">WhatsApp</a>
       and we'll help you finish up.
     </p>`,
    { preheader: "Your basket is waiting — complete your order" },
  );

  const text = `Hi ${firstName},

Your items are still saved in your basket — complete your order here: ${checkoutUrl}

Prefer to chat? Message us on WhatsApp: ${waLink}

From the team at ${url}.`;

  await payload.sendEmail({
    to: opts.email,
    subject: "You left items in your basket — complete your order",
    html,
    text,
  });
}
