import "server-only";

import type { AuthedUser } from "@/lib/auth";
import { canAccessAdminTools, canAccessSection, firstAllowedHref } from "@/lib/adminSections";
import { canAccessCms } from "@/lib/cmsSections";
import { parseItems, type OrderItem } from "@/lib/accountData";
import { asObject, ensurePortalTables, getDb, lit, pick, toIso, type Db } from "./db";
import { buildCatalogue, doseKey, ensureProduct, serviceOf, type Catalogue, type Svc } from "./catalogue";

/**
 * Everything the portal engine (components/portal/engine.ts) needs for one
 * signed-in patient, built from the real tables:
 *  - orders: one per consultation, with its stage worked out the same way the
 *    admin dashboard does (Clinical Check → To Dispatch → Dispatched), joined
 *    to the paid order for price, items and DPD tracking;
 *  - weigh-ins (weight_logs + consultation weights), check-ins, messages;
 *  - the patient's own saved logs and settings (portal_prefs).
 */

type Status = "booked" | "clinical" | "todispatch" | "dispatched" | "delivered" | "rejected" | "cancelled";

export type PortalOrder = {
  id: string;
  svc: Svc;
  kind: "Consultation" | "Reorder" | "Order";
  pid: string;
  s: string;
  q: number;
  label: string;
  price: number;
  status: Status;
  history: Array<{ s: Status; at: string }>;
  createdAt: string;
  tracking: string;
  eta: string;
  note: string;
  prescriber: string;
};

export type PortalInitial = {
  svc: Svc;
  user: { first: string; name: string; email: string; phone: string; dob: string; heightCm: number | null };
  address: { line: string; town: string; postcode: string };
  orders: PortalOrder[];
  weights: Array<{ d: string; w: number; id?: number }>;
  checkins: Array<{ at: string; mood: string; effects: string[]; note: string; severe: boolean; reply: string }>;
  messages: Record<Svc, Array<{ id: number; me: boolean; from: string; at: string; text: string; read: boolean }>>;
  notifs: Array<{ id: string; at: string; svc: Svc | null; text: string; read?: boolean }>;
  activity: Array<{ at: string; svc: Svc | null; icon: string; text: string }>;
  prefs: Record<string, unknown> | null;
  catalogue: Catalogue;
  links: { start: Record<Svc, string>; reorder: Record<Svc, string> };
  staffLinks: Array<{ label: string; href: string }>;
  idVerified: boolean;
};

const TZ = "Europe/London";

/** "YYYY-MM-DDTHH:MM" in UK time — the stamp format the engine works in. */
export function ukStamp(v: unknown): string {
  const iso = toIso(v);
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(iso));
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour") === "24" ? "00" : g("hour")}:${g("minute")}`;
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString();
}

const POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i;

export function parseAddress(text: unknown): { line: string; town: string; postcode: string } {
  const raw = String(text ?? "").trim();
  if (!raw) return { line: "", town: "", postcode: "" };
  const m = raw.match(POSTCODE);
  const postcode = m ? `${m[1]} ${m[2]}`.toUpperCase() : "";
  const rest = (m ? raw.replace(m[0], "") : raw)
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter((s) => s && !/^(uk|united kingdom|gb|england)$/i.test(s));
  const town = rest.length > 1 ? rest[rest.length - 1] : "";
  const line = (rest.length > 1 ? rest.slice(0, -1) : rest).join(", ");
  return { line, town, postcode };
}

