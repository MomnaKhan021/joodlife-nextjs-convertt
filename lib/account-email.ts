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

/* ------------------------------------------------------------------ */
/* Shared pieces for the PHASE-1 Figma emails                          */
/* ------------------------------------------------------------------ */

/** Brand font stacks used across the Figma email set. */
export const EMAIL_FONTS = {
  GIL: `'Gilroy',Helvetica,Arial,sans-serif`,
  SER: `'Clearface',Georgia,'Times New Roman',serif`,
  SANS: `'Outfit',Helvetica,Arial,sans-serif`,
} as const;

/** @font-face block plus the shared responsive rules for the Figma emails. */
export function emailFontCss(url: string): string {
  return `
    @font-face{font-family:'Gilroy';font-weight:500;font-style:normal;font-display:swap;src:url('${url}/fonts/Gilroy-Medium.woff2') format('woff2')}
    @font-face{font-family:'Gilroy';font-weight:700;font-style:normal;font-display:swap;src:url('${url}/fonts/Gilroy-Bold.woff2') format('woff2')}
    @font-face{font-family:'Clearface';font-weight:400;font-style:italic;font-display:swap;src:url('${url}/fonts/ClearfaceRegularItalic.woff2') format('woff2')}
    @font-face{font-family:'Outfit';font-weight:400;font-display:swap;src:url('${url}/fonts/Outfit-Regular.woff2') format('woff2')}
    @font-face{font-family:'Outfit';font-weight:500;font-display:swap;src:url('${url}/fonts/Outfit-Medium.woff2') format('woff2')}
    @font-face{font-family:'Outfit';font-weight:600;font-display:swap;src:url('${url}/fonts/Outfit-SemiBold.woff2') format('woff2')}
    @font-face{font-family:'Outfit';font-weight:700;font-display:swap;src:url('${url}/fonts/Outfit-Bold.woff2') format('woff2')}
    *{letter-spacing:0 !important}
    @media only screen and (max-width:620px){
      table.em-wrap,table.em-card,table.stack{width:100% !important;min-width:0 !important;max-width:100% !important}
      td.stack{display:block !important;width:100% !important;box-sizing:border-box !important}
      td.card-copy{display:block !important;width:100% !important;box-sizing:border-box !important;padding:22px 20px 24px !important}
      td.card-art{display:block !important;width:100% !important;box-sizing:border-box !important;text-align:center !important;padding:0 !important}
      td.card-art img{width:100% !important;max-width:260px !important;height:auto !important}
      td.btn{display:block !important;width:100% !important;box-sizing:border-box !important;margin:0 0 10px !important}
      td.gap{display:none !important;height:0 !important;line-height:0 !important;font-size:0 !important}
      td.f-links{display:block !important;width:100% !important;text-align:center !important;padding:0 0 14px !important}
      td.f-logo{display:block !important;width:100% !important;text-align:center !important}
      .f-badges{text-align:center !important}
      .f-badges img{max-width:100% !important;height:auto !important}
    }
  `;
}

/**
 * The Figma pharmacy footer, shared by every branded email so the set can't
 * drift apart. Designed once against the file; callers just drop it in.
 */
