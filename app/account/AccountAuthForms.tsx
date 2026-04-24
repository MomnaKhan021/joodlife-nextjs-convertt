"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Mode = "signin" | "signup";

type FieldErrors = Partial<Record<"name" | "email" | "password", string>>;

export default function AccountAuthForms() {
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setErrors({});

    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();

    // Client-side validation
    const clientErrors: FieldErrors = {};
    if (mode === "signup" && name.length < 2) {
      clientErrors.name = "Please enter your name";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      clientErrors.email = "Enter a valid email address";
    }
    if (password.length < 6) {
      clientErrors.password = "Password must be at least 6 characters";
    }
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        // Payload: POST /api/users creates a new user
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name, email, password, role: "customer" }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body?.errors?.[0]?.message ??
              body?.message ??
              "Could not create account"
          );
        }
        // After sign-up, log in automatically so the session cookie is set
        const loginRes = await fetch("/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });
        if (!loginRes.ok) {
          // Sign-up succeeded but auto-login failed — nudge to sign in
          setMode("signin");
          setFormError("Account created. Please sign in.");
          return;
        }
      } else {
        // Sign in
        const res = await fetch("/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body?.errors?.[0]?.message ??
              body?.message ??
              "Invalid email or password"
          );
        }
      }

      // Reload so the server component re-reads the cookie and shows the dashboard
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[480px] rounded-2xl border border-[#142e2a]/10 bg-[#f7f9f2] p-6 md:p-8">
      {/* Mode toggle */}
      <div className="mb-6 flex rounded-lg bg-white p-1 ring-1 ring-[#142e2a]/10">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setErrors({});
              setFormError(null);
            }}
            className={`flex-1 cursor-pointer rounded-md px-4 py-2 font-ui text-[14px] font-semibold transition-colors ${
              mode === m
                ? "bg-[#142e2a] text-white"
                : "text-[#142e2a]/70 hover:text-[#142e2a]"
            }`}
          >
            {m === "signin" ? "Sign in" : "Sign up"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        {mode === "signup" ? (
          <Field
            name="name"
            label="Full name"
            type="text"
            autoComplete="name"
            error={errors.name}
            required
          />
        ) : null}
        <Field
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email}
          required
        />
        <Field
          name="password"
          label="Password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          error={errors.password}
          helper={mode === "signup" ? "At least 6 characters" : undefined}
          required
        />

        {formError ? (
          <p
            role="alert"
            className="rounded-md bg-red-50 px-3 py-2 font-ui text-[13px] text-red-700"
          >
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex h-[50px] cursor-pointer items-center justify-center rounded-lg bg-[#142e2a] px-6 font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#0c2421] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Please wait…"
            : mode === "signup"
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-center font-ui text-[13px] text-[#142e2a]/70">
        {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setErrors({});
            setFormError(null);
          }}
          className="cursor-pointer font-semibold text-[#142e2a] underline underline-offset-2"
        >
          {mode === "signin" ? "Create an account" : "Sign in instead"}
        </button>
      </p>
    </div>
  );
}

type FieldProps = {
  name: string;
  label: string;
  type: string;
  autoComplete?: string;
  error?: string;
  helper?: string;
  required?: boolean;
};

function Field({
  name,
  label,
  type,
  autoComplete,
  error,
  helper,
  required,
}: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-ui text-[13px] font-semibold text-[#142e2a]">
        {label}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className={`h-11 w-full rounded-lg bg-white px-3 font-ui text-[14px] text-[#142e2a] outline-none ring-1 transition-shadow focus:ring-2 ${
          error ? "ring-red-500/60" : "ring-[#142e2a]/10 focus:ring-[#142e2a]/40"
        }`}
      />
      {error ? (
        <span className="font-ui text-[12px] text-red-700">{error}</span>
      ) : helper ? (
        <span className="font-ui text-[12px] text-[#142e2a]/60">{helper}</span>
      ) : null}
    </label>
  );
}
