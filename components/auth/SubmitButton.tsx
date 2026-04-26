import type { ReactNode } from "react";

type Props = {
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
};

export default function SubmitButton({
  loading = false,
  loadingLabel = "Please wait…",
  children,
}: Props) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-2 inline-flex h-[50px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#142e2a] px-6 font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#0c2421] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <>
          <span
            aria-hidden
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
