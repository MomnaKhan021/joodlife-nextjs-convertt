"use client";

import { useEffect, useRef, useState } from "react";

/**
 * UK-only postcode field with live autocomplete + validation, powered by the
 * free postcodes.io API (no API key, no billing, covers the whole UK).
 *
 *  - As the user types, we fetch postcode suggestions and show a dropdown.
 *  - Picking a suggestion (or blurring on a complete postcode) validates it
 *    and auto-fills the City via the postcode's `admin_district`.
 *  - `onValidityChange` lets the parent gate checkout to valid UK postcodes
 *    only — which is how we restrict the store to UK patients.
 *
 * postcodes.io only covers the United Kingdom, so any postcode it resolves is
 * by definition a UK address.
 */

type LookupResult = {
  postcode: string;
  admin_district: string | null;
  admin_ward: string | null;
  parish: string | null;
  region: string | null;
  country: string | null;
  post_town?: string | null;
};

export default function UkPostcodeField({
  postcode,
  setPostcode,
  onResolveCity,
  onValidityChange,
  inputClassName,
}: {
  postcode: string;
  setPostcode: (v: string) => void;
  /** Called with the resolved town/city when a postcode validates. */
  onResolveCity: (city: string) => void;
  /** Called whenever validity changes (true only for a real UK postcode). */
  onValidityChange: (valid: boolean) => void;
  inputClassName?: string;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "checking" | "valid" | "invalid">(
    "idle"
  );
  const wrapRef = useRef<HTMLDivElement>(null);
  // Bumped on each user action so out-of-order async responses are ignored.
  const reqRef = useRef(0);
  const didMount = useRef(false);

  // Close the dropdown on outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Validate a prefilled postcode (saved customer) once on mount, without
  // popping the suggestions list open.
  useEffect(() => {
    if (postcode.trim().length >= 5) void validate(postcode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced autocomplete as the user types (skip the very first render so a
  // prefilled value doesn't immediately open the dropdown).
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    const q = postcode.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const id = ++reqRef.current;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.postcodes.io/postcodes/${encodeURIComponent(q)}/autocomplete`
        );
        const json = (await res.json()) as { result: string[] | null };
        if (id !== reqRef.current) return; // a newer keystroke superseded this
        const list = Array.isArray(json.result) ? json.result : [];
        setSuggestions(list);
        setOpen(list.length > 0);
      } catch {
        /* network blip — leave existing suggestions */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [postcode]);

  async function validate(pc: string) {
    const clean = pc.trim();
    if (!clean) {
      setStatus("idle");
      onValidityChange(false);
      return;
    }
    setStatus("checking");
    const id = ++reqRef.current;
    try {
      const res = await fetch(
        `https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`
      );
      const json = (await res.json()) as {
        status: number;
        result: LookupResult | null;
      };
      if (id !== reqRef.current) return;
      if (res.ok && json.result) {
        const r = json.result;
        setStatus("valid");
        onValidityChange(true);
        // Normalise to the canonical formatting postcodes.io returns.
        setPostcode(r.postcode);
        const city =
          r.post_town || r.admin_district || r.parish || r.region || "";
        if (city) onResolveCity(city);
      } else {
        setStatus("invalid");
        onValidityChange(false);
      }
    } catch {
      // Don't hard-fail checkout on a network error — treat as unverified.
      if (id === reqRef.current) {
        setStatus("idle");
        onValidityChange(false);
      }
    }
  }

  function choose(pc: string) {
    setOpen(false);
    setSuggestions([]);
    setPostcode(pc);
    void validate(pc);
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        value={postcode}
        onChange={(e) => {
          setPostcode(e.target.value.toUpperCase());
          setStatus("idle");
          onValidityChange(false);
        }}
        onBlur={() => {
          // Validate on blur if they typed a full postcode without picking.
          if (postcode.trim().length >= 5) void validate(postcode);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        autoComplete="postal-code"
        placeholder="e.g. SW1A 1AA"
        aria-invalid={status === "invalid"}
        className={inputClassName}
      />

      {status === "valid" ? (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-[#1a7f37]">
          ✓ UK
        </span>
      ) : null}
      {status === "checking" ? (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#142e2a]/50">
          …
        </span>
      ) : null}

      {open && suggestions.length > 0 ? (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[#142e2a]/15 bg-white py-1 shadow-lg">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // keep focus / fire before blur
                  choose(s);
                }}
                className="block w-full px-3 py-2 text-left font-ui text-[14px] text-[#142e2a] hover:bg-[#f0f4ef]"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {status === "invalid" ? (
        <p className="mt-1 font-ui text-[12px] text-[#c0392b]">
          Enter a valid UK postcode. We currently deliver to UK addresses only.
        </p>
      ) : null}
    </div>
  );
}