export function emailFooterHtml(url: string): string {
  const { SANS } = EMAIL_FONTS;
  const img = `${url}/assets/email`;
  const year = new Date().getFullYear();
  return `<tr><td style="background:${BRAND};padding:40px 28px 20px">
        <p style="margin:0 0 10px;font-family:${SANS};font-size:16px;line-height:20px;color:#fcfbf8;text-align:center">
          <span style="font-weight:500">Questions?</span> <a href="${url}/support" style="font-weight:400;color:#fcfbf8;text-decoration:none">Talk to our team</a>
        </p>
        <p style="margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:20px;color:#fcfbf8;text-align:center">
          <span style="font-weight:400">Email us at</span> <a href="mailto:hello@joodlife.com" style="font-weight:700;color:#fcfbf8;text-decoration:none">hello@joodlife.com</a>
        </p>
        <div style="border-top:1px solid rgba(255,255,255,.28);font-size:0;line-height:0">&nbsp;</div>
        <table role="presentation" width="544" cellpadding="0" cellspacing="0" class="stack" style="width:544px;max-width:100%">
          <tr>
            <td class="f-links" valign="middle" style="padding:20px 0 0;font-family:${SANS};font-size:16px;font-weight:400;line-height:26px">
              <a href="${url}/shop" style="color:#fcfbf8;text-decoration:none">Treatments</a><br/>
              <a href="${url}/policies/privacy" style="color:#fcfbf8;text-decoration:none">Privacy Policy</a>
            </td>
            <td class="f-logo" valign="middle" align="right" style="padding:20px 0 0">
              <img src="${img}/jood-logo.png" alt="JOOD" width="218" height="61" style="width:218px;max-width:100%;height:auto;display:inline-block;border:0"/>
            </td>
          </tr>
        </table>
        <div class="f-badges" style="margin:8px 0 14px;text-align:right;font-size:0;line-height:0">
          <img src="${img}/badges-row.png" alt="LegitScript Certified &middot; Registered Pharmacy 9012990 &middot; Apple Pay &middot; Google Pay &middot; Stripe" width="241" height="61" style="width:241px;max-width:100%;height:auto;display:inline-block;border:0"/>
        </div>
        <div style="border-top:1px solid rgba(255,255,255,.28);font-size:0;line-height:0">&nbsp;</div>
        <p style="margin:26px 0 0;font-family:${SANS};font-size:14px;font-weight:400;line-height:18px;color:#ffffff;text-align:center">
          &copy; ${year} Jood. All rights reserved. Superintendent Pharmacist: Zahhaad Khalil (2228969)
          Powered by Jood Pharmacy, a GPhC-registered pharmacy (9012990) operating under Jood Ltd.
          Clinical, consultation and prescribing services are provided by UK-registered prescribers.
          All medicines are dispensed and delivered in accordance with GPhC and MHRA guidance.
          All Pharmacy operations are temporarily taking place at Weaverham Pharmacy (1029683).
        </p>
      </td></tr>`;
}


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
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="em-wrap" style="width:600px;max-width:96%;background:#ffffff;border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
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
  const year = new Date().getFullYear();

  // Exact brand fonts from the Figma. @font-face upgrades supporting clients
  // (Apple/iOS Mail) to the real faces; the stacks fall back cleanly elsewhere.
  // Gilroy = display, Clearface = italic serif accents, Outfit = body (the
  // Figma's "Saans" is a geometric grotesque; Outfit is the closest we host).
  const GIL = `'Gilroy',Helvetica,Arial,sans-serif`;
  const SER = `'Clearface',Georgia,'Times New Roman',serif`;
  const SANS = `'Outfit',Helvetica,Arial,sans-serif`;
  const fonts = `
    @font-face{font-family:'Gilroy';font-weight:500;font-style:normal;font-display:swap;src:url('${url}/fonts/Gilroy-Medium.woff2') format('woff2')}
    @font-face{font-family:'Gilroy';font-weight:700;font-style:normal;font-display:swap;src:url('${url}/fonts/Gilroy-Bold.woff2') format('woff2')}
    @font-face{font-family:'Clearface';font-weight:400;font-style:italic;font-display:swap;src:url('${url}/fonts/ClearfaceRegularItalic.woff2') format('woff2')}
    @font-face{font-family:'Outfit';font-weight:400;font-display:swap;src:url('${url}/fonts/Outfit-Regular.woff2') format('woff2')}
    @font-face{font-family:'Outfit';font-weight:500;font-display:swap;src:url('${url}/fonts/Outfit-Medium.woff2') format('woff2')}
    @font-face{font-family:'Outfit';font-weight:600;font-display:swap;src:url('${url}/fonts/Outfit-SemiBold.woff2') format('woff2')}
    @font-face{font-family:'Outfit';font-weight:700;font-display:swap;src:url('${url}/fonts/Outfit-Bold.woff2') format('woff2')}
    *{letter-spacing:0 !important}
    /* Mobile-only rows are hidden on desktop and revealed under 620px. */
    .m-only{display:none !important;max-height:0 !important;overflow:hidden !important;mso-hide:all}
    @media only screen and (max-width:620px){
      /* Collapse every fixed width so nothing forces sideways scroll */
      table.em-wrap,table.em-card,table.stack{width:100% !important;min-width:0 !important;max-width:100% !important}
      td.stack,th.stack{display:block !important;width:100% !important;box-sizing:border-box !important}
      /* Hero stacks: copy on top, collage underneath (kept at its natural size) */
      td.hero-text{display:block !important;width:100% !important;box-sizing:border-box !important;padding:24px 20px 4px !important}
      td.hero-art{display:block !important;width:100% !important;box-sizing:border-box !important;padding:0 0 0 !important;text-align:center !important}
      td.hero-art img{width:100% !important;max-width:286px !important;height:auto !important;margin:0 auto !important}
      /* How it works: let the copy column flex, keep the 73px thumb */
      td.hiw-copy{width:auto !important}
      /* CTA: drop the baked background, buttons full width, photo stacks below */
      td.cta-cell{height:auto !important;background-image:none !important;padding:24px 20px 20px !important}
      td.btn{display:block !important;width:100% !important;box-sizing:border-box !important;margin:0 0 10px !important}
      td.gap{display:none !important;height:0 !important;line-height:0 !important;font-size:0 !important}
      .m-only{display:block !important;max-height:none !important;overflow:visible !important}
      .m-only img{width:100% !important;max-width:280px !important;height:auto !important}
      /* Footer stacks */
      td.f-links{display:block !important;width:100% !important;text-align:center !important;padding:0 0 14px !important}
      td.f-logo{display:block !important;width:100% !important;text-align:center !important}
      .f-badges{text-align:center !important}
      .f-badges img{max-width:100% !important;height:auto !important}
    }
  `;

  // Step row — exact Figma geometry: 73px thumb (r6, per-row height), 12px
  // gap, 20px round badge, title at +28, body at +52. Rows are 16px apart.
  const step = (
    n: string,
    thumb: string,
    th: number,
    title: string,
    body: string,
    last = false,
  ) => `
    <tr>
      <td width="73" valign="top" style="width:73px;padding:0 12px ${last ? 0 : 16}px 0;font-size:0;line-height:0">
        <img src="${thumb}" alt="" width="73" height="${th}" style="width:73px;height:${th}px;display:block;border:0;border-radius:6px" />
      </td>
      <td class="hiw-copy" valign="top" style="padding:0 0 ${last ? 0 : 16}px">
        <img src="${img}/num-${n}.png" alt="${n}" width="20" height="20" style="width:20px;height:20px;display:block;border:0" />
        <p style="margin:8px 0 4px;font-family:${SANS};font-size:16px;font-weight:500;line-height:20px;color:#040404">${title}</p>
        <p style="margin:0;font-family:${SANS};font-size:14px;font-weight:400;line-height:20px;color:#040404">${body}</p>
      </td>
    </tr>`;

  const inner = `
    <!-- Hero — Figma geometry: 580 cream card (radius 20), text column 263px
         on the left, and the 286x457 collage flush to the card's top-right
         (its tiles + rounded outer corners are baked into the one image, so
         every client renders it identically). -->
    <table role="presentation" width="580" cellpadding="0" cellspacing="0" class="em-card" style="width:580px;max-width:100%;background:#f7f9f2;border-radius:20px">
      <tr>
        <td class="hero-text" valign="middle" style="padding:24px 15px 24px 16px">
          <h1 style="margin:0;font-family:${GIL};font-size:29px;font-weight:500;line-height:40px;color:${BRAND}">Your Journey</h1>
          <p style="margin:0 0 18px;font-family:${SER};font-style:italic;font-size:48px;font-weight:400;line-height:40px;color:${BRAND}">Start Here</p>
          <p style="margin:0 0 20px;font-family:${SANS};font-size:14px;font-weight:400;line-height:16px;color:${BRAND}">
            We make weight-loss simple with clinician-led care, personalised treatment options, and ongoing support all from home.
          </p>
          <a href="${assessmentUrl}" style="display:inline-block;font-family:${SANS};background:${BRAND};color:#ffffff;text-decoration:none;width:133px;padding:13px 22px;border-radius:8px;font-size:14px;font-weight:500;line-height:20px;text-align:center">Start My Assessment</a>
        </td>
        <td class="hero-art" width="286" valign="top" style="width:286px;padding:0;font-size:0;line-height:0">
          <img src="${img}/wl-collage.jpg" alt="" width="286" height="457" style="width:286px;height:457px;display:block;border:0" />
        </td>
      </tr>
    </table>

    <!-- How it works — Figma: 580 cream card r20, heading 16/28, rows from
         y=70 with 20px side padding and 16px row gaps -->
    <table role="presentation" width="580" cellpadding="0" cellspacing="0" class="em-card" style="width:580px;max-width:100%;margin-top:16px;background:#f7f9f2;border-radius:20px">
      <tr><td style="padding:28px 20px">
        <h2 style="margin:0 0 16px;font-family:${GIL};font-size:25px;font-weight:700;line-height:26px;color:${BRAND};text-align:center">Here&rsquo;s how it <span style="font-family:${SER};font-style:italic;font-weight:400">works</span></h2>
        <table role="presentation" width="540" cellpadding="0" cellspacing="0" class="stack" style="width:540px;max-width:100%">
          ${step("01", `${img}/welcome-step1.jpg`, 72, "Tell us about your goals.", "Complete a short online assessment so we understand your needs.")}
          ${step("02", `${img}/welcome-step2.jpg`, 91, "Our pharmacy team checks your suitability.", "Your answers are reviewed against clinical eligibility criteria by our GPhC-registered pharmacy.")}
          ${step("03", `${img}/welcome-step3.jpg`, 72, "Receive your next step.", "If your treatment is suitable, we&rsquo;ll guide you from there.", true)}
        </table>
      </td></tr>
    </table>

    <!-- CTA banner — Figma 580x234 r12. Gradient + cut-out photo are baked
         into one background image (email clients can't be trusted with CSS
         gradients); the heading sits in a 266px column at y=57 and the two
         177x44 r8 buttons at y=157 — they span to x=382, so they must NOT be
         nested inside the 266px text column. bgcolor is the Outlook fallback.
         On mobile the background is dropped and the photo stacks underneath. -->
    <table role="presentation" width="580" cellpadding="0" cellspacing="0" class="em-card" style="width:580px;max-width:100%;margin-top:16px;border-radius:12px">
      <tr>
        <td class="cta-cell" background="${img}/cta-banner.jpg" bgcolor="#1d4038" valign="top" height="234" style="height:234px;box-sizing:border-box;border-radius:12px;background-color:#1d4038;background-image:url('${img}/cta-banner.jpg');background-repeat:no-repeat;background-position:top left;background-size:580px 234px;padding:57px 16px 0 16px">
          <table role="presentation" width="382" cellpadding="0" cellspacing="0" class="stack" style="width:382px;max-width:100%">
            <tr><td class="stack" style="padding:0 0 20px">
              <table role="presentation" width="266" cellpadding="0" cellspacing="0" class="stack" style="width:266px;max-width:100%"><tr><td>
                <p style="margin:0;font-size:25px;line-height:27px;color:#ffffff">
                  <span style="font-family:${SANS};font-weight:700">It takes a few minutes. There&rsquo;s no </span><span style="font-family:${SER};font-style:italic;font-weight:400">commitment to begin.</span>
                </p>
              </td></tr></table>
            </td></tr>
            <tr><td class="stack">
              <table role="presentation" cellpadding="0" cellspacing="0" class="stack" style="max-width:100%"><tr>
                <td width="177" height="44" align="center" valign="middle" bgcolor="#ffffff" class="btn" style="width:177px;height:44px;background:#ffffff;border-radius:8px">
                  <a href="${assessmentUrl}" style="display:block;font-family:${SANS};font-size:14px;font-weight:500;line-height:44px;color:#052016;text-decoration:none">Start My Assessment</a>
                </td>
                <td width="12" class="gap">&nbsp;</td>
                <td width="177" height="44" align="center" valign="middle" class="btn" style="width:177px;height:44px;border:1px solid rgba(255,255,255,.6);border-radius:8px">
                  <a href="${howUrl}" style="display:block;font-family:${SANS};font-size:14px;font-weight:500;line-height:42px;color:#ffffff;text-decoration:none">See How Jood Works</a>
                </td>
              </tr></table>
            </td></tr>
            <!-- mobile-only: the cut-out photo stacks below the buttons -->
            <tr class="m-only"><td align="right" style="padding:16px 0 0;font-size:0;line-height:0">
              <img src="${img}/welcome-cta.png" alt="" width="240" style="width:240px;max-width:100%;height:auto;display:inline-block;border:0" />
            </td></tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="font-family:${SANS};font-size:12px;line-height:18px;color:rgba(20,46,42,.6);margin:22px 0 0;text-align:center">
      This account is registered to <strong>${escapeHtml(user.email)}</strong>. If you didn&rsquo;t create it, please ignore this email.
    </p>`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light only"/>
