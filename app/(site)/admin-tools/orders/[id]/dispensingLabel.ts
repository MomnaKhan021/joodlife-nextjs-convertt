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

/* Static text that appears on every label. */
const INSTRUCTION_TEXT =
  "Inject ONE dose under the skin ONCE every week, on the same day each week, as advised by your clinician.";
const VERTICAL_TEXT = "Keep out of sight and reach of children";
const PHARMACY_ADDRESS = "Jood Pharmacy | 7 Lime Avenue | Northwich | CW8 3DE";
const BRAND_GREEN = "#142E2A";

/**
 * Builds the medicine name shown on the label from an order line item. The
 * brand (Mounjaro / Wegovy) is returned separately so it can be rendered bold;
 * the device + "solution for injection" text is static per brand, and the
 * strength is taken from the order (dose field, or parsed from the title).
 */
export function composeMedicine(
  title?: string | null,
  dose?: string | null,
): { brand: string; productLine: string } {
  const raw = (title ?? "").trim();
  const t = raw.toLowerCase();
  const strength = extractStrength(raw, dose);
  const suffix = strength ? ` ${strength}` : "";

  const brandOf = t.includes("mounjaro")
    ? { brand: "Mounjaro", device: "KwikPen solution for injection" }
    : t.includes("wegovy")
      ? { brand: "Wegovy", device: "FlexTouch solution for injection" }
      : null;

  if (brandOf) {
    // Strip the leading brand word (it's rendered bold separately). If the
    // title already carries the full descriptor + pack (e.g. "KwikPen solution
    // for injection 2.5 mg/0.6 mL - 2.4 mL pre-filled pen"), show it verbatim
    // and in full — do NOT truncate. Otherwise (short synced titles like
    // "Mounjaro 5 mg") build the standard device + strength line.
    const rest = raw.replace(new RegExp(`^\\s*${brandOf.brand}\\s*`, "i"), "").trim();
    const hasDescriptor = /solution for injection|kwikpen|flextouch/i.test(rest);
    const productLine = hasDescriptor ? rest : `${brandOf.device}${suffix}`;
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

/* Official JOOD wordmark (brand colour #142E2A). Inlined so it needs no
 * network load. The clipPath/defs from the source export are dropped to
 * avoid duplicate element ids when multiple labels share one document. */
const LOGO_SVG = `<svg width="19.8mm" height="5.6mm" viewBox="0 0 304 86" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<path d="M61.5671 53.4144C61.5671 54.1318 61.5671 54.8492 61.5671 55.5993C60.8496 67.1757 53.6103 76.5999 43.8274 81.687C39.849 83.8719 35.1206 84.5893 30.4248 84.5893C15.5874 84.5893 2.90226 73.7303 0 59.219C0 58.5015 0.358707 58.1428 1.07612 58.1428H18.4571C18.8158 58.1428 19.1745 58.5015 19.1745 58.8602C21.3593 63.1973 26.4138 66.4583 31.8597 65.3822C37.6642 64.3061 42.0013 58.8602 42.0013 53.0557V2.67377C42.0013 1.95636 42.36 1.59766 43.0774 1.59766H60.4583C61.1757 1.59766 61.5345 1.95636 61.5345 2.67377V53.4144H61.5671Z" fill="#142E2A"/>
<path d="M303.925 40.0138C302.49 18.6544 283.642 2.34961 261.891 2.34961H236.912C236.195 2.34961 235.836 2.70831 235.836 3.42572V82.7651C235.836 83.4825 236.195 83.8412 236.912 83.8412H263C286.903 83.4825 305.36 63.558 303.925 40.0138ZM278.913 59.1883C274.935 63.1667 268.772 66.0689 262.25 66.0689H255.369C254.652 66.0689 254.293 65.7102 254.293 64.9928V20.448C254.293 19.7306 254.652 19.3719 255.369 19.3719H262.25C275.294 19.3719 285.794 29.8722 285.794 42.9161C285.794 49.4054 282.924 55.2099 278.913 59.1883Z" fill="#142E2A"/>
<path d="M228.202 47.9702C225.658 65.3512 215.875 77.3189 199.57 83.1235C182.189 88.928 167.319 84.1996 155.026 71.1557C153.721 69.5252 151.536 67.3078 150.036 65.5468C149.743 65.2207 149.743 64.7642 149.971 64.4055C153.297 59.2206 158.482 50.7421 160.406 47.6767C160.765 47.1224 161.58 47.0572 162.004 47.5789C163.537 49.5355 165.819 52.3399 167.319 54.1008C173.124 60.9815 180.005 65.6773 189.429 64.6012C198.853 63.5251 205.375 57.3618 207.527 46.8615C209.712 37.0786 205.342 27.6544 196.668 22.9586C188.711 18.2628 179.646 19.6976 172.765 26.2196C167.319 31.3067 151.406 56.6444 147.786 63.1663C137.286 79.1125 123.166 87.4279 103.6 84.167C84.7517 80.906 70.9904 66.0686 69.5556 46.8615C67.7295 26.2196 78.2624 9.55603 97.0782 2.31668C114.459 -3.84655 134.742 2.67539 145.634 17.9041C145.797 18.1324 146.58 19.2411 147.069 19.8933C147.297 20.2194 147.33 20.6759 147.101 21.002L137.123 36.5569C136.797 37.0786 136.047 37.1764 135.623 36.7525C133.471 34.6655 128.318 28.5675 125.351 25.8935C119.546 20.4477 111.948 18.2954 104.35 20.8064C96.3934 23.7086 91.665 29.8719 90.2301 38.1873C88.404 48.6877 93.8498 59.188 102.915 63.1663C112.34 67.1447 122.481 63.525 129.003 54.1008C131.547 50.8399 135.884 43.2418 135.884 43.2418L141.688 34.1763L150.395 20.7738C153.297 16.7954 156.558 12.817 160.537 9.55603C173.939 -1.30299 192.429 -3.12914 207.625 5.21894C222.038 14.2844 230.387 30.948 228.202 47.9702Z" fill="#142E2A"/>
</svg>`;

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
    <div class="foot">
      ${LOGO_SVG}
      <div class="addr">${esc(PHARMACY_ADDRESS)}</div>
    </div>
  </div><div class="side"><span>${esc(VERTICAL_TEXT)}</span></div></div>`;
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
  .content {
    position: absolute; inset: 0;
    padding: 1.6mm 6mm 1.4mm 2.5mm;
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
    border-bottom: 0.4mm solid ${BRAND_GREEN}; padding-bottom: 0.6mm;
  }
  .patient { font-size: 7.5pt; font-weight: 700; color: ${BRAND_GREEN}; }
  .date { font-size: 6.5pt; color: ${BRAND_GREEN}; }
  .foot {
    display: flex; flex-direction: column; align-items: center;
    margin-top: 0.8mm;
  }
  .addr { font-size: 5pt; margin-top: 0.2mm; color: ${BRAND_GREEN}; }
  .side {
    position: absolute; top: 0; right: 0; bottom: 0; width: 5mm;
    display: flex; align-items: center; justify-content: center;
  }
  .side span {
    writing-mode: vertical-rl;
    font-size: 5pt; letter-spacing: -0.1pt; white-space: nowrap;
    color: ${BRAND_GREEN};
  }
</style></head><body>${body}</body></html>`;
}

/** Render the labels into a hidden iframe and trigger the print dialog. */
export function printLabels(labels: LabelData[]): void {
  if (typeof document === "undefined" || labels.length === 0) return;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = iframe.contentDocument ?? win?.document;
  if (!win || !doc) {
    iframe.remove();
    return;
  }

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    iframe.remove();
  };

  win.onafterprint = cleanup;

  doc.open();
  doc.write(buildLabelsDocument(labels));
  doc.close();

  /* Give the iframe a tick to lay out before invoking print. */
  win.setTimeout(() => {
    win.focus();
    win.print();
    /* Safety net in case onafterprint never fires (some browsers). */
    win.setTimeout(cleanup, 60000);
  }, 300);
}
