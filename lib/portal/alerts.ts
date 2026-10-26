import "server-only";

import { getPayloadInstance } from "@/lib/payload";
import { sendPortalStaffAlertEmail } from "@/lib/account-email";
import { lit, type Db } from "./db";

const SERVICE: Record<string, string> = { wl: "Weight loss", ed: "Erectile dysfunction", pd: "Period delay" };

/**
 * Email the clinical team that a patient is waiting. Severe check-ins always
 * alert; ordinary messages alert once per conversation burst (not again while
 * the patient already has an unread message from the last 30 minutes), so a
 * patient sending three lines doesn't produce three emails. Never throws.
 */
export async function alertClinicalTeam(
  db: Db,
  opts: { kind: "message" | "checkin" | "severe"; userId: number; patientName: string; svc: string; messageId?: number },
): Promise<void> {
  try {
    if (opts.kind === "message" && opts.messageId) {
      const earlier = await db.query(`
        SELECT 1 FROM portal_messages
        WHERE user_id = ${lit(opts.userId)} AND from_staff = false AND read_by_staff_at IS NULL
          AND id <> ${lit(opts.messageId)} AND created_at > now() - interval '30 minutes'
        LIMIT 1
      `);
      if (earlier.length) return;
    }
    const payload = await getPayloadInstance();
    await sendPortalStaffAlertEmail(payload, {
      kind: opts.kind,
      patientName: opts.patientName,
      service: SERVICE[opts.svc] ?? "their treatment",
    });
  } catch (err) {
    console.error("[portal] staff alert failed:", (err as Error).message);
  }
}
