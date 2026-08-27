"use client";

import { useEffect, useRef, useState } from "react";

import type { AddressSuggestion } from "@/app/api/address-lookup/route";

/**
 * Standard UK address typeahead for the checkout Address line. As the user
 * types a street/place ("10 Downing Street", "London"…) we query our
 * /api/address-lookup proxy (OpenStreetMap, GB-only) and show suggestions.
 * Picking one fills the address line and reports the city + postcode back to
 * the parent so the rest of the form auto-completes.
 */
export default function UkAddressField({
  value,
  setValue,
  onPick,
  inputClassName,
  maxLength,
}: {
  value: string;
  setValue: (v: string) => void;
  /** Called with the resolved city + postcode when a suggestion is chosen. */
  onPick: (parts: { city: string; postcode: string }) => void;
  inputClassName?: string;
  maxLength?: number;
}) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reqRef = useRef(0);
  const justPicked = useRef(false);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    // Don't re-search the value we just auto-filled from a pick.
    if (justPicked.current) {
      justPicked.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const id = ++reqRef.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/address-lookup?q=${encodeURIComponent(q)}`);
        const json = (await res.json()) as {
          ok: boolean;
          results: AddressSuggestion[];
        };
        if (id !== reqRef.current) return;
        const list = Array.isArray(json.results) ? json.results : [];
        setSuggestions(list);
        setOpen(list.length > 0);
      } catch {
        /* ignore */
      } finally {
        if (id === reqRef.current) setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [value]);

  function choose(s: AddressSuggestion) {
    justPicked.current = true;
    setValue(s.line1 || s.label);
    onPick({ city: s.city, postcode: s.postcode });
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        autoComplete="off"
        maxLength={maxLength}
        placeholder="Start typing your address…"
        className={inputClassName}
      />
      {loading ? (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#142e2a]/50">
          …
        </span>
      ) : null}

      {open && suggestions.length > 0 ? (
        <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-[#142e2a]/15 bg-white py-1 shadow-lg">
          {suggestions.map((s, i) => (
            <li key={`${s.label}-${i}`}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(s);
                }}
                className="block w-full px-3 py-2 text-left font-ui text-[13px] leading-snug text-[#142e2a] hover:bg-[#f0f4ef]"
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
