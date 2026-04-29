"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  STEPS,
  type Answers,
  type StepWithCondition,
  nextVisibleIndex,
  prevVisibleIndex,
  visibleStepCount,
} from "./steps";

const LOCAL_STORAGE_KEY = "jood:consultation:state";

type LocalState = { id: number | null; answers: Answers };

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
  const [consultationId, setConsultationId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate from localStorage on mount so customers can resume after
  // a refresh or accidental tab close.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as LocalState;
      if (parsed.id) setConsultationId(parsed.id);
      if (parsed.answers) setAnswers(parsed.answers);
    } catch {
      // ignore
    }
  }, []);

  // Persist answers + id to localStorage on change so we can resume.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ id: consultationId, answers } satisfies LocalState)
      );
    } catch {
      // ignore
    }
  }, [consultationId, answers]);

  const visibleTotal = useMemo(
    () => visibleStepCount(STEPS, answers),
    [answers]
  );
  const visibleIndexAtCursor = useMemo(() => {
    let count = 0;
    for (let i = 0; i <= stepIndex; i++) {
      const step = STEPS[i];
      if (!step.showIf || step.showIf(answers)) count++;
    }
    return Math.max(0, count - 1);
  }, [stepIndex, answers]);
  const progress = useMemo(
    () =>
      visibleTotal > 1
        ? Math.round((visibleIndexAtCursor / (visibleTotal - 1)) * 100)
        : 0,
    [visibleIndexAtCursor, visibleTotal]
  );

  const step = STEPS[stepIndex];

  // ---- helpers ----
  function setAnswer<T>(key: string, value: T) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function toggleMulti(key: string, option: string, noneOption?: string) {
    setAnswers((prev) => {
      const arr = Array.isArray(prev[key]) ? ([...(prev[key] as string[])]) : [];
      const idx = arr.indexOf(option);
      let next: string[];
      if (idx >= 0) {
        next = arr.filter((x) => x !== option);
      } else {
        next = [...arr, option];
      }
      // 'None of the above' is mutually exclusive with the rest
      if (noneOption) {
        if (option === noneOption && idx < 0) {
          next = [noneOption];
        } else if (option !== noneOption && next.includes(noneOption)) {
          next = next.filter((x) => x !== noneOption);
        }
      }
      return { ...prev, [key]: next };
    });
  }

  // Per-step required-field gate
  function canContinue(): boolean {
    switch (step.type) {
      case "intro":
        return answers[step.id] === true;
      case "single":
        return !step.required || typeof answers[step.id] === "string";
      case "multi": {
        const v = answers[step.id];
        return !step.required || (Array.isArray(v) && v.length > 0);
      }
      case "text":
      case "textarea":
        return !step.required || Boolean((answers[step.id] as string)?.trim());
      case "number": {
        const v = answers[step.id];
        return !step.required || (typeof v === "number" && Number.isFinite(v));
      }
      case "date":
        return !step.required || Boolean(answers[step.id]);
      case "name": {
        const fn = (answers["firstName"] as string)?.trim();
        const ln = (answers["lastName"] as string)?.trim();
        return Boolean(fn && ln);
      }
      case "review":
        return true;
    }
  }

  // ---- save (creates row on first call, PATCHes thereafter) ----
  async function persist(status: "draft" | "submitted") {
    setSaving(true);
    setError(null);
    try {
      const fullName = (() => {
        const fn = (answers["firstName"] as string | undefined)?.trim();
        const ln = (answers["lastName"] as string | undefined)?.trim();
        return [fn, ln].filter(Boolean).join(" ") || undefined;
      })();
      const payload = {
        fullName,
        email: answers.email as string | undefined,
        phone: answers.phone as string | undefined,
        dateOfBirth: answers.dob as string | undefined,
        productSlug,
        dose,
        answers,
        status,
      };

      if (consultationId === null) {
        const res = await fetch("/api/consultations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.id) {
          throw new Error(
            json?.error ? `${json.error}${json.detail ? ": " + json.detail : ""}` : `HTTP ${res.status}`
          );
        }
        setConsultationId(json.id as number);
      } else {
        // Note: ?id=N — Payload's catch-all owns /api/consultations/[id]
        // so we keep PATCH on the parent path with the id as a query.
        const res = await fetch(
          `/api/consultations?id=${consultationId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          }
        );
        const json = await res.json();
        if (!res.ok) {
          throw new Error(
            json?.error ? `${json.error}${json.detail ? ": " + json.detail : ""}` : `HTTP ${res.status}`
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function handleContinue() {
    if (!canContinue()) return;

    if (step.type === "review") {
      try {
        await persist("submitted");
        if (typeof window !== "undefined") {
          try {
            window.localStorage.removeItem(LOCAL_STORAGE_KEY);
          } catch {}
        }
        setSubmitted(true);
      } catch {
        // error is shown via state
      }
      return;
    }

    try {
      await persist("draft");
    } catch {
      return; // don't advance on save failure
    }

    const nextIdx = nextVisibleIndex(STEPS, stepIndex, answers);
    if (nextIdx >= 0) setStepIndex(nextIdx);
  }

  function handleBack() {
    const prevIdx = prevVisibleIndex(STEPS, stepIndex, answers);
    if (prevIdx >= 0) setStepIndex(prevIdx);
  }

  if (submitted) {
    return (
      <SuccessScreen
        productSlug={productSlug}
        consultationId={consultationId}
        onShop={() => router.push("/shop")}
      />
    );
  }

  return (
    <section className="mx-auto w-full max-w-[720px] px-6 py-10 md:py-12">
      {/* Progress */}
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

      {/* Step */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_4px_rgba(20,46,42,0.04)] md:p-10">
        <StepRenderer
          step={step}
          answers={answers}
          setAnswer={setAnswer}
          toggleMulti={toggleMulti}
        />

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
          disabled={stepIndex === 0 || saving}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#142e2a]/15 bg-white px-6 font-ui text-[13px] font-semibold text-[#142e2a] transition-colors hover:bg-[#f7f9f2] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue() || saving}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#142e2a] px-8 font-ui text-[13px] font-semibold text-white transition-all hover:bg-[#0c2421] hover:shadow-[0_8px_18px_rgba(20,46,42,0.16)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#142e2a]"
        >
          {saving ? (
            <>
              <span
                aria-hidden
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
              Saving…
            </>
          ) : step.type === "review" ? (
            "Submit consultation"
          ) : (
            <>
              Continue <span>→</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Step renderer                                                       */
/* ------------------------------------------------------------------ */

function StepHeader({ title, intro }: { title: string; intro?: string }) {
  return (
    <header className="mb-6">
      <h1 className="font-display text-[26px] font-bold leading-[32px] tracking-[-0.01em] text-[#142e2a] md:text-[32px] md:leading-[38px]">
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

function StepRenderer({
  step,
  answers,
  setAnswer,
  toggleMulti,
}: {
  step: StepWithCondition;
  answers: Answers;
  setAnswer: <T>(key: string, value: T) => void;
  toggleMulti: (key: string, option: string, noneOption?: string) => void;
}) {
  switch (step.type) {
    case "intro":
      return (
        <div>
          <StepHeader title={step.title} intro={step.intro} />
          <p className="mb-3 font-ui text-[14px] font-semibold text-[#142e2a] md:text-[15px]">
            Please confirm that:
          </p>
          <ul className="flex flex-col gap-3">
            {step.bullets.map((line) => (
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
              checked={answers[step.id] === true}
              onChange={(e) => setAnswer(step.id, e.target.checked)}
              className="h-5 w-5 cursor-pointer accent-[#142e2a]"
            />
            <span className="font-ui text-[14px] font-medium text-[#142e2a]">
              {step.agreeLabel}
            </span>
          </label>
        </div>
      );

    case "single":
      return (
        <div>
          <StepHeader title={step.title} intro={step.intro} />
          <ChoiceList
            options={step.options}
            selected={answers[step.id] as string | undefined}
            onSelect={(v) => setAnswer(step.id, v)}
          />
        </div>
      );

    case "multi": {
      const selected = (answers[step.id] as string[] | undefined) ?? [];
      return (
        <div>
          <StepHeader title={step.title} intro={step.intro} />
          <ChoiceList
            options={step.options}
            multi
            selectedMulti={selected}
            onToggle={(v) => toggleMulti(step.id, v, step.noneOption)}
          />
          {step.noneOption ? (
            <div className="mt-3">
              <ChoiceList
                options={[step.noneOption]}
                multi
                selectedMulti={selected}
                onToggle={(v) => toggleMulti(step.id, v, step.noneOption)}
              />
            </div>
          ) : null}
        </div>
      );
    }

    case "text":
      return (
        <div>
          <StepHeader title={step.title} intro={step.intro} />
          <input
            type="text"
            placeholder={step.placeholder}
            autoComplete={step.autoComplete}
            value={(answers[step.id] as string) ?? ""}
            onChange={(e) => setAnswer(step.id, e.target.value)}
            className="h-12 w-full rounded-lg bg-white px-4 font-ui text-[14px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40"
          />
        </div>
      );

    case "textarea":
      return (
        <div>
          <StepHeader title={step.title} intro={step.intro} />
          <textarea
            rows={4}
            maxLength={step.maxLength ?? 1000}
            placeholder={step.placeholder}
            value={(answers[step.id] as string) ?? ""}
            onChange={(e) => setAnswer(step.id, e.target.value)}
            className="w-full rounded-lg bg-white px-4 py-3 font-ui text-[14px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40"
          />
        </div>
      );

    case "number":
      return (
        <div>
          <StepHeader title={step.title} intro={step.intro} />
          <div className="relative max-w-[280px]">
            <input
              type="number"
              inputMode="decimal"
              min={step.min}
              max={step.max}
              placeholder={step.placeholder}
              value={(answers[step.id] as number | undefined) ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                const n = v === "" ? undefined : Number(v);
                setAnswer(step.id, Number.isFinite(n) ? n : undefined);
              }}
              className="h-12 w-full rounded-lg bg-white px-4 pr-12 font-ui text-[14px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-ui text-[12px] font-medium text-[#142e2a]/55">
              {step.unit}
            </span>
          </div>
        </div>
      );

    case "date":
      return (
        <div>
          <StepHeader title={step.title} intro={step.intro} />
          <input
            type="date"
            autoComplete="bday"
            value={(answers[step.id] as string) ?? ""}
            onChange={(e) => setAnswer(step.id, e.target.value)}
            className="h-12 w-full max-w-[320px] rounded-lg bg-white px-4 font-ui text-[14px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40"
          />
        </div>
      );

    case "name":
      return (
        <div>
          <StepHeader title={step.title} intro={step.intro} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="font-ui text-[13px] font-semibold text-[#142e2a]">
                First name
              </span>
              <input
                type="text"
                autoComplete="given-name"
                placeholder="First name"
                value={(answers["firstName"] as string) ?? ""}
                onChange={(e) => setAnswer("firstName", e.target.value)}
                className="h-12 w-full rounded-lg bg-white px-4 font-ui text-[14px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-ui text-[13px] font-semibold text-[#142e2a]">
                Last name
              </span>
              <input
                type="text"
                autoComplete="family-name"
                placeholder="Last name"
                value={(answers["lastName"] as string) ?? ""}
                onChange={(e) => setAnswer("lastName", e.target.value)}
                className="h-12 w-full rounded-lg bg-white px-4 font-ui text-[14px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40"
              />
            </label>
          </div>
        </div>
      );

    case "review":
      return <ReviewBlock answers={answers} />;
  }
}

/* ------------------------------------------------------------------ */
/* Reusable bits                                                       */
/* ------------------------------------------------------------------ */

function ChoiceList({
  options,
  selected,
  selectedMulti,
  multi,
  onSelect,
  onToggle,
}: {
  options: string[];
  selected?: string;
  selectedMulti?: string[];
  multi?: boolean;
  onSelect?: (v: string) => void;
  onToggle?: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((o) => {
        const active = multi ? (selectedMulti ?? []).includes(o) : selected === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => (multi ? onToggle?.(o) : onSelect?.(o))}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left font-ui text-[14px] transition-all ${
              active
                ? "border-[#142e2a] bg-[#142e2a] text-white"
                : "border-[#142e2a]/15 bg-white text-[#142e2a] hover:border-[#142e2a]"
            }`}
          >
            <span
              aria-hidden
              className={`grid h-5 w-5 shrink-0 place-items-center ${
                multi ? "rounded" : "rounded-full"
              } ${
                active
                  ? "bg-[#dff49f] text-[#142e2a]"
                  : "bg-[#142e2a]/8 text-transparent"
              }`}
            >
              {active ? "✓" : ""}
            </span>
            <span className="flex-1">{o}</span>
          </button>
        );
      })}
    </div>
  );
}

