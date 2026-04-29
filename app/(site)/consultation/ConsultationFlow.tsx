"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/* ------------------------------------------------------------------ */
/* Step definitions                                                    */
/* ------------------------------------------------------------------ */

type Answers = {
  agreed?: boolean;
  fullName?: string;
  email?: string;
  dateOfBirth?: string;
  phone?: string;
  heightCm?: number;
  weightCurrentKg?: number;
  weightTargetKg?: number;
  conditions?: string[];
  medications?: string;
  goal?: string;
  activityLevel?: string;
};

type StepKey =
  | "intro"
  | "personal"
  | "body"
  | "health"
  | "goal"
  | "review";

const STEP_ORDER: StepKey[] = [
  "intro",
  "personal",
  "body",
  "health",
  "goal",
  "review",
];

const CONDITIONS = [
  "Type 1 / Type 2 diabetes",
  "Heart or kidney disease",
  "High blood pressure",
  "Thyroid problems",
  "Pregnant or breastfeeding",
  "None of the above",
];

const GOALS = [
  "Lose weight for my health",
  "Feel more confident",
  "Manage a medical condition",
  "Improve my fitness",
];

const ACTIVITY = [
  "Mostly sedentary",
  "Light activity (1–2 times a week)",
  "Moderate (3–4 times a week)",
  "Very active (5+ times a week)",
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ConsultationFlow({
  productSlug,
  dose,
}: {
  productSlug?: string;
  dose?: string;
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = STEP_ORDER[stepIndex];
  const progress = useMemo(
    () => Math.round((stepIndex / (STEP_ORDER.length - 1)) * 100),
    [stepIndex]
  );

  function set<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function toggleCondition(c: string) {
    setAnswers((prev) => {
      const cur = prev.conditions ?? [];
      const next = cur.includes(c)
        ? cur.filter((x) => x !== c)
        : [...cur, c];
      return { ...prev, conditions: next };
    });
  }

  // Per-step validation gate — disables Continue until the required
  // fields for that step are filled.
  function canContinue(): boolean {
    switch (step) {
      case "intro":
        return answers.agreed === true;
      case "personal":
        return Boolean(
          answers.fullName?.trim() &&
            answers.email?.trim() &&
            answers.dateOfBirth?.trim()
        );
      case "body":
        return Boolean(
          answers.heightCm &&
            answers.weightCurrentKg &&
            answers.weightTargetKg
        );
      case "health":
        return Boolean(answers.conditions && answers.conditions.length > 0);
      case "goal":
        return Boolean(answers.goal && answers.activityLevel);
      case "review":
        return true;
    }
  }

  async function handleContinue() {
    if (step === "review") {
      await submit();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEP_ORDER.length - 1));
  }

  function handleBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: answers.fullName,
          email: answers.email,
          phone: answers.phone,
          dateOfBirth: answers.dateOfBirth,
          productSlug,
          dose,
          answers,
          status: "submitted",
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.slice(0, 200) || `HTTP ${res.status}`);
      }
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <SuccessScreen
        productSlug={productSlug}
        onShop={() => router.push("/shop")}
      />
    );
  }

  return (
    <section className="mx-auto w-full max-w-[720px] px-6 py-10 md:py-12">
      {/* Progress bar */}
      <div className="mb-8 flex items-center gap-3">
        <span className="font-ui text-[13px] font-semibold text-[#142e2a]">
          {progress}%
        </span>
        <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-[#142e2a]/10">
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-[#142e2a] transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step body */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_4px_rgba(20,46,42,0.04)] md:p-10">
        {step === "intro" && (
          <IntroStep
            agreed={answers.agreed === true}
            onChange={(v) => set("agreed", v)}
          />
        )}

        {step === "personal" && (
          <PersonalStep answers={answers} set={set} />
        )}

        {step === "body" && <BodyStep answers={answers} set={set} />}

        {step === "health" && (
          <HealthStep
            answers={answers}
            toggleCondition={toggleCondition}
            set={set}
          />
        )}

        {step === "goal" && <GoalStep answers={answers} set={set} />}

        {step === "review" && (
          <ReviewStep
            answers={answers}
            productSlug={productSlug}
            dose={dose}
          />
        )}

        {error ? (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-50 px-4 py-3 font-ui text-[13px] text-red-700"
          >
            {error}
          </p>
        ) : null}
      </div>

      {/* Footer nav */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleBack}
          disabled={stepIndex === 0}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#142e2a]/15 bg-white px-6 font-ui text-[13px] font-semibold text-[#142e2a] transition-colors hover:bg-[#f7f9f2] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue() || submitting}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#142e2a] px-8 font-ui text-[13px] font-semibold text-white transition-all hover:bg-[#0c2421] hover:shadow-[0_8px_18px_rgba(20,46,42,0.16)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#142e2a]"
        >
          {submitting
            ? "Submitting…"
            : step === "review"
              ? "Submit consultation"
              : "Continue"}
          {!submitting && step !== "review" ? <span>→</span> : null}
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Step screens                                                        */
/* ------------------------------------------------------------------ */

function StepHeader({
  title,
  intro,
}: {
  title: string;
  intro?: string;
}) {
  return (
    <header className="mb-6">
      <h1 className="font-display text-[28px] font-bold leading-[34px] tracking-[-0.01em] text-[#142e2a] md:text-[34px] md:leading-[40px]">
        {title}
      </h1>
      {intro ? (
        <p className="mt-3 font-ui text-[14px] leading-[22px] text-[#142e2a]/75 md:text-[15px] md:leading-[24px]">
          {intro}
        </p>
      ) : null}
    </header>
  );
}

function IntroStep({
  agreed,
  onChange,
}: {
  agreed: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div>
      <StepHeader
        title="Before you continue"
        intro="This consultation helps our clinicians determine whether weight loss treatment is suitable for you. It should take around 3 to 5 minutes to complete."
      />
      <p className="font-ui text-[14px] font-semibold text-[#142e2a] md:text-[15px]">
        Please confirm that:
      </p>
      <ul className="mt-3 flex flex-col gap-3">
        {[
          "You are completing this consultation for yourself",
          "The information you provide will be honest, accurate, and complete",
          "You will tell us about any medical conditions, serious illnesses, operations, and medicines you are taking",
          "You understand you should only use one weight loss treatment at a time",
          "You understand a clinician may need to review your answers before treatment is approved",
          "You agree to our Terms and Conditions and confirm you have read our Privacy Policy",
        ].map((line) => (
          <li
            key={line}
            className="flex items-start gap-3 font-ui text-[13px] leading-[20px] text-[#142e2a]/80 md:text-[14px] md:leading-[22px]"
          >
            <span
              aria-hidden
              className="mt-1.5 inline-block h-2 w-2 shrink-0 rotate-45 bg-[#142e2a]"
            />
            {line}
          </li>
        ))}
      </ul>

      <label className="mt-6 flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onChange(e.target.checked)}
          className="h-5 w-5 cursor-pointer accent-[#142e2a]"
        />
        <span className="font-ui text-[14px] font-medium text-[#142e2a]">
          I have read and agree to the above
        </span>
      </label>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-ui text-[13px] font-semibold text-[#142e2a]">
      {children}
    </span>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-11 w-full rounded-lg bg-white px-3.5 font-ui text-[14px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40 ${
        props.className ?? ""
      }`}
    />
  );
}

type SetFn = <K extends keyof Answers>(key: K, value: Answers[K]) => void;

function PersonalStep({
  answers,
  set,
}: {
  answers: Answers;
  set: SetFn;
}) {
  return (
    <div>
      <StepHeader
        title="Tell us about you"
        intro="We need a few details so the clinician can review your consultation."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <FieldLabel>Full name</FieldLabel>
          <TextInput
            type="text"
            placeholder="First and last name"
            autoComplete="name"
            value={answers.fullName ?? ""}
            onChange={(e) => set("fullName", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <FieldLabel>Email</FieldLabel>
          <TextInput
            type="email"
            placeholder="mail@abc.com"
            autoComplete="email"
            value={answers.email ?? ""}
            onChange={(e) => set("email", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <FieldLabel>Date of birth</FieldLabel>
          <TextInput
            type="date"
            autoComplete="bday"
            value={answers.dateOfBirth ?? ""}
            onChange={(e) => set("dateOfBirth", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <FieldLabel>Phone (optional)</FieldLabel>
          <TextInput
            type="tel"
            placeholder="07…"
            autoComplete="tel"
            value={answers.phone ?? ""}
            onChange={(e) => set("phone", e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  unit,
  placeholder,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  unit: string;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        inputMode="decimal"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => {
          const n = e.target.value === "" ? undefined : Number(e.target.value);
          onChange(Number.isFinite(n) ? n : undefined);
        }}
        className="h-11 w-full rounded-lg bg-white px-3.5 pr-12 font-ui text-[14px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40"
      />
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-ui text-[12px] font-medium text-[#142e2a]/55">
        {unit}
      </span>
    </div>
  );
}

function BodyStep({
  answers,
  set,
}: {
  answers: Answers;
  set: SetFn;
}) {
  return (
    <div>
      <StepHeader
        title="Your body measurements"
        intro="These help us calculate your BMI and personalise treatment."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <FieldLabel>Height</FieldLabel>
          <NumberInput
            value={answers.heightCm}
            onChange={(v) => set("heightCm", v)}
            unit="cm"
            placeholder="170"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <FieldLabel>Current weight</FieldLabel>
          <NumberInput
            value={answers.weightCurrentKg}
            onChange={(v) => set("weightCurrentKg", v)}
            unit="kg"
            placeholder="85"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <FieldLabel>Target weight</FieldLabel>
          <NumberInput
            value={answers.weightTargetKg}
            onChange={(v) => set("weightTargetKg", v)}
            unit="kg"
            placeholder="70"
          />
        </label>
      </div>
    </div>
  );
}

function HealthStep({
  answers,
  toggleCondition,
  set,
}: {
  answers: Answers;
  toggleCondition: (c: string) => void;
  set: SetFn;
}) {
  return (
    <div>
      <StepHeader
        title="Health background"
        intro="Tick anything that applies. Pick 'None of the above' if none do."
      />
      <p className="mb-3 font-ui text-[13px] font-semibold text-[#142e2a]">
        Existing conditions
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {CONDITIONS.map((c) => {
          const selected = answers.conditions?.includes(c) ?? false;
          return (
            <button
              key={c}
              type="button"
              onClick={() => toggleCondition(c)}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left font-ui text-[14px] transition-all ${
                selected
                  ? "border-[#142e2a] bg-[#142e2a] text-white"
                  : "border-[#142e2a]/15 bg-white text-[#142e2a] hover:border-[#142e2a]"
              }`}
            >
              <span
                aria-hidden
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                  selected
                    ? "bg-[#dff49f] text-[#142e2a]"
                    : "bg-[#142e2a]/8 text-transparent"
                }`}
              >
                {selected ? "✓" : ""}
              </span>
              {c}
            </button>
          );
        })}
      </div>

      <label className="mt-6 flex flex-col gap-1.5">
        <FieldLabel>Current medications (optional)</FieldLabel>
        <textarea
          rows={3}
          placeholder="List anything you're currently taking, including supplements."
          value={answers.medications ?? ""}
          onChange={(e) => set("medications", e.target.value)}
          className="w-full rounded-lg bg-white px-3.5 py-3 font-ui text-[14px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40"
        />
      </label>
    </div>
  );
}

function ChoiceGrid({
  options,
  value,
  onSelect,
}: {
  options: string[];
  value: string | undefined;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((o) => {
        const selected = value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onSelect(o)}
            className={`rounded-lg border px-4 py-3 text-left font-ui text-[14px] transition-all ${
              selected
                ? "border-[#142e2a] bg-[#142e2a] text-white"
                : "border-[#142e2a]/15 bg-white text-[#142e2a] hover:border-[#142e2a]"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function GoalStep({
  answers,
  set,
}: {
  answers: Answers;
  set: SetFn;
}) {
  return (
    <div>
      <StepHeader
        title="What are your goals?"
        intro="A quick read on what you want from this — it helps the clinician tailor advice."
      />
      <p className="mb-3 font-ui text-[13px] font-semibold text-[#142e2a]">
        Main goal
      </p>
      <ChoiceGrid
        options={GOALS}
        value={answers.goal}
        onSelect={(v) => set("goal", v)}
      />

      <p className="mb-3 mt-6 font-ui text-[13px] font-semibold text-[#142e2a]">
        How active are you?
      </p>
      <ChoiceGrid
        options={ACTIVITY}
        value={answers.activityLevel}
        onSelect={(v) => set("activityLevel", v)}
      />
    </div>
  );
}

function ReviewStep({
  answers,
  productSlug,
  dose,
}: {
  answers: Answers;
  productSlug?: string;
  dose?: string;
}) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Product", value: productSlug ?? "—" },
    { label: "Dose", value: dose ?? "—" },
    { label: "Full name", value: answers.fullName ?? "—" },
    { label: "Email", value: answers.email ?? "—" },
    { label: "Date of birth", value: answers.dateOfBirth ?? "—" },
    {
      label: "Height / weight",
      value:
        answers.heightCm && answers.weightCurrentKg
          ? `${answers.heightCm}cm · ${answers.weightCurrentKg}kg → ${
              answers.weightTargetKg ?? "—"
            }kg`
          : "—",
    },
    {
      label: "Conditions",
      value: answers.conditions?.join(", ") ?? "—",
    },
    {
      label: "Medications",
      value: answers.medications?.trim() ? answers.medications : "—",
    },
    { label: "Main goal", value: answers.goal ?? "—" },
    { label: "Activity level", value: answers.activityLevel ?? "—" },
  ];

  return (
    <div>
      <StepHeader
        title="Review and submit"
        intro="Have a quick look at what you entered. You can go back to fix anything."
      />
      <ul className="divide-y divide-[#142e2a]/10 rounded-xl border border-[#142e2a]/10 bg-[#f7f9f2]">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-3"
          >
            <span className="font-ui text-[13px] font-medium text-[#142e2a]/65">
              {r.label}
            </span>
            <span className="text-right font-ui text-[14px] text-[#142e2a]">
              {r.value}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 font-ui text-[12px] text-[#142e2a]/60">
        Your answers are stored securely and reviewed by a UK-licensed
        clinician.
      </p>
    </div>
  );
}

function SuccessScreen({
  productSlug,
  onShop,
}: {
  productSlug?: string;
  onShop: () => void;
}) {
  return (
    <section className="mx-auto w-full max-w-[640px] px-6 py-16 text-center md:py-24">
      <div className="mx-auto mb-8 grid h-16 w-16 place-items-center rounded-full bg-[#142e2a] text-[#dff49f]">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M8 16.5L13.5 22L24 11.5"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1 className="font-display text-[28px] font-bold leading-[34px] tracking-[-0.01em] text-[#142e2a] md:text-[34px] md:leading-[40px]">
        Thanks — your consultation is in.
      </h1>
      <p className="mx-auto mt-3 max-w-[480px] font-ui text-[15px] leading-[24px] text-[#142e2a]/75">
        A UK-licensed clinician will review your answers and follow up by
        email{productSlug ? ` about your ${productSlug} treatment` : ""}{" "}
        within one working day.
      </p>
      <button
        type="button"
        onClick={onShop}
        className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-[#142e2a] px-8 font-ui text-[13px] font-semibold text-white transition-colors hover:bg-[#0c2421]"
      >
        Back to shop
      </button>
    </section>
  );
}
