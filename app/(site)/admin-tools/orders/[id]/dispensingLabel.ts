/* ------------------------------------------------------------------ */
/* Dispensing-label printing                                           */
/*                                                                     */
/* Builds a self-contained 72×36mm pharmacy dispensing label and sends */
/* it straight to print via a hidden iframe — fully isolated from the  */
/* order page's own `window.print()` flow, and printer-agnostic (the   */
/* @page size forces the 72×36mm media regardless of the device).      */
/*                                                                     */
/* One label is printed per medicine line in the order.                */
/* ------------------------------------------------------------------ */

export type LabelData = {
  /** Bold brand prefix, e.g. "Mounjaro" / "Wegovy". Optional. */
  brand?: string | null;
  /** Product line after the brand, e.g. "KwikPen solution for injection 5 mg/0.6 mL". */
  productName: string;
  /** Patient (customer) name. */
  patientName: string;
  /** Dispensing date, already formatted (dd/MM/yyyy). */
  date: string;
};

/* Static text that appears on every label. (The JOOD logo, pharmacy
 * address, rule line and "Keep out of sight…" caption are PRE-PRINTED on
 * the physical label stock, so they are deliberately NOT rendered here.) */
const INSTRUCTION_TEXT =
  "Inject ONE dose under the skin ONCE every week, on the same day each week, as advised by your clinician.";
const BRAND_GREEN = "#142E2A";

/**
 * Canonical pack descriptor per brand + mg strength. The pharmacy label must
 * show the FULL medicine name, including the volume + pen text that comes AFTER
 * the strength (e.g. "…2.5 mg/0.6 mL - 2.4 mL pre-filled pen"). That tail is
 * static per medicine but is frequently missing from the order's stored title
 * (short synced titles like "Mounjaro 5 mg"), so we reconstruct it here.
 */
const MOUNJARO_PACK = "/0.6 mL - 2.4 mL pre-filled pen";
const MOUNJARO_STRENGTHS = new Set(["2.5", "5", "7.5", "10", "12.5", "15"]);
const WEGOVY_PACK: Record<string, string> = {
  "0.25": "/0.5 mL pre-filled pen",
  "0.5": "/0.5 mL pre-filled pen",
  "1": "/0.5 mL pre-filled pen",
  "1.7": "/0.75 mL pre-filled pen",
  "2.4": "/0.75 mL pre-filled pen",
};

/** Normalised mg number ("5.0" → "5", "2.50" → "2.5") from a strength string. */
function mgOf(s: string): string {
  const m = s.match(/(\d+(?:\.\d+)?)\s*mg/i);
  return m ? String(parseFloat(m[1])) : "";
}

function canonicalPack(brand: "Mounjaro" | "Wegovy", mg: string): string {
  if (brand === "Mounjaro") return MOUNJARO_STRENGTHS.has(mg) ? MOUNJARO_PACK : "";
  return WEGOVY_PACK[mg] ?? "";
}

/**
 * Builds the medicine name shown on the label from an order line item. The
 * brand (Mounjaro / Wegovy) is returned separately so it can be rendered bold;
 * the device + "solution for injection" text is static per brand, and the
 * strength — including the volume/pen pack tail — is reconstructed so the full
 * canonical name always shows.
 */
export function composeMedicine(
  title?: string | null,
  dose?: string | null,
): { brand: string; productLine: string } {
  const raw = (title ?? "").trim();
  const t = raw.toLowerCase();
  const strength = extractStrength(raw, dose);

  const brandOf = t.includes("mounjaro")
    ? { brand: "Mounjaro" as const, device: "KwikPen solution for injection" }
    : t.includes("wegovy")
      ? { brand: "Wegovy" as const, device: "FlexTouch solution for injection" }
      : null;

  if (brandOf) {
    // Strip the leading brand word (it's rendered bold separately).
    const rest = raw.replace(new RegExp(`^\\s*${brandOf.brand}\\s*`, "i"), "").trim();
    // If the title already carries the full pack tail ("…pre-filled pen"), it's
    // complete — show it verbatim, do NOT truncate.
    if (/pre-filled pen/i.test(rest)) {
      return { brand: brandOf.brand, productLine: rest };
    }
    // Otherwise rebuild the full canonical line: device + strength + the static
    // volume/pen tail looked up from the mg strength.
    const mg = mgOf(strength || raw);
    const pack = mg ? canonicalPack(brandOf.brand, mg) : "";
    const strengthFull = mg ? `${mg} mg${pack}` : strength;
    const productLine = `${brandOf.device}${strengthFull ? ` ${strengthFull}` : ""}`;
    return { brand: brandOf.brand, productLine };
  }

  // Unknown product — show the raw title, appending the dose if it's not
  // already part of the title.
  const d = (dose ?? "").trim();
  const productLine =
    d && !t.includes(d.toLowerCase()) ? `${raw} ${d}`.trim() : raw;
  return { brand: "", productLine: productLine || "—" };
}

