import { forwardRef, type InputHTMLAttributes } from "react";

type FieldInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  helper?: string;
};

const FieldInput = forwardRef<HTMLInputElement, FieldInputProps>(
  function FieldInput({ label, error, helper, className, ...rest }, ref) {
    return (
      <label className="flex flex-col gap-1.5">
        <span className="font-ui text-[13px] font-semibold text-[#142e2a]">
          {label}
        </span>
        <input
          {...rest}
          ref={ref}
          aria-invalid={Boolean(error) || undefined}
          className={`h-11 w-full rounded-lg bg-white px-3 font-ui text-[14px] text-[#142e2a] outline-none ring-1 transition-shadow focus:ring-2 ${
            error
              ? "ring-red-500/60 focus:ring-red-500/70"
              : "ring-[#142e2a]/10 focus:ring-[#142e2a]/40"
          } ${className ?? ""}`}
        />
        {error ? (
          <span role="alert" className="font-ui text-[12px] text-red-700">
            {error}
          </span>
        ) : helper ? (
          <span className="font-ui text-[12px] text-[#142e2a]/60">{helper}</span>
        ) : null}
      </label>
    );
  }
);

export default FieldInput;
