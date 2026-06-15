/**
 * Turn a thrown value from an auth fetch into a clear, user-facing message.
 *
 * The forms previously fell back to a bare "Something went wrong" whenever the
 * caught value wasn't an Error, which hid the real cause. The most common
 * non-obvious case is `fetch()` rejecting with a `TypeError` (network down,
 * CORS/mixed-content block, request aborted, or the API host being
 * unreachable) — we surface a connectivity-specific message for that, and the
 * real error text otherwise.
 */
export function describeRequestError(
  err: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  // fetch() rejects with a TypeError on network-level failures.
  if (err instanceof TypeError) {
    return "We couldn't reach the server. Please check your internet connection and try again.";
  }
  // Some browsers reject with a DOMException (e.g. aborted requests) that is
  // NOT an `instanceof Error`, which is exactly what produced the opaque
  // "Something went wrong".
  if (
    typeof DOMException !== "undefined" &&
    err instanceof DOMException
  ) {
    return "The request was interrupted. Please try again.";
  }
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}
