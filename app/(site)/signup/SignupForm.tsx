"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { describeRequestError } from "@/lib/auth-errors";

const schema = z.object({
  firstName: z.string().min(1, "First name is required").max(60),
  lastName: z.string().min(1, "Last name is required").max(60),
  // Normalise before validating: browsers, password managers and mobile
  // autofill routinely append a trailing space (and inconsistent casing) to
  // the value. `.email()` runs *after* these transforms, so a perfectly
  // valid address like "user@gmail.com " no longer fails as "invalid".
  // trim()+toLowerCase() also mirrors exactly how Payload stores the email
  // (auth email field beforeChange) and how it matches on login, so the
  // account we create here is always findable at sign-in.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

type FieldProps = {
  label: string;
  name: keyof FormValues;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  register: ReturnType<typeof useForm<FormValues>>["register"];
  error?: string;
};

function Field({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  register,
  error,
}: FieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-ui text-[14px] font-semibold text-[#142e2a]">
        {label}
      </span>
      <input
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error) || undefined}
        {...register(name)}
        className={`h-12 w-full rounded-lg bg-white px-4 font-ui text-[14px] text-[#142e2a] placeholder:text-[#142e2a]/35 outline-none ring-1 transition-shadow focus:ring-2 ${
          error
            ? "ring-red-500/60 focus:ring-red-500/70"
            : "ring-[#142e2a]/15 focus:ring-[#142e2a]/40"
        }`}
      />
      {error ? (
        <span role="alert" className="font-ui text-[12px] text-red-700">
          {error}
        </span>
      ) : null}
    </label>
  );
}

/**
 * Pull the most specific, human-readable message out of a Payload error body.
 *
 * Payload wraps field errors in a generic envelope:
 *
 *   { errors: [ {
 *       name: "ValidationError",
 *       message: "The following field is invalid: email",   // generic wrapper
 *       data: { errors: [ { path: "email",
 *               message: "A user with the given email is already registered." } ] }
 *   } ] }
 *
 * Surfacing only the top-level wrapper makes a valid-but-already-registered
 * address read as "your email is invalid", which is exactly the confusing
 * behaviour users reported. Prefer the nested per-field message so the user
 * sees the real reason (and knows to log in instead).
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
    "Could not create account"
  );
}

export default function SignupForm() {
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

  const onSubmit = handleSubmit(
    async ({ firstName, lastName, email, password }) => {
      setServerError(null);
      try {
        const name = `${firstName.trim()} ${lastName.trim()}`.trim();
        // 1) Create the user. Users collection only stores `name`,
        // so we concatenate the two form fields into the single column.
        const createRes = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name,
            email,
            password,
            role: "customer",
          }),
        });
        if (!createRes.ok) {
          const body = await createRes.json().catch(() => ({}));
          throw new Error(messageFromPayloadError(body));
        }

        // 2) Auto-login
        const loginRes = await fetch("/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });
        if (!loginRes.ok) {
          router.replace("/login?notice=created");
          return;
        }

        router.replace("/profile");
        router.refresh();
      } catch (err) {
        console.error("Signup failed:", err);
        setServerError(describeRequestError(err, "Could not create account"));
      }
    }
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex w-full flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="First Name"
          name="firstName"
          autoComplete="given-name"
          placeholder="First Name"
          register={register}
          error={errors.firstName?.message}
        />
        <Field
          label="Last Name"
          name="lastName"
          autoComplete="family-name"
          placeholder="Last Name"
          register={register}
          error={errors.lastName?.message}
        />
      </div>

      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="mail@abc.com"
        register={register}
        error={errors.email?.message}
      />

      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••••"
        register={register}
        error={errors.password?.message}
      />

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
            Creating account…
          </>
        ) : (
          "Create Account"
        )}
      </button>
    </form>
  );
}