<style>${fonts}</style></head>
<body style="margin:0;padding:0;background:#eef1e9;letter-spacing:0;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">Your journey starts here — begin your free assessment.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1e9;padding:24px 0">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="em-wrap" style="width:600px;max-width:96%;background:#ffffff;border-radius:16px;overflow:hidden;font-family:${SANS}">
      <!-- WELCOME strip -->
      <tr><td style="background:${BRAND};padding:13px 24px;text-align:center">
        <span style="font-family:${GIL};font-size:14px;font-weight:500;color:#ffffff">Welcome To JOODLIFE</span>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:20px 10px 24px;color:${BRAND}">
        ${inner}
      </td></tr>
      <!-- Footer — Figma 600x413, 28px inset (544 content). Per-character
           weights from the file: "Questions? " Medium(500) + "Talk to our
           team" Regular(400); "Email us at " Regular(400) + the address
           Bold(700). Two hairline dividers: after the email line and after
           the badge row. Legal is 14px/18 in solid white. -->
      <tr><td style="background:${BRAND};padding:40px 28px 20px">
        <p style="margin:0 0 10px;font-family:${SANS};font-size:16px;line-height:20px;color:#fcfbf8;text-align:center">
          <span style="font-weight:500">Questions?</span> <a href="${url}/support" style="font-weight:400;color:#fcfbf8;text-decoration:none">Talk to our team</a>
        </p>
        <p style="margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:20px;color:#fcfbf8;text-align:center">
          <span style="font-weight:400">Email us at</span> <a href="mailto:hello@joodlife.com" style="font-weight:700;color:#fcfbf8;text-decoration:none">hello@joodlife.com</a>
        </p>
        <div style="border-top:1px solid rgba(255,255,255,.28);font-size:0;line-height:0">&nbsp;</div>
        <table role="presentation" width="544" cellpadding="0" cellspacing="0" class="stack" style="width:544px;max-width:100%">
          <tr>
            <td class="f-links" valign="middle" style="padding:20px 0 0;font-family:${SANS};font-size:16px;font-weight:400;line-height:26px">
              <a href="${url}/shop" style="color:#fcfbf8;text-decoration:none">Treatments</a><br/>
              <a href="${url}/policies/privacy" style="color:#fcfbf8;text-decoration:none">Privacy Policy</a>
            </td>
            <td class="f-logo" valign="middle" align="right" style="padding:20px 0 0">
              <img src="${img}/jood-logo.png" alt="JOOD" width="218" height="61" style="width:218px;max-width:100%;height:auto;display:inline-block;border:0"/>
            </td>
          </tr>
        </table>
        <div class="f-badges" style="margin:8px 0 14px;text-align:right;font-size:0;line-height:0">
          <img src="${url}/assets/email/badges-row.png" alt="LegitScript Certified &middot; Registered Pharmacy 9012990 &middot; Apple Pay &middot; Google Pay &middot; Stripe" width="241" height="61" style="width:241px;max-width:100%;height:auto;display:inline-block;border:0"/>
        </div>
        <div style="border-top:1px solid rgba(255,255,255,.28);font-size:0;line-height:0">&nbsp;</div>
        <p style="margin:26px 0 0;font-family:${SANS};font-size:14px;font-weight:400;line-height:18px;color:#ffffff;text-align:center">
          &copy; ${year} Jood. All rights reserved. Superintendent Pharmacist: Zahhaad Khalil (2228969)
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