function trackingFrom(answers: Record<string, unknown>, notes: unknown): string {
  const t = answers._tracking_number;
  if (typeof t === "string" && t.trim()) return t.trim();
  const m = String(notes ?? "").match(/DPD tracking:\s*([^\s(]+)/i);
  return m ? m[1] : "";
}

function prescriberName(v: unknown): string {
  const s = String(v ?? "").trim();
  if (!s || /auto|system/i.test(s) || s.includes("@")) return "";
  return s;
}

type OrderRow = {
  number: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  total: number | null;
  items: OrderItem[];
  notes: string;
  dispatchedAt: string | null;
  shipping: string;
};

function orderLine(cat: Catalogue, svc: Svc, title: string, dose: string, qty: number, price: number | null) {
  const p = ensureProduct(cat, svc, title, dose, price);
  const st = p.strengths.find((x) => doseKey(x.s) === doseKey(dose)) ?? p.strengths[0];
  const pack = st.packs[0];
  return {
    pid: p.id,
    s: st.s,
    q: pack.q * Math.max(1, qty),
    label: qty > 1 ? `${qty} × ${pack.label}` : pack.label,
    price: price ?? pack.price,
  };
}

export async function loadPortal(user: AuthedUser): Promise<PortalInitial> {
  const db = await getDb();
  await ensurePortalTables(db);
  const email = user.email.trim().toLowerCase();
  const uid = Number(user.id);
  const cat = await buildCatalogue(db);

  const [userRows, consultRows, orderRows, weightRows, checkinRows, messageRows, prefRows] = await Promise.all([
    db.query(`SELECT * FROM "users" WHERE id = ${lit(uid)} LIMIT 1`).catch(() => []),
    db.query(`SELECT * FROM "consultations" WHERE lower(email) = ${lit(email)} AND COALESCE(status::text,'') <> 'draft' ORDER BY created_at ASC LIMIT 200`).catch(() => []),
    db.query(`SELECT * FROM "orders" WHERE lower(customer_email) = ${lit(email)} ORDER BY created_at ASC LIMIT 200`).catch(() => []),
    db.query(`SELECT id, weight_kg, logged_at FROM "weight_logs" WHERE lower(customer_email) = ${lit(email)} ORDER BY logged_at ASC LIMIT 1000`).catch(() => []),
    db.query(`SELECT * FROM "portal_checkins" WHERE user_id = ${lit(uid)} ORDER BY created_at DESC LIMIT 100`).catch(() => []),
    db.query(`SELECT * FROM "portal_messages" WHERE user_id = ${lit(uid)} ORDER BY created_at ASC LIMIT 1000`).catch(() => []),
    db.query(`SELECT data FROM "portal_prefs" WHERE user_id = ${lit(uid)} LIMIT 1`).catch(() => []),
  ]);
  const urow = userRows[0] ?? {};

  /* ---------- orders ---------- */
  const orders: OrderRow[] = orderRows.map((r) => ({
    number: String(pick(r, "order_number", "id") ?? ""),
    createdAt: toIso(pick(r, "created_at")) ?? new Date().toISOString(),
    status: String(pick(r, "status") ?? "").toLowerCase(),
    paymentStatus: String(pick(r, "payment_status") ?? "").toLowerCase(),
    total: pick(r, "total_amount") != null ? Number(pick(r, "total_amount")) : null,
    items: parseItems(pick(r, "items_json", "items")),
    notes: String(pick(r, "notes") ?? ""),
    dispatchedAt: toIso(pick(r, "dispatched_at")),
    shipping: String(pick(r, "shipping_address") ?? ""),
  }));
  const claimed = new Set<string>();
  const isLive = (o: OrderRow) => !["cancelled", "refunded"].includes(o.status) && o.paymentStatus !== "refunded";

  const portalOrders: PortalOrder[] = [];
  let heightCm: number | null = null;
  const consultWeights: Array<{ d: string; w: number }> = [];
  let dob = "";
  let consultName = "";
  let consultPhone = "";

  for (const c of consultRows) {
    const a = asObject(pick(c, "answers"));
    const created = toIso(pick(c, "created_at")) ?? new Date().toISOString();
    const slug = String(pick(c, "product_slug") ?? "");
    const h = Number(a.height_cm ?? a.height);
    if (h > 100 && h < 250) heightCm = h;
    const w = Number(a.current_weight_kg ?? a.weight ?? a.current_weight);
    if (w > 30 && w < 400) consultWeights.push({ d: ukStamp(created).slice(0, 10), w });
    dob = String(pick(c, "date_of_birth") ?? dob ?? "");
    consultName = String(pick(c, "full_name") ?? consultName);
    consultPhone = String(pick(c, "phone") ?? consultPhone);

    // Paired order: the one clinical approval linked, else the first unclaimed
    // order placed from 30 minutes before the consultation onwards.
    const linkedNo = String(a._linked_order_number ?? "");
    const from = new Date(created).getTime() - 30 * 60 * 1000;
    const order =
      orders.find((o) => linkedNo && o.number === linkedNo && !claimed.has(o.number)) ??
      orders.find((o) => !claimed.has(o.number) && isLive(o) && new Date(o.createdAt).getTime() >= from);
    if (order) claimed.add(order.number);

    const item = order?.items.find((i) => serviceOf(i.title)) ?? order?.items[0];
    const svc: Svc = serviceOf(slug) ?? serviceOf(item?.title) ?? "wl";
    const title = item?.title || String(a.product_name ?? a.product ?? "") || cat[svc].products[0]?.name || cat[svc].name;
    const dose = String(pick(c, "dose") ?? item?.dose ?? "");
    const line = orderLine(cat, svc, title, dose, item?.quantity ?? 1, order?.total ?? item?.price ?? null);

    const decision = String(a._review_decision ?? "").toLowerCase();
    const cStatus = String(pick(c, "status") ?? "").toLowerCase();
    const reviewedAt = toIso(a._reviewed_at) ?? created;
    const tracking = trackingFrom(a, order?.notes);
    const dispatchedAt = toIso(a._dispatched_at) ?? order?.dispatchedAt ?? (tracking ? reviewedAt : null);
    const paid = order ? order.paymentStatus === "paid" || /card verified|auto-created on clinical approval/i.test(order.notes) : false;

    let status: Status;
    const history: Array<{ s: Status; at: string }> = [{ s: "booked", at: created }];
    if (order && !isLive(order)) {
      status = "cancelled";
      history.push({ s: "cancelled", at: order.createdAt });
    } else if (cStatus === "rejected" || decision === "rejected") {
      status = "rejected";
      history.push({ s: "clinical", at: created }, { s: "rejected", at: reviewedAt });
    } else if (dispatchedAt || ["shipped", "delivered"].includes(order?.status ?? "")) {
      const sent = dispatchedAt ?? reviewedAt;
      history.push({ s: "clinical", at: created }, { s: "todispatch", at: reviewedAt }, { s: "dispatched", at: sent });
      // DPD is next-day; nothing records delivery, so treat 3 days after
      // dispatch (or an order marked delivered) as delivered.
      const delivered = order?.status === "delivered" || Date.now() - new Date(sent).getTime() > 3 * 864e5;
      status = delivered ? "delivered" : "dispatched";
      if (delivered) history.push({ s: "delivered", at: addDays(sent, 1) });
    } else if (decision === "approved" || cStatus === "approved") {
      status = "todispatch";
      history.push({ s: "clinical", at: created }, { s: "todispatch", at: reviewedAt });
    } else {
      status = paid ? "clinical" : "booked";
      if (paid) history.push({ s: "clinical", at: order!.createdAt });
    }

    const sentAt = history.find((x) => x.s === "dispatched")?.at;
    portalOrders.push({
      id: order?.number || `#${pick(c, "id")}`,
      svc,
      kind: /reorder/i.test(slug) || a._is_reorder ? "Reorder" : "Consultation",
      ...line,
      status,
      history: history.map((x) => ({ s: x.s, at: ukStamp(x.at) })),
      createdAt: ukStamp(created),
      tracking,
      eta: sentAt ? ukStamp(addDays(sentAt, 1)).slice(0, 10) : "",
      note: "",
      prescriber: prescriberName(a._reviewed_by),
    });
  }

  // Paid orders with no consultation (e.g. placed before consultations were
  // recorded) still belong in the history.
  for (const o of orders) {
    if (claimed.has(o.number) || !isLive(o)) continue;
    const item = o.items.find((i) => serviceOf(i.title));
    const svc = item ? serviceOf(item.title) : null;
    if (!svc || !(o.paymentStatus === "paid" || ["shipped", "delivered"].includes(o.status))) continue;
    const tracking = trackingFrom({}, o.notes);
    const sent = o.dispatchedAt ?? (tracking || o.status === "shipped" ? o.createdAt : null);
    const history: Array<{ s: Status; at: string }> = [{ s: "booked", at: o.createdAt }, { s: "clinical", at: o.createdAt }];
    let status: Status = "clinical";
    if (sent) {
      history.push({ s: "todispatch", at: sent }, { s: "dispatched", at: sent });
      const delivered = o.status === "delivered" || Date.now() - new Date(sent).getTime() > 3 * 864e5;
      status = delivered ? "delivered" : "dispatched";
      if (delivered) history.push({ s: "delivered", at: addDays(sent, 1) });
    }
    portalOrders.push({
      id: o.number,
      svc,
      kind: "Order",
      ...orderLine(cat, svc, item!.title, item!.dose ?? "", item!.quantity, o.total ?? item!.price),
      status,
      history: history.map((x) => ({ s: x.s, at: ukStamp(x.at) })),
      createdAt: ukStamp(o.createdAt),
      tracking,
      eta: sent ? ukStamp(addDays(sent, 1)).slice(0, 10) : "",
      note: "",
      prescriber: "",
    });
  }

  /* ---------- weigh-ins ---------- */
  const byDay = new Map<string, { d: string; w: number; id?: number }>();
  for (const cw of consultWeights) byDay.set(cw.d, cw);
  for (const r of weightRows) {
    const d = ukStamp(r.logged_at).slice(0, 10);
    const w = Number(r.weight_kg);
    if (d && w > 0) byDay.set(d, { d, w: Math.round(w * 10) / 10, id: Number(r.id) });
  }
  const weights = [...byDay.values()].sort((x, y) => (x.d < y.d ? -1 : 1));

  /* ---------- check-ins and messages ---------- */
  const checkins = checkinRows.map((r) => ({
    at: ukStamp(r.created_at),
    mood: String(r.mood ?? "Okay"),
    effects: Array.isArray(r.effects) ? (r.effects as string[]) : [],
    note: String(r.note ?? ""),
    severe: Boolean(r.severe),
    reply: String(r.reply ?? ""),
  }));
  const messages: PortalInitial["messages"] = { wl: [], ed: [], pd: [] };
  for (const r of messageRows) {
    const svc = (["wl", "ed", "pd"].includes(String(r.svc)) ? r.svc : "wl") as Svc;
    messages[svc].push({
      id: Number(r.id),
      me: !r.from_staff,
      from: r.from_staff ? String(r.author || "Jood clinical team") : "You",
      at: ukStamp(r.created_at),
      text: String(r.body ?? ""),
      read: !r.from_staff || Boolean(r.read_by_patient_at),
    });
  }

  /* ---------- notifications and activity ---------- */
  const productName = (o: PortalOrder) => cat[o.svc].products.find((p) => p.id === o.pid)?.name ?? cat[o.svc].name;
  const STATUS_TEXT: Partial<Record<Status, (o: PortalOrder) => string>> = {
    clinical: (o) => `${o.id} is in clinical check. A prescriber is reviewing it.`,
    todispatch: (o) => `Approved: ${productName(o)} ${o.s}. Our pharmacy is packing ${o.id}.`,
    dispatched: (o) => `${o.id} dispatched with DPD.${o.tracking ? " Tracking " + o.tracking + "." : ""}`,
    delivered: (o) => `${o.id} delivered.`,
    rejected: (o) => `${o.id} was not approved. Please message us and we'll talk you through other options.`,
  };
  const ICON: Partial<Record<Status, string>> = { booked: "clip", clinical: "clip", todispatch: "shield", dispatched: "truck", delivered: "box", rejected: "alert", cancelled: "x" };
  const ACT_TEXT: Partial<Record<Status, (o: PortalOrder) => string>> = {
    booked: (o) => `${o.kind === "Consultation" ? "Consultation submitted" : o.kind + " placed"} (${o.id})`,
    todispatch: (o) => `${o.id} approved by your prescriber`,
    dispatched: (o) => `${o.id} dispatched with DPD${o.tracking ? " (" + o.tracking + ")" : ""}`,
    delivered: (o) => `${o.id} delivered`,
    rejected: (o) => `${o.id} not approved`,
    cancelled: (o) => `${o.id} cancelled`,
  };
  const cutoff = ukStamp(addDays(new Date().toISOString(), -60));
  const notifs: PortalInitial["notifs"] = [];
  const activity: PortalInitial["activity"] = [];
  for (const o of portalOrders) {
    for (const h of o.history) {
      const n = STATUS_TEXT[h.s];
      if (n && h.at >= cutoff) notifs.push({ id: `${o.id}:${h.s}`, at: h.at, svc: o.svc, text: n(o) });
      const t = ACT_TEXT[h.s];
      if (t) activity.push({ at: h.at, svc: o.svc, icon: ICON[h.s] ?? "info", text: t(o) });
    }
  }
  for (const svc of ["wl", "ed", "pd"] as Svc[]) {
    for (const m of messages[svc]) {
      if (!m.me) notifs.push({ id: `m:${m.id}`, at: m.at, svc, text: `New message from ${m.from}`, read: m.read });
      activity.push({ at: m.at, svc, icon: "chat", text: m.me ? "Message sent to the clinical team" : `Message from ${m.from}` });
    }
  }
  weights.forEach((w, i) => {
    const prev = weights[i - 1];
    const diff = prev ? w.w - prev.w : 0;
    activity.push({ at: `${w.d}T08:00`, svc: "wl", icon: "scale", text: `Weigh-in: ${w.w.toFixed(1)} kg${prev ? ` (${diff <= 0 ? "down" : "up"} ${Math.abs(diff).toFixed(1)} kg)` : ""}` });
  });
  for (const c of checkins) activity.push({ at: c.at, svc: "wl", icon: "chat", text: `Weekly check-in sent: feeling ${c.mood.toLowerCase()}` });

  /* ---------- profile ---------- */
  const name = String(urow.name ?? user.name ?? consultName ?? "").trim() || email.split("@")[0];
  const latestOrder = orders[orders.length - 1];
  const address = parseAddress(urow.default_address || latestOrder?.shipping || "");
  const dobText = (() => {
    const d = toIso(dob);
    return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: TZ }) : String(dob || "");
  })();
  const latest = [...portalOrders].sort((x, y) => (x.createdAt < y.createdAt ? 1 : -1))[0];

  const staffLinks: PortalInitial["staffLinks"] = [];
  if (canAccessAdminTools(user.role, user.permissions)) staffLinks.push({ label: "Orders & admin", href: firstAllowedHref(user.role, user.permissions) });
  if (canAccessSection(user.role, user.permissions, "clinical")) staffLinks.push({ label: "Patient messages", href: "/admin-tools/patient-messages" });
  if (canAccessCms(user.role, user.permissions)) staffLinks.push({ label: "Content (CMS)", href: "/cms" });

  const prefsRaw = prefRows[0]?.data;
  return {
    svc: latest?.svc ?? "wl",
    user: {
      first: name.split(/\s+/)[0],
      name,
      email: user.email,
      phone: String(urow.phone ?? consultPhone ?? "").trim(),
      dob: dobText,
      heightCm,
    },
    address,
    orders: portalOrders,
    weights,
    checkins,
    messages,
    notifs: notifs.sort((x, y) => (x.at < y.at ? 1 : -1)).slice(0, 60),
    activity: activity.sort((x, y) => (x.at < y.at ? 1 : -1)).slice(0, 400),
    prefs: prefsRaw ? asObject(prefsRaw) : null,
    catalogue: cat,
    links: {
      start: {
        wl: "/consultation?product=weight-loss",
        ed: "/consultation?product=erectile-dysfunction",
        pd: "/consultation?product=period-delay",
      },
      reorder: {
        wl: "/consultation?product=reorder",
        ed: "/consultation?product=erectile-dysfunction",
        pd: "/consultation?product=period-delay",
      },
    },
    staffLinks,
    idVerified: false,
  };
}

export type { Db };
