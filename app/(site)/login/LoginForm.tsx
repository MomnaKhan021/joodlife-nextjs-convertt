"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { describeRequestError } from "@/lib/auth-errors";

const schema = z.object({
  // Normalise before validating so a stray trailing space / odd casing from
  // autofill doesn't read as "invalid", and so the value matches the
  // lowercased+trimmed email Payload stored at signup (login is case- and
  // whitespace-insensitive server-side; we mirror that here).
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

/**
 * Pull the most specific message out of a Payload error body. Payload nests
 * the real per-field reason inside `errors[0].data.errors[]`; the top-level
 * `errors[0].message` is only a generic wrapper ("The following field is
 * invalid: email") that misleadingly reads as a bad-format error. See the
 * matching helper in the signup form.
 */
function messageFromPayloadError(body: unknown): string {
  const b = body as
    | {
        errors?: Array<{
          message?: string;
          data?: { errors?: Array<{ message?: string }> };
        }>;
        message?: string;
      }
    | undefined;

  const top = b?.errors?.[0];
  return (
    top?.data?.errors?.[0]?.message ??
    top?.message ??
    b?.message ??
    "Invalid email or password"
  );
}

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(messageFromPayloadError(body));
      }
      router.replace(redirectTo);
      router.refresh();
    } catch (err) {
      console.error("Login failed:", err);
      setServerError(describeRequestError(err, "Invalid email or password"));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex w-full flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="font-ui text-[14px] font-semibold text-[#142e2a]">
          Email
        </span>
        <input
          type="email"
          autoComplete="email"
          placeholder="mail@abc.com"
          aria-invalid={Boolean(errors.email) || undefined}
          {...register("email")}
          className={`h-12 w-full rounded-lg bg-white px-4 font-ui text-[14px] text-[#142e2a] placeholder:text-[#142e2a]/35 outline-none ring-1 transition-shadow focus:ring-2 ${
            errors.email
              ? "ring-red-500/60 focus:ring-red-500/70"
              : "ring-[#142e2a]/15 focus:ring-[#142e2a]/40"
          }`}
        />
        {errors.email ? (
          <span role="alert" className="font-ui text-[12px] text-red-700">
            {errors.email.message}
          </span>
        ) : null}
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-ui text-[14px] font-semibold text-[#142e2a]">
          password
        </span>
        <input
          type="password"
          autoComplete="current-password"
          placeholder="••••••••••"
          aria-invalid={Boolean(errors.password) || undefined}
          {...register("password")}
          className={`h-12 w-full rounded-lg bg-white px-4 font-ui text-[14px] text-[#142e2a] placeholder:text-[#142e2a]/35 outline-none ring-1 transition-shadow focus:ring-2 ${
            errors.password
              ? "ring-red-500/60 focus:ring-red-500/70"
              : "ring-[#142e2a]/15 focus:ring-[#142e2a]/40"
          }`}
        />
        {errors.password ? (
          <span role="alert" className="font-ui text-[12px] text-red-700">
            {errors.password.message}
          </span>
        ) : null}
      </label>

      <div className="flex justify-end">
        <Link
          href="/forgot"
          className="font-ui text-[13px] font-medium text-[#142e2a] underline underline-offset-2 decoration-[1px] hover:text-[#0c2421]"
        >
          Forgot your password?
        </Link>
      </div>

      {serverError ? (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 font-ui text-[13px] text-red-700"
        >
          {serverError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 inline-flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#142e2a] px-6 font-ui text-[14px] font-semibold text-white transition-all hover:bg-[#0c2421] hover:shadow-[0_8px_18px_rgba(20,46,42,0.16)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <span
              aria-hidden
              className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
            Signing in…
          </>
        ) : (
          "Log Into Your Account"
        )}
      </button>
    </form>
  );
}