Questions? Email us at hello@joodlife.com\n\nThis account is registered to ${user.email}. If you didn't create it, please ignore this email.`;

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

/**
 * "You're almost there" — assessment abandonment recovery.
 *
 * Sent to someone who started the questionnaire but never submitted it:
 * once a couple of hours later, then again the next day. Matches the
 * PHASE-1 Figma template (dark-green hero, cream "answers are saved" card,
 * pharmacy footer) using the same brand fonts as the welcome email.
 */
export async function sendAssessmentReminderEmail(
  payload: Payload,
  opts: {
    email: string;
    name?: string | null;
    /** Questionnaire to resume, e.g. "weight-loss". */
    productSlug?: string | null;
    /** 1 = the couple-of-hours nudge, 2 = the next-day follow-up. */
    attempt?: number;
  },
): Promise<void> {
  const url = siteUrl();
  const firstName = String(opts.name ?? "").trim().split(/\s+/)[0] || "there";
  const product = (opts.productSlug ?? "weight-loss").trim() || "weight-loss";
  const resumeUrl = `${url}/consultation?product=${encodeURIComponent(product)}`;
  const supportUrl = `${url}/support`;
  const img = `${url}/assets/email`;
  const second = Number(opts.attempt ?? 1) >= 2;
  const { GIL, SER, SANS } = EMAIL_FONTS;
  // The Figma card has a clinician photo bleeding off its right edge. Drop the
  // export in at public/assets/email/assessment-clinician.png and put that
  // filename here — the column appears and the copy narrows to suit. Left
  // empty, the card runs full width rather than showing a broken image.
  const clinicianArt = "";

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light only"/>
<style>${emailFontCss(url)}</style></head>
<body style="margin:0;padding:0;background:#ffffff;letter-spacing:0;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">Your answers are saved — pick up where you left off.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff">
  <tr><td align="center">
    <table role="presentation" class="em-wrap" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;font-family:${SANS}">

      <tr><td style="padding:14px 20px;text-align:center;font-family:${SANS};font-size:11px;font-weight:500;line-height:16px;color:${BRAND};text-transform:uppercase">
        &#9200;&nbsp; Your answers are saved &mdash; finish whenever you&rsquo;re ready.
      </td></tr>

      <tr><td style="padding:0 12px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND};border-radius:14px">
          <tr><td style="padding:30px 24px 0;text-align:center">
            <img src="${img}/jood-logo.png" alt="JOOD" width="150" style="width:150px;max-width:60%;height:auto;display:inline-block;border:0;margin:0 0 14px"/>
            <p style="margin:0 0 10px;font-size:38px;line-height:44px;color:#ffffff">
              <span style="font-family:${GIL};font-weight:500">You&rsquo;re </span><span style="font-family:${SER};font-style:italic">Almost There</span>
            </p>
            <p style="margin:0 0 20px;font-family:${SANS};font-size:14px;font-weight:400;line-height:20px;color:rgba(255,255,255,.88)">
              ${second
                ? "Your assessment is still waiting &mdash; it only takes a couple of minutes."
                : "You started your assessment but didn&rsquo;t quite finish."}
            </p>
            <a href="${resumeUrl}" style="display:inline-block;font-family:${SANS};background:#ffffff;color:${BRAND};text-decoration:none;padding:13px 24px;border-radius:8px;font-size:14px;font-weight:600">Finish My Assessment</a>
            <div style="font-size:0;line-height:0;padding:24px 0 0">
              <img src="${img}/assessment-hero.png" alt="" width="300" style="width:300px;max-width:80%;height:auto;display:inline-block;border:0"/>
            </div>
          </td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:18px 12px 22px">
        <table role="presentation" class="em-card" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7ee;border-radius:14px">
          <tr>
            <td class="card-copy stack" valign="top" style="padding:26px ${clinicianArt ? "8px" : "26px"} 26px 26px">
              <p style="margin:0 0 14px;font-size:24px;line-height:30px;color:${BRAND}">
                <span style="font-family:${GIL};font-weight:700">Good news &mdash; your </span><span style="font-family:${SER};font-style:italic">answers are saved.</span>
              </p>
              <p style="margin:0 0 12px;font-family:${SANS};font-size:14px;font-weight:400;line-height:20px;color:${BRAND}">
                ${escapeHtml(firstName)}, you can pick up exactly where you left off.
              </p>
              <p style="margin:0 0 12px;font-family:${SANS};font-size:14px;font-weight:400;line-height:20px;color:${BRAND}">
                It only takes a couple of minutes, and our pharmacy team will review it to check the treatment is suitable for you.
              </p>
              <p style="margin:0 0 22px;font-family:${SANS};font-size:14px;font-weight:400;line-height:20px;color:${BRAND}">
                No pressure. We&rsquo;re here if you have any questions along the way.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                <td class="btn" style="border-radius:8px;background:${BRAND}">
                  <a href="${resumeUrl}" style="display:block;font-family:${SANS};color:#ffffff;text-decoration:none;padding:13px 20px;font-size:14px;font-weight:600;text-align:center">Finish My Assessment</a>
                </td>
                <td class="gap" width="12"></td>
                <td class="btn" style="border-radius:8px;background:#ffffff;border:1px solid rgba(20,46,42,.35)">
                  <a href="${supportUrl}" style="display:block;font-family:${SANS};color:${BRAND};text-decoration:none;padding:12px 19px;font-size:14px;font-weight:600;text-align:center">Talk To Our Team</a>
                </td>
              </tr></table>
            </td>
            ${clinicianArt
              ? `<td class="card-art stack" width="215" valign="bottom" align="right" style="padding:0">
              <img src="${img}/${clinicianArt}" alt="" width="215" style="width:215px;max-width:100%;height:auto;display:block;border:0;border-radius:0 14px 14px 0"/>
            </td>`
              : ""}
          </tr>
        </table>
      </td></tr>

      ${emailFooterHtml(url)}
    </table>
  </td></tr>
</table>
</body></html>`;

  const text = `Hi ${firstName},

You started your JoodLife assessment but didn't quite finish — and your answers are saved.

Pick up exactly where you left off: ${resumeUrl}

It only takes a couple of minutes, and our pharmacy team will review it to check the treatment is suitable for you.

Questions? Talk to our team: ${supportUrl}`;

  await payload.sendEmail({
    to: opts.email,
    subject: second
      ? "Your assessment is still waiting"
      : "You're almost there — finish your assessment",
    html,
    text,
  });
}
