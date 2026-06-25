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
  /** Product name + strength, e.g. "Mounjaro KwikPen soln for inj 5mg/0.6ml". */
  productName: string;
  /** Pack / format line, e.g. "2.4ml p/f pen". Optional. */
  packLine?: string | null;
  /** Dosage instruction, e.g. "use as directed". */
  directions: string;
  /** Patient (customer) name. */
  patientName: string;
  /** Dispensing date, already formatted (dd/MM/yyyy). */
  date: string;
};

/* Static text that appears on every label. */
const CAUTION_TEXT =
  "READ THE ADDITIONAL INFORMATION GIVEN WITH THIS MEDICINE. DO NOT SWALLOW. STORE IN A FRIDGE";
const VERTICAL_TEXT = "Keep out of sight and reach of children";
const PHARMACY_ADDRESS = "Jood Pharmacy | 7 Lime Avenue | Northwich | CW8 3DE";

/* Placeholder JOOD logo (interlocking-rings wordmark). Swap for the
 * official asset when supplied — inline so it needs no network load. */
const LOGO_SVG = `<svg width="26mm" height="6mm" viewBox="0 0 124 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <text x="0" y="27" font-size="31" font-weight="700" fill="#000" font-family="Arial, Helvetica, sans-serif">J</text>
  <circle cx="47" cy="17" r="11.5" fill="none" stroke="#000" stroke-width="5.5"/>
  <circle cx="66" cy="17" r="11.5" fill="none" stroke="#000" stroke-width="5.5"/>
  <text x="83" y="27" font-size="31" font-weight="700" fill="#000" font-family="Arial, Helvetica, sans-serif">D</text>
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
  const pack = l.packLine ? `<div class="pname">${esc(l.packLine)}</div>` : "";
  return `<div class="label"><div class="content">
    <div class="top">
      <div class="pname">${esc(l.productName)}</div>
      ${pack}
      <div class="directed">${esc(l.directions)}</div>
    </div>
    <div class="caution">${esc(CAUTION_TEXT)}</div>
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
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
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
  .pname { font-size: 8pt; font-weight: 700; text-decoration: underline; }
  .directed { font-size: 6.5pt; margin-top: 0.4mm; }
  .caution {
    text-align: center; font-size: 5pt; line-height: 1.25;
    margin-top: 1mm; color: #1a1a1a;
  }
  .spacer { flex: 1 1 auto; }
  .who {
    display: flex; justify-content: space-between; align-items: flex-end;
    border-bottom: 0.3mm solid #000; padding-bottom: 0.6mm;
  }
  .patient { font-size: 7.5pt; font-weight: 700; }
  .date { font-size: 6.5pt; }
  .foot {
    display: flex; flex-direction: column; align-items: center;
    margin-top: 0.8mm;
  }
  .addr { font-size: 5pt; margin-top: 0.2mm; }
  .side {
    position: absolute; top: 0; right: 0; bottom: 0; width: 5mm;
    display: flex; align-items: center; justify-content: center;
  }
  .side span {
    writing-mode: vertical-rl;
    font-size: 5pt; letter-spacing: -0.1pt; white-space: nowrap;
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
