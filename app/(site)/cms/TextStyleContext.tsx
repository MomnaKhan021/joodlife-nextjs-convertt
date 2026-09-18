"use client";

import { createContext, useContext, type ReactNode } from "react";

import TypeControl from "./TypeControl";
import type { TextStyle } from "@/lib/textStyle";

/**
 * Lets any field in an editor show the "Aa" size/weight control for a text by
 * key, without each call site threading state through. An editor provides the
 * map once; FormKit's fields read it when given a key.
 */
export type TextStyleApi = {
  get: (k: string) => TextStyle | undefined;
  set: (k: string) => (next: TextStyle) => void;
};

export const TextStyleCtx = createContext<TextStyleApi | null>(null);

/** The "Aa" control for one text; renders nothing outside a provider. */
export function Ts({ k, label }: { k?: string; label: string }) {
  const ctx = useContext(TextStyleCtx);
  if (!ctx || !k) return null;
  return <TypeControl label={label} value={ctx.get(k)} onChange={ctx.set(k)} />;
}

/** A label line with its "Aa" on the right. */
export function LabelRow({ children, k, label }: { children: ReactNode; k?: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      {children}
      <Ts k={k} label={label} />
    </div>
  );
}
