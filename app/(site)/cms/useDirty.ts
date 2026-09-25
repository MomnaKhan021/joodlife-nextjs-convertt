"use client";

import { useState } from "react";

/**
 * Whether a form has unsaved changes.
 *
 * Deliberately compares the payload the screen would send, not the individual
 * fields: "dirty" then means exactly "saving would change something on the
 * server", which is the only honest reason to offer the button. It also makes
 * the failure safe — anything the comparison cannot see is something the save
 * would not send either, and a snapshot that differs for a harmless reason
 * leaves Save enabled, which is where it was before.
 *
 * `markSaved` is called after a successful save so the button settles back to
 * disabled until the next edit.
 */
export function useDirty(snapshot: string) {
  const [pristine, setPristine] = useState(snapshot);
  return {
    dirty: snapshot !== pristine,
    markSaved: () => setPristine(snapshot),
  };
}
