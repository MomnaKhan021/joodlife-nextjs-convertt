/**
 * GET /api/email-status   (temporary diagnostic — remove after launch)
 *
 * Reports whether THIS deployment has the SMTP env vars active, so we can tell
 * if production is actually wired to Brevo (vs. silently using the console
 * adapter because env vars weren't set/redeployed). Returns only non-secret
 * values (host + from address) and booleans for the credentials.
 *
 * ?test=jood-email-check&to=<addr@joodlife.com> sends a REAL test email via the
 * deployment's configured SMTP and returns the exact result/error.
 */
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const host = process.env.SMTP_HOST || null;
  const status = {
    adapter: host ? "smtp (Brevo)" : "console — NO real email is sent",
    smtpHost: host,
    smtpPort: process.env.SMTP_PORT || null,
    smtpSecure: process.env.SMTP_SECURE || null,
    smtpUserPresent: Boolean(process.env.SMTP_USER),
    smtpPassPresent: Boolean(process.env.SMTP_PASS),
    emailFrom: process.env.EMAIL_FROM_ADDRESS || null,
    emailFromName: process.env.EMAIL_FROM_NAME || null,
  };

  const sp = req.nextUrl.searchParams;
  if (sp.get("test") === "jood-email-check") {
    const to = sp.get("to") || "";
    if (!/@joodlife\.com$/i.test(to)) {
      return NextResponse.json(
        { ...status, test: { ok: false, error: "`to` must be a @joodlife.com address" } },
        { status: 400 }
      );
    }
    if (!host) {
      return NextResponse.json({
        ...status,
        test: { ok: false, error: "SMTP_HOST not set in this deployment — set the env vars and redeploy." },
      });
    }
    try {
      const { default: nodemailer } = (await import("nodemailer")) as unknown as {
        default: {
          createTransport: (o: Record<string, unknown>) => {
            sendMail: (m: Record<string, unknown>) => Promise<{
              response?: string;
              messageId?: string;
            }>;
          };
        };
      };
      const port = Number(process.env.SMTP_PORT || 587);
      const transport = nodemailer.createTransport({
        host,
        port,
        secure: process.env.SMTP_SECURE === "true" || port === 465,
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
      const info = await transport.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || "JoodLife"}" <${process.env.EMAIL_FROM_ADDRESS}>`,
        to,
        subject: "JoodLife — live email diagnostic",
        text: "If you received this, production email via Brevo is working.",
      });
      return NextResponse.json({ ...status, test: { ok: true, response: info.response, messageId: info.messageId } });
    } catch (e) {
      return NextResponse.json({
        ...status,
        test: { ok: false, error: e instanceof Error ? e.message : String(e) },
      });
    }
  }

  return NextResponse.json(status);
}