function extractStrength(title: string, dose?: string | null): string {
  const d = (dose ?? "").trim();
  const m = title.match(/(\d+(?:\.\d+)?\s*mg(?:\s*\/\s*\d+(?:\.\d+)?\s*m?l)?)/i);
  const fromTitle = m ? m[1].replace(/\s+/g, " ").trim() : "";
  // Prefer the fuller strength (including volume, e.g. "2.5 mg/0.6 mL") taken
  // from the product title; fall back to the order's short dose field.
  if (fromTitle.includes("/")) return fromTitle;
  if (d) return d;
  return fromTitle;
}

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Today's date as dd/MM/yyyy (the dispensing date). */
export function dispensingDate(d: Date = new Date()): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function labelMarkup(l: LabelData): string {
  const brand = l.brand?.trim()
    ? `<span class="brand">${esc(l.brand.trim())}</span> `
    : "";
  // Bold the strength (e.g. "2.5 mg/0.6 mL") within the product line, matching
  // the bold brand, so both stand out on the printed label.
  const nameHtml = esc(l.productName).replace(
    /(\d+(?:\.\d+)?\s*mg(?:\s*\/\s*\d+(?:\.\d+)?\s*m?l)?)/i,
    '<span class="strength">$1</span>',
  );
  // The physical label stock is PRE-PRINTED with the static frame (JOOD
  // logo, pharmacy address, the rule line and the "Keep out of sight…"
  // caption), so we print ONLY the variable data, positioned to land in
  // the blank middle area between the pre-printed top caption and the
  // pre-printed rule/footer.
  return `<div class="label"><div class="content">
    <div class="top">
      <div class="pname">${brand}${nameHtml}</div>
      <div class="instruction">${esc(INSTRUCTION_TEXT)}</div>
    </div>
    <div class="spacer"></div>
    <div class="who">
      <span class="patient">${esc(l.patientName)}</span>
      <span class="date">${esc(l.date)}</span>
    </div>
  </div></div>`;
}

export function buildLabelsDocument(labels: LabelData[]): string {
  const body = labels.map(labelMarkup).join("\n");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Dispensing label</title>
<style>
  @page { size: 72mm 36mm; margin: 0; }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  html, body {
    margin: 0; padding: 0; background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .label {
    position: relative;
    width: 72mm; height: 36mm;
    font-family: Arial, Helvetica, sans-serif;
    color: #000; overflow: hidden;
    page-break-after: always;
  }
  .label:last-child { page-break-after: auto; }
  /* Variable data only — the stock is pre-printed with the static frame.
     Top padding clears the pre-printed "Keep out of sight…" caption;
     bottom padding keeps the patient/date row just above the pre-printed
     rule + logo + address footer. */
  .content {
    position: absolute; inset: 0;
    padding: 4.5mm 3mm 9.5mm 3mm;
    display: flex; flex-direction: column;
  }
  .top { text-align: center; line-height: 1.12; }
  .pname { font-size: 6.4pt; font-weight: 500; color: ${BRAND_GREEN}; }
  .pname .brand { font-weight: 800; }
  .pname .strength { font-weight: 800; }
  .instruction {
    font-size: 5.6pt; line-height: 1.3; margin-top: 1.1mm;
    color: ${BRAND_GREEN};
  }
  .spacer { flex: 1 1 auto; }
  .who {
    display: flex; justify-content: space-between; align-items: flex-end;
  }
  .patient { font-size: 7.5pt; font-weight: 700; color: ${BRAND_GREEN}; }
  .date { font-size: 6.5pt; color: ${BRAND_GREEN}; }
</style></head><body>${body}</body></html>`;
}

/* Re-entrancy guard: a double-click (or an impatient second click while the
 * printer spools) must not queue a second identical print job. */
let printing = false;

/**
 * Print an arbitrary, complete HTML document via a hidden iframe and the
 * browser print dialog. Unlike window.open(), this is NOT blocked by popup
 * blockers — which is why it's used for both the dispensing labels and the
 * DPD dispatch label (whose HTML is returned by the DPD API).
 */
export function printHtmlDocument(html: string): void {
  if (typeof document === "undefined" || !html) return;
  if (printing) return;
  printing = true;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = iframe.contentDocument ?? win?.document;
  if (!win || !doc) {
    printing = false;
    iframe.remove();
    return;
  }

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    printing = false;
    iframe.remove();
  };

  win.onafterprint = cleanup;

  doc.open();
  // Strip any embedded auto-print scripts so we control printing exactly once.
  doc.write(html.replace(/<script[\s\S]*?<\/script>/gi, ""));
  doc.close();

  /* Give the iframe a tick to lay out before invoking print. */
  win.setTimeout(() => {
    win.focus();
    win.print();
    /* Safety net in case onafterprint never fires (some browsers). */
    win.setTimeout(cleanup, 60000);
  }, 300);
}

/** Render the dispensing labels into a hidden iframe and print. */
export function printLabels(labels: LabelData[]): void {
  if (labels.length === 0) return;
  printHtmlDocument(buildLabelsDocument(labels));
}
