import "server-only";

/**
 * DPD Local REST API helpers, shared by the order label route
 * (/api/admin-tools/dpd-label) and the no-order label route
 * (/api/admin-tools/dpd-label/manual). Env vars are documented on the
 * order route.
 */

/* ------------------------------------------------------------------ */
/* Address parsing                                                     */
/* ------------------------------------------------------------------ */
export const UK_POSTCODE_RE = /\b([A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2})\b/i;

export type ParsedAddress = {
  property: string;
  street: string;
  town: string;
  county: string;
  postcode: string;
  countryCode: string;
};

export function parseShippingAddress(raw: string): ParsedAddress {
  // Split on comma or newline; trim each part
  const parts = raw
    .split(/[,\n]/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Extract postcode and strip it wherever it appears. A part that is ONLY a
  // postcode (a common duplicate trailing line) is dropped entirely so it
  // never lands in the town field — DPD rejects a postcode-as-town.
  const COUNTRY_LABELS = ["united kingdom", "uk", "england", "scotland", "wales", "great britain"];
  let postcode = "";
  const collected: string[] = [];
  for (const part of parts) {
    if (COUNTRY_LABELS.includes(part.toLowerCase())) continue;
    const m = part.match(UK_POSTCODE_RE);
    if (m) {
      if (!postcode) postcode = m[1].toUpperCase().replace(/\s+/g, " ");
      const remainder = part.replace(UK_POSTCODE_RE, "").replace(/,\s*$/, "").trim();
      if (remainder) collected.push(remainder);
      continue; // postcode-only part → nothing left, skip
    }
    collected.push(part);
  }

  // De-duplicate (addresses often repeat the property/number line).
  const seen = new Set<string>();
  const filteredParts = collected.filter((p) => {
    const k = p.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // Map remaining parts to address fields.
  // UK address lines: [street, property?, locality?, town, county?]
  const property = filteredParts.length > 2 ? filteredParts[1] : "";
  let street = filteredParts[0] ?? "";
  let town = filteredParts[filteredParts.length - 1] ?? "";
  const county = filteredParts.length >= 3 ? filteredParts[filteredParts.length - 2] : "";

  // DPD rejects an empty street OR town. When the address had only one usable
  // line, reuse it for both so a thin-but-real address still ships rather than
  // failing validation. (A truly empty address is blocked upstream: the
  // Dispatch button is disabled when the order has no usable address.)
  if (!street && town) street = town;
  if (!town && street) town = street;
  if (!street && !town && property) {
    street = property;
    town = property;
  }

  return {
    property,
    street,
    town,
    county: county === town || county === property ? "" : county,
    postcode: postcode || "EC1A 1BB",
    countryCode: "GB",
  };
}

/* ------------------------------------------------------------------ */
/* DPD REST API helpers                                                */
/* ------------------------------------------------------------------ */
const DPD_BASE = process.env.DPD_API_BASE ?? "https://api.dpdlocal.co.uk";

type DpdAuthResponse = {
  data?: {
    geoSession?: string;
    geoUser?: { geoAccount?: string };
  };
  error?: { errorMessage?: string };
};

// DPD Local returns validation problems as an ARRAY of error objects (not the
// single object the auth endpoint uses), and it also nests per-consignment
// errors inside consignmentDetail[].error. Accept every shape we've seen.
type DpdError = { errorMessage?: string; obj?: string; errorCode?: string };

type DpdShipmentResponse = {
  data?: {
    shipmentId?: number;
    consignmentDetail?: Array<{
      consignmentNumber?: string;
      parcelNumbers?: string[];
      error?: DpdError | DpdError[];
    }>;
  };
  error?: DpdError | DpdError[];
};

/** DPD rejects over-long fields; keep every value inside its limit. */
export function clampDpd(v: string | null | undefined, max: number): string {
  return (v ?? "").trim().slice(0, max);
}

/** DPD wants a plain national number (no +44, spaces or punctuation). */
export function dpdPhone(raw: string): string {
  let n = (raw || "").replace(/[^\d+]/g, "");
  if (n.startsWith("+44")) n = "0" + n.slice(3);
  else if (n.startsWith("0044")) n = "0" + n.slice(4);
  else if (n.startsWith("44") && n.length >= 12) n = "0" + n.slice(2);
  return n.replace(/\D/g, "").slice(0, 15);
}

function collectDpdErrors(json: DpdShipmentResponse): string[] {
  const out: string[] = [];
  const push = (e?: DpdError | DpdError[]) => {
    if (!e) return;
    for (const item of Array.isArray(e) ? e : [e]) {
      const msg = item?.errorMessage || item?.obj || item?.errorCode;
      if (msg) out.push(item?.obj && item?.errorMessage ? `${item.obj}: ${item.errorMessage}` : msg);
    }
  };
  push(json?.error);
  for (const c of json?.data?.consignmentDetail ?? []) push(c?.error);
  return out;
}

export async function dpdAuth(): Promise<{ session: string; account: string }> {
  const user = process.env.DPD_API_USER ?? "";
  const pass = process.env.DPD_API_PASS ?? "";
  if (!user || !pass) throw new Error("DPD_API_USER / DPD_API_PASS environment variables not set");

  const credentials = Buffer.from(`${user}:${pass}`).toString("base64");
  const res = await fetch(`${DPD_BASE}/user/?action=login`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DPD auth failed (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }

  const json: DpdAuthResponse = await res.json();
  const session = json?.data?.geoSession;
  const account = json?.data?.geoUser?.geoAccount ?? process.env.DPD_ACCOUNT_NO ?? user;
  if (!session) throw new Error("DPD auth: no geoSession in response");
  return { session, account };
}

export async function dpdCreateShipment(opts: {
  session: string;
  account: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: ParsedAddress;
  collectionDate: string; // ISO date string
  /** Parcel weight in kg; defaults to DPD_PARCEL_WEIGHT_KG (0.5). */
  weightKg?: number;
  /** Printed on the label for the driver (DPD limit 50 chars). */
  deliveryInstructions?: string;
}): Promise<{ shipmentId: number; trackingNumber: string }> {
  const senderName = process.env.DPD_SENDER_NAME ?? "Jood Life";
  const senderStreet = process.env.DPD_SENDER_STREET ?? "1 Sender Street";
  const senderTown = process.env.DPD_SENDER_TOWN ?? "London";
  const senderPostcode = process.env.DPD_SENDER_POSTCODE ?? "EC1A 1BB";
  const networkCode = process.env.DPD_NETWORK_CODE ?? "1^12";
  const weight =
    opts.weightKg && opts.weightKg > 0 ? opts.weightKg : parseFloat(process.env.DPD_PARCEL_WEIGHT_KG ?? "0.5");

  // DPD Local caps shippingRef1 at 25 chars; some orders (esp. HubSpot-synced
  // ones whose "order number" is a deal name) exceed that. Trim to fit.
  const shippingRef1 = (opts.orderNumber || "").trim().slice(0, 25);

  // DPD Local requires a parcel-level product description; keep it generic
  // (contents aren't itemised on the label) and safely within DPD's limit.
  const parcelDescription = (process.env.DPD_PARCEL_DESCRIPTION ?? "Health & wellbeing products").slice(0, 45);

  const body = {
    jobId: null,
    collectionOnDelivery: false,
    invoice: null,
    collectionDate: opts.collectionDate,
    consolidate: false,
    consignment: [
      {
        consignmentNumber: null,
        consignmentRef: null,
        parcel: [
          {
            weight,
            parcelProduct: [{ productItemsDescription: parcelDescription }],
          },
        ],
        collectionDetails: {
          contactDetails: {
            contactName: senderName,
          },
          address: {
            organisation: senderName,
            countryCode: "GB",
            postcode: senderPostcode,
            street: senderStreet,
            localityName: "",
            town: senderTown,
            county: "",
          },
        },
        deliveryDetails: {
          contactDetails: {
            // DPD hard-fails with "Maximum length exceeded" on over-long
            // values and "Invalid telephone number" on anything that isn't a
            // plain national number — clamp/normalise so one bad record can't
            // block the dispatch.
            contactName: clampDpd(opts.customerName || "Customer", 35),
            telephone: dpdPhone(opts.customerPhone || ""),
          },
          address: {
            organisation: "",
            countryCode: opts.address.countryCode,
            postcode: clampDpd(opts.address.postcode, 8),
            property: clampDpd(opts.address.property, 35),
            street: clampDpd(opts.address.street, 35),
            localityName: "",
            town: clampDpd(opts.address.town, 35),
            county: clampDpd(opts.address.county, 35),
          },
          notificationDetails: {},
        },
        networkCode,
        numberOfParcels: 1,
        totalWeight: weight,
        shippingRef1,
        shippingRef2: "",
        shippingRef3: "",
        customsValue: 0,
        deliveryInstructions: clampDpd(opts.deliveryInstructions, 50),
        parcelDescription,
        liabilityValue: null,
        liability: false,
      },
    ],
  };

  const res = await fetch(`${DPD_BASE}/shipping/shipment`, {
    method: "POST",
    headers: {
      GeoClient: `account/${opts.account}`,
      GeoSession: opts.session,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DPD create shipment failed (HTTP ${res.status}): ${text.slice(0, 300)}`);
  }

  const json: DpdShipmentResponse = await res.json();
  const dpdErrors = collectDpdErrors(json);
  if (dpdErrors.length) throw new Error(`DPD rejected the shipment — ${dpdErrors.join("; ")}`);

  const shipmentId = json?.data?.shipmentId;
  if (!shipmentId) {
    throw new Error(
      `DPD did not return a shipmentId. Raw response: ${JSON.stringify(json).slice(0, 400)}`,
    );
  }

  const detail = json?.data?.consignmentDetail?.[0];
  const trackingNumber =
    detail?.parcelNumbers?.[0] ?? detail?.consignmentNumber ?? String(shipmentId);

  return { shipmentId, trackingNumber };
}

export async function dpdGetLabel(opts: {
  session: string;
  account: string;
  shipmentId: number;
}): Promise<string> {
  // DPD Local returns the label as HTML (for A4 laser). CLP/EPL are the only
  // other options; there is no PDF endpoint in the DPD Local spec.
  const res = await fetch(
    `${DPD_BASE}/shipping/shipment/${opts.shipmentId}/label/`,
    {
      method: "GET",
      headers: {
        GeoClient: `account/${opts.account}`,
        GeoSession: opts.session,
        Accept: "text/html",
      },
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DPD get label failed (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }

  return res.text();
}
