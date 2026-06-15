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
