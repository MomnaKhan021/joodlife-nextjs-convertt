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

  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#142e2a">
    <h1 style="font-size:22px;margin:0 0 16px">Reset your password</h1>
    <p style="font-size:15px;line-height:22px;margin:0 0 16px">
      Hi ${escapeHtml(firstName)}, we received a request to reset the password for
      your JoodLife account. Click the button below to choose a new one. This
      link expires in 1 hour.
    </p>
    <p style="margin:0 0 24px">
      <a href="${resetUrl}" style="display:inline-block;background:#142e2a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600">
        Reset my password
      </a>
    </p>
    <p style="font-size:13px;line-height:20px;color:#142e2a;opacity:.7;margin:0 0 8px">
      Or paste this link into your browser:<br />
      <a href="${resetUrl}" style="color:#142e2a;word-break:break-all">${escapeHtml(resetUrl)}</a>
    </p>
    <p style="font-size:13px;line-height:20px;color:#142e2a;opacity:.7;margin:0">
      If you didn't request this, you can safely ignore this email — your
      password won't change.
    </p>
  </div>`;
}

export async function sendWelcomeEmail(
  payload: Payload,
  user: { email: string; name?: string | null }
): Promise<void> {
  const url = siteUrl();
  const firstName = String(user.name ?? "").trim().split(/\s+/)[0] || "there";
  const loginUrl = `${url}/login`;

  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#142e2a">
    <h1 style="font-size:22px;margin:0 0 16px">Welcome to JoodLife, ${escapeHtml(firstName)} 👋</h1>
    <p style="font-size:15px;line-height:22px;margin:0 0 16px">
      Your account has been created successfully. You can now sign in to manage
      your treatments, orders and account details.
    </p>
    <p style="margin:0 0 24px">
      <a href="${loginUrl}" style="display:inline-block;background:#142e2a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600">
        Go to your account
      </a>
    </p>
    <p style="font-size:13px;line-height:20px;color:#142e2a;opacity:.7;margin:0">
      This account is registered to <strong>${escapeHtml(user.email)}</strong> at
      <a href="${url}" style="color:#142e2a">${escapeHtml(url)}</a>.
      If you didn't create this account, please ignore this email.
    </p>
  </div>`;

  const text = `Welcome to JoodLife, ${firstName}!

Your account (${user.email}) has been created successfully at ${url}.
Sign in any time at ${loginUrl}.

If you didn't create this account, please ignore this email.`;

  await payload.sendEmail({
    to: user.email,
    subject: "Welcome to JoodLife — your account is ready",
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
};

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
      return `<tr>
        <td style="padding:8px 0;font-size:14px;color:#142e2a">${name} × ${qty}</td>
        <td style="padding:8px 0;font-size:14px;color:#142e2a;text-align:right">${line}</td>
      </tr>`;
    })
    .join("");

  // The "Book consultation" CTA appears on every order-confirmation email
  // (both first orders and reorders) so the customer can always book.
  const bookConsultationBtn = `<p style="margin:0 0 24px">
        <a href="${url}/consultation?product=weight-loss" style="display:inline-block;background:#142e2a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600">
          Book consultation
        </a>
      </p>`;

  const nextStepHtml = opts.isReorder
    ? `<p style="font-size:15px;line-height:22px;margin:0 0 16px">
        Our pharmacist will review your resupply questionnaire and be in touch shortly.
      </p>
      ${bookConsultationBtn}`
    : `<p style="font-size:15px;line-height:22px;margin:0 0 16px">
        <strong>Next step:</strong> book your medical consultation so our
        clinicians can approve your treatment.
      </p>
      ${bookConsultationBtn}`;

  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#142e2a">
    <h1 style="font-size:22px;margin:0 0 8px">Thank you for your order, ${escapeHtml(firstName)}</h1>
    <p style="font-size:15px;line-height:22px;margin:0 0 16px">
      We've received your order <strong>${escapeHtml(opts.orderNumber)}</strong>.
      A clinician will review it before anything is dispatched.
    </p>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #e7e8e3;border-bottom:1px solid #e7e8e3;margin:0 0 12px">
      ${rows}
    </table>
    <p style="font-size:15px;font-weight:600;margin:0 0 20px;text-align:right">
      Total: ${gbp(opts.total)}
    </p>
    ${nextStepHtml}
    <p style="font-size:13px;line-height:20px;color:#142e2a;opacity:.7;margin:0">
      Order placed at <a href="${url}" style="color:#142e2a">${escapeHtml(url)}</a>.
      Questions? Just reply to this email.
    </p>
  </div>`;

  const bookText = `Book your consultation: ${url}/consultation?product=weight-loss`;
  const nextStepText = opts.isReorder
    ? `Our pharmacist will review your resupply questionnaire and be in touch shortly.\n${bookText}`
    : `Next step: book your medical consultation so our clinicians can approve your treatment.\n${bookText}`;

  const text = `Thank you for your order, ${firstName}!

Order ${opts.orderNumber}
${opts.items.map((it) => `- ${it.title}${it.dose ? ` (${it.dose})` : ""} x ${it.quantity}`).join("\n")}
Total: ${gbp(opts.total)}

${nextStepText}

Order placed at ${url}. Questions? Just reply to this email.`;

  await payload.sendEmail({
    to: opts.email,
    subject: `Thank you for your order — ${opts.orderNumber}`,
    html,
    text,
  });
}
