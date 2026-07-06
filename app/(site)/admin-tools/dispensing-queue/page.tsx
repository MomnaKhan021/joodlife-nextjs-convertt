"use client";

/**
 * Dispensing queue — the two label actions the dispensing team needs:
 *   - Print dispensing label  (goes on the medicine pack)
 *   - Print dispatch label    (goes on the parcel)
 *
 * The dispensing label uses the same branded 72×36mm template as the
 * per-order label (see orders/[id]/dispensingLabel). Real patient/medicine
 * data lives on the individual order page — this queue action prints a blank
 * branded label for manual completion.
 */

import { buildLabelsDocument, dispensingDate } from "../orders/[id]/dispensingLabel";

function dispensingLabel() {
  const html = buildLabelsDocument([
    {
      brand: "",
      productName: "",
      patientName: "",
      date: dispensingDate(),
    },
  ]);
  const w = window.open("", "_blank", "width=520,height=360");
  if (!w) {
    alert("Please allow pop-ups to print the label.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

function openPrintable(title: string, bodyHtml: string) {
  const w = window.open("", "_blank", "width=520,height=640");
  if (!w) {
    alert("Please allow pop-ups to print the label.");
    return;
  }
  w.document.write(`<!doctype html>
<html>
  <head>
    <title>${title}</title>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 0; padding: 24px; color: #142e2a; }
      .label { border: 2px solid #142e2a; border-radius: 8px; padding: 20px; max-width: 420px; }
      h1 { font-size: 16px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.06em; }
      .brand { font-size: 13px; font-weight: 700; margin-bottom: 12px; }
      .row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px dashed #cdd8bf; }
      .row span:first-child { color: #4a5c46; }
      .hint { margin-top: 16px; font-size: 11px; color: #888; }
      @media print { .noprint { display: none; } body { padding: 0; } }
    </style>
  </head>
  <body>
    <div class="label">
      <div class="brand">JoodLife Pharmacy</div>
      <h1>${title}</h1>
      ${bodyHtml}
      <p class="hint">Generated ${new Date().toLocaleString("en-GB")}</p>
    </div>
    <button class="noprint" style="margin-top:16px;padding:8px 16px;border:0;border-radius:6px;background:#142e2a;color:#fff;font-size:13px;cursor:pointer" onclick="window.print()">Print</button>
  </body>
</html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

function dispatchLabel() {
  openPrintable("Dispatch label", `
    <div class="row"><span>Ship to</span><span>____________________</span></div>
    <div class="row"><span>Address</span><span>____________________</span></div>
    <div class="row"><span>Postcode</span><span>____________________</span></div>
    <div class="row"><span>Order ref</span><span>____________________</span></div>
    <div class="row"><span>Service</span><span>____________________</span></div>
    <div class="row"><span>Tracking</span><span>____________________</span></div>
  `);
}

export default function DispensingQueuePage() {
  return (
    <div className="mx-auto w-full max-w-[1000px] px-5 py-6 md:px-8 md:py-8">
      <header className="mb-6">
        <h1 className="text-[22px] font-bold tracking-tight text-[#1a1a1a]">Dispensing queue</h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Print the labels needed to dispense and dispatch an order.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={dispensingLabel}
          className="flex flex-col items-start gap-2 rounded-[12px] border border-[#e1e3e5] bg-white p-6 text-left transition-colors hover:border-[#142e2a] hover:bg-[#f7f9f2]"
        >
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#142e2a] text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 9V4h12v5M6 18H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M8 14h8v6H8v-6z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-[15px] font-semibold text-[#1a1a1a]">Print dispensing label</span>
          <span className="text-[13px] text-[#616161]">Label for the medicine pack.</span>
        </button>

        <button
          type="button"
          onClick={dispatchLabel}
          className="flex flex-col items-start gap-2 rounded-[12px] border border-[#e1e3e5] bg-white p-6 text-left transition-colors hover:border-[#142e2a] hover:bg-[#f7f9f2]"
        >
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#142e2a] text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M16 3h5v5M21 3l-9 9M3 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-[15px] font-semibold text-[#1a1a1a]">Print dispatch label</span>
          <span className="text-[13px] text-[#616161]">Label for the parcel.</span>
        </button>
      </div>
    </div>
  );
}
