"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { describeRequestError } from "@/lib/auth-errors";

const schema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordForm({ token }: { token: string }) {
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

  const onSubmit = handleSubmit(async ({ password }) => {
    setServerError(null);
    try {
      const res = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body?.errors?.[0]?.message ??
            body?.message ??
            "This reset link is invalid or has expired. Please request a new one."
        );
      }
      // reset-password sets the auth cookie, i.e. logs the user straight in.
      router.replace("/profile");
      router.refresh();
    } catch (err) {
      console.error("Reset-password request failed:", err);
      setServerError(
        describeRequestError(
          err,
          "This reset link is invalid or has expired. Please request a new one."
        )
      );
    }
  });

  // No token in the link → can't reset. Steer the user back to /forgot.
  if (!token) {
    return (
      <div className="w-full">
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 font-ui text-[13px] text-red-700"
        >
          This reset link is missing its token or is invalid. Please request a
          new password reset.
        </p>
        <p className="mt-6 w-full text-center font-ui text-[14px] text-[#142e2a]/75 md:text-left">
          <Link
            href="/forgot"
            className="font-semibold text-[#142e2a] underline underline-offset-2 decoration-[1px] hover:text-[#0c2421]"
          >
            Request a new link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex w-full flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="font-ui text-[14px] font-semibold text-[#142e2a]">
          New password
        </span>
        <input
          type="password"
          autoComplete="new-password"
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

      <label className="flex flex-col gap-2">
        <span className="font-ui text-[14px] font-semibold text-[#142e2a]">
          Confirm new password
        </span>
        <input
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••"
          aria-invalid={Boolean(errors.confirmPassword) || undefined}
          {...register("confirmPassword")}
          className={`h-12 w-full rounded-lg bg-white px-4 font-ui text-[14px] text-[#142e2a] placeholder:text-[#142e2a]/35 outline-none ring-1 transition-shadow focus:ring-2 ${
            errors.confirmPassword
              ? "ring-red-500/60 focus:ring-red-500/70"
              : "ring-[#142e2a]/15 focus:ring-[#142e2a]/40"
          }`}
        />
        {errors.confirmPassword ? (
          <span role="alert" className="font-ui text-[12px] text-red-700">
            {errors.confirmPassword.message}
          </span>
        ) : null}
      </label>

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
            Updating…
          </>
        ) : (
          "Set new password"
        )}
      </button>
    </form>
  );
}
