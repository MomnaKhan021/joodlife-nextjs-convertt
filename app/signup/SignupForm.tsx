"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import FieldInput from "@/components/auth/FieldInput";
import SubmitButton from "@/components/auth/SubmitButton";

const schema = z
  .object({
    name: z
      .string()
      .min(2, "Please enter your name")
      .max(80, "That name is a bit long"),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords don't match",
  });

type FormValues = z.infer<typeof schema>;

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

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    setServerError(null);
    try {
      // 1) Create the user
      const createRes = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, role: "customer" }),
      });
      if (!createRes.ok) {
        const body = await createRes.json().catch(() => ({}));
        throw new Error(
          body?.errors?.[0]?.message ??
            body?.message ??
            "Could not create account"
        );
      }

      // 2) Auto-login so the auth cookie is set in the browser
      const loginRes = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!loginRes.ok) {
        // Sign-up worked but login failed — send them to /login
        router.replace("/login?notice=created");
        return;
      }

      router.replace("/profile");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-2xl border border-[#142e2a]/10 bg-[#f7f9f2] p-6 md:p-8"
    >
      <FieldInput
        label="Full name"
        type="text"
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />
      <FieldInput
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <FieldInput
        label="Password"
        type="password"
        autoComplete="new-password"
        helper="At least 6 characters"
        error={errors.password?.message}
        {...register("password")}
      />
      <FieldInput
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        error={errors.confirm?.message}
        {...register("confirm")}
      />

      {serverError ? (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 font-ui text-[13px] text-red-700"
        >
          {serverError}
        </p>
      ) : null}

      <SubmitButton loading={isSubmitting} loadingLabel="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