function fmt(v: unknown): string {
  if (v === undefined || v === null || v === "") return "—";
  if (Array.isArray(v)) return v.length === 0 ? "—" : v.join(", ");
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

function ReviewBlock({ answers }: { answers: Answers }) {
  const rows: Array<{ label: string; value: string }> = STEPS.filter(
    (s) => s.type !== "intro" && s.type !== "review"
  )
    .filter((s) => !s.showIf || s.showIf(answers))
    .map((s) => {
      if (s.type === "name") {
        const fn = (answers["firstName"] as string) ?? "";
        const ln = (answers["lastName"] as string) ?? "";
        return { label: "Full name", value: `${fn} ${ln}`.trim() || "—" };
      }
      return { label: s.title, value: fmt(answers[s.id]) };
    });

  return (
    <div>
      <StepHeader
        title="Review and submit"
        intro="Take a quick look at what you entered. Use Back to fix anything before submitting."
      />
      <ul className="divide-y divide-[#142e2a]/10 rounded-xl border border-[#142e2a]/10 bg-[#f7f9f2]">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
          >
            <span className="font-ui text-[13px] font-medium text-[#142e2a]/65 sm:max-w-[55%]">
              {r.label}
            </span>
            <span className="font-ui text-[14px] text-[#142e2a] sm:text-right">
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

/* ------------------------------------------------------------------ */
/* Success screen                                                      */
/* ------------------------------------------------------------------ */

function SuccessScreen({
  productSlug,
  consultationId,
  onShop,
}: {
  productSlug?: string;
  consultationId: number | null;
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
      {consultationId !== null ? (
        <p className="mt-2 font-ui text-[12px] text-[#142e2a]/55">
          Reference: #{consultationId}
        </p>
      ) : null}
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
