"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type Answers,
  DOSES,
  SLIDES,
  TOTAL_STEPS,
  calcAge,
  calcBmi,
  doseMedicine,
  getSlide,
  type SlideDef,
} from "./flow";

const LOCAL_STORAGE_KEY = "jood:consultation:state";

type LocalState = {
  id: number | null;
  currentSlideId: string;
  history: string[];
  answers: Answers;
};

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
  const [currentSlideId, setCurrentSlideId] = useState<string>("s0");
  const [history, setHistory] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [consultationId, setConsultationId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as LocalState;
      if (parsed.id) setConsultationId(parsed.id);
      if (parsed.currentSlideId) setCurrentSlideId(parsed.currentSlideId);
      if (parsed.history) setHistory(parsed.history);
      if (parsed.answers) setAnswers(parsed.answers);
    } catch {
      /* ignore */
    }
  }, []);

  // Persist state to localStorage on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          id: consultationId,
          currentSlideId,
          history,
          answers,
        } satisfies LocalState)
      );
    } catch {
      /* ignore */
    }
  }, [consultationId, currentSlideId, history, answers]);

  const slide = useMemo(() => getSlide(currentSlideId), [currentSlideId]);

  const progress = useMemo(() => {
    if (!slide || slide.step === 0) return 0;
    return Math.round((slide.step / TOTAL_STEPS) * 100);
  }, [slide]);

  // ---- helpers ----
  function setAnswer<T>(key: string, value: T) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function toggleMulti(key: string, option: string, noneOption?: string) {
    setAnswers((prev) => {
      const arr = Array.isArray(prev[key]) ? [...(prev[key] as string[])] : [];
      const idx = arr.indexOf(option);
      let next: string[];
      if (idx >= 0) next = arr.filter((x) => x !== option);
      else next = [...arr, option];
      if (noneOption) {
        if (option === noneOption && idx < 0) next = [noneOption];
        else if (option !== noneOption && next.includes(noneOption))
          next = next.filter((x) => x !== noneOption);
      }
      return { ...prev, [key]: next };
    });
  }

  // ---- per-step persistence ----
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
        phone: answers.consultation_mobile_number_v2 as string | undefined,
        dateOfBirth: answers.date_of_birth_consultation as string | undefined,
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
            json?.error
              ? `${json.error}${json.detail ? ": " + json.detail : ""}`
              : `HTTP ${res.status}`
          );
        }
        setConsultationId(json.id as number);
      } else {
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
            json?.error
              ? `${json.error}${json.detail ? ": " + json.detail : ""}`
              : `HTTP ${res.status}`
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

  async function advance(toSlideId?: string) {
    if (!slide) return;
    const targetId = toSlideId ?? slide.next?.(answers);
    if (!targetId) return;
    const targetSlide = getSlide(targetId);
    if (!targetSlide) return;

    // Block screens are terminal — submit as 'draft' so admin still sees the row
    const status = targetSlide.type === "block" || targetSlide.type === "success"
      ? targetSlide.type === "success"
        ? "submitted"
        : "draft"
      : "draft";

    try {
      await persist(status);
    } catch {
      return;
    }

    setHistory((prev) => [...prev, slide.id]);
    setCurrentSlideId(targetId);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function goBack() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCurrentSlideId(prev);
  }

  function jumpTo(slideId: string) {
    if (currentSlideId !== slideId) {
      setHistory((prev) => [...prev, currentSlideId]);
    }
    setCurrentSlideId(slideId);
  }

  if (!slide) return null;

  // Success screen replaces the chrome
  if (slide.type === "success") {
    return (
      <SuccessScreen
        productSlug={productSlug}
        consultationId={consultationId}
        onShop={() => router.push("/shop")}
      />
    );
  }

  return (
    <section className="mx-auto w-full max-w-[760px] px-5 py-8 md:py-12">
      {/* Progress bar (hidden on consent slide) */}
      {slide.step > 0 && (
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
      )}

      <SlideRenderer
        slide={slide}
        answers={answers}
        setAnswer={setAnswer}
        toggleMulti={toggleMulti}
        onAdvance={advance}
        onJumpTo={jumpTo}
      />

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-lg bg-red-50 px-4 py-3 font-ui text-[13px] text-red-700"
        >
          {error}
        </p>
      ) : null}

      {/* Footer nav (hidden on block + purchase; success is handled above) */}
      {slide.type !== "block" && (
        <FooterNav
          slide={slide}
          answers={answers}
          saving={saving}
          showBack={history.length > 0}
          canContinue={slideCanContinue(slide, answers)}
          onBack={goBack}
          onContinue={() => advance()}
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Renderers per slide type                                            */
/* ------------------------------------------------------------------ */

type SlideProps = {
  slide: SlideDef;
  answers: Answers;
  setAnswer: <T>(k: string, v: T) => void;
  toggleMulti: (k: string, opt: string, none?: string) => void;
  onAdvance: (toSlideId?: string) => void;
  onJumpTo: (slideId: string) => void;
};

function SlideRenderer(props: SlideProps) {
  const { slide } = props;
  switch (slide.type) {
    case "consent":
      return <ConsentSlide {...props} />;
    case "single":
      return <SingleSlide {...props} />;
    case "multi":
      return <MultiSlide {...props} />;
    case "email":
      return <EmailSlide {...props} />;
    case "phone":
      return <PhoneSlide {...props} />;
    case "dob":
      return <DobSlide {...props} />;
    case "height":
      return <HeightSlide {...props} />;
    case "weight":
      return <WeightSlide {...props} />;
    case "date":
      return <DateSlide {...props} />;
    case "upload":
      return <UploadSlide {...props} />;
    case "gp":
      return <GpSlide {...props} />;
    case "doseSelector":
      return <DoseSelectorSlide {...props} />;
    case "purchase":
      return <PurchaseSlide {...props} />;
    case "block":
      return <BlockSlide {...props} />;
    case "success":
      return null;
  }
}

/* ---- Common bits ---- */

function SlideHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-7">
      <h1 className="font-display text-[26px] font-bold leading-[32px] tracking-[-0.01em] text-[#142e2a] md:text-[30px] md:leading-[38px]">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-3 font-ui text-[14px] leading-[22px] text-[#142e2a]/75 md:text-[15px] md:leading-[24px]">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}

function SlideShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_2px_4px_rgba(20,46,42,0.04)] md:p-8">
      {children}
    </div>
  );
}

/* ---- Consent ---- */

function ConsentSlide({ slide, answers, setAnswer, onAdvance }: SlideProps) {
  const checked = answers[slide.field!] === "Yes";
  return (
    <SlideShell>
      <SlideHeader title={slide.title} subtitle={slide.subtitle} />
      <p className="mb-3 font-ui text-[14px] font-semibold text-[#142e2a]">
        Please confirm that:
      </p>
      <ul className="flex flex-col gap-3">
        {[
          "You are completing this consultation for yourself",
          "The information you provide will be honest, accurate, and complete",
          "You will tell us about any medical conditions, serious illnesses, operations, and medicines you are taking",
          "You understand you should only use one weight loss treatment at a time",
          "You understand a short video consultation is required before treatment can be supplied",
          "You understand a clinician may need to review your answers before treatment is approved",
          "You agree to our Terms and Conditions and confirm you have read our Privacy Policy",
        ].map((line) => (
          <li
            key={line}
            className="flex items-start gap-3 font-ui text-[13px] leading-[20px] text-[#142e2a]/85 md:text-[14px] md:leading-[22px]"
          >
            <span
              aria-hidden
              className="mt-1.5 inline-block h-2 w-2 shrink-0 rotate-45 bg-[#142e2a]"
            />
            {line}
          </li>
        ))}
      </ul>
      <label className="mt-7 flex cursor-pointer items-center gap-3 rounded-xl border border-[#142e2a]/10 bg-[#f7f9f2] px-4 py-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            const v = e.target.checked ? "Yes" : null;
            setAnswer(slide.field!, v);
            // joodlife.com auto-advances on tick
            if (v === "Yes") setTimeout(() => onAdvance(), 250);
          }}
          className="h-5 w-5 cursor-pointer accent-[#142e2a]"
        />
        <span className="font-ui text-[14px] font-semibold text-[#142e2a]">
          I have read and agree to the above
        </span>
      </label>
    </SlideShell>
  );
}

/* ---- Single-select ---- */

function SingleSlide({
  slide,
  answers,
  setAnswer,
  onAdvance,
}: SlideProps) {
  const value = answers[slide.field!] as string | undefined;
  return (
    <SlideShell>
      <SlideHeader title={slide.title} subtitle={slide.subtitle} />
      <ChoiceGrid
        options={slide.options ?? []}
        value={value}
        onSelect={(v) => {
          setAnswer(slide.field!, v);
          if (slide.auto) setTimeout(() => onAdvance(), 200);
        }}
      />
    </SlideShell>
  );
}

/* ---- Multi-select ---- */

function MultiSlide({ slide, answers, toggleMulti, setAnswer }: SlideProps) {
  const value = (answers[slide.field!] as string[]) ?? [];
  const showOther =
    slide.otherTrigger && value.includes(slide.otherTrigger);
  const noneOpt = slide.noneOption;
  const mainOptions = (slide.options ?? []).filter((o) => o !== noneOpt);
  return (
    <SlideShell>
      <SlideHeader title={slide.title} subtitle={slide.subtitle} />
      <ChoiceGrid
        options={mainOptions}
        multi
        selectedMulti={value}
        onToggle={(v) => toggleMulti(slide.field!, v, noneOpt)}
      />
      {noneOpt ? (
        <div className="mt-3">
          <ChoiceGrid
            options={[noneOpt]}
            multi
            selectedMulti={value}
            onToggle={(v) => toggleMulti(slide.field!, v, noneOpt)}
          />
        </div>
      ) : null}
      {showOther ? (
        <div className="mt-5 flex flex-col gap-1.5">
          <label className="font-ui text-[13px] font-semibold text-[#142e2a]">
            Please describe your condition
          </label>
          <textarea
            rows={3}
            placeholder="Tell us more…"
            value={
              (answers["other_weight_related_condition_details"] as string) ??
              ""
            }
            onChange={(e) =>
              setAnswer(
                "other_weight_related_condition_details",
                e.target.value
              )
            }
            className="w-full rounded-lg bg-white px-3.5 py-3 font-ui text-[14px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40"
          />
        </div>
      ) : null}
    </SlideShell>
  );
}

/* ---- Choice grid ---- */

function ChoiceGrid({
  options,
  value,
  selectedMulti,
  multi,
  onSelect,
  onToggle,
}: {
  options: string[];
  value?: string;
  selectedMulti?: string[];
  multi?: boolean;
  onSelect?: (v: string) => void;
  onToggle?: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((o) => {
        const active = multi ? (selectedMulti ?? []).includes(o) : value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => (multi ? onToggle?.(o) : onSelect?.(o))}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left font-ui text-[14px] leading-[20px] transition-all ${
              active
                ? "border-[#142e2a] bg-[#142e2a] text-white"
                : "border-[#142e2a]/15 bg-white text-[#142e2a] hover:border-[#142e2a]"
            }`}
          >
            <span
              aria-hidden
              className={`grid h-5 w-5 shrink-0 place-items-center ${
                multi ? "rounded-md" : "rounded-full"
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

/* ---- Email ---- */

function EmailSlide({ slide, answers, setAnswer }: SlideProps) {
  return (
    <SlideShell>
      <SlideHeader title={slide.title} subtitle={slide.subtitle} />
      <input
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={(answers[slide.field!] as string) ?? ""}
        onChange={(e) => setAnswer(slide.field!, e.target.value)}
        className="h-12 w-full rounded-lg bg-white px-4 font-ui text-[14px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40"
      />
    </SlideShell>
  );
}

/* ---- Phone ---- */

function PhoneSlide({ slide, answers, setAnswer }: SlideProps) {
  return (
    <SlideShell>
      <SlideHeader title={slide.title} subtitle={slide.subtitle} />
      <input
        type="tel"
        autoComplete="tel"
        placeholder="07700 900 000"
        value={(answers[slide.field!] as string) ?? ""}
        onChange={(e) => setAnswer(slide.field!, e.target.value)}
        className="h-12 w-full rounded-lg bg-white px-4 font-ui text-[14px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40"
      />
    </SlideShell>
  );
}

/* ---- DOB (with age computation + age-gate validation) ---- */

function DobSlide({ slide, answers, setAnswer }: SlideProps) {
  const value = (answers[slide.field!] as string) ?? "";
  const age = calcAge(value);
  let warning: string | null = null;
  if (value && age !== null) {
    if (age < 18) warning = "You must be 18 or older to use this service.";
    else if (age >= 75)
      warning = "This service is available for people aged 18 to 74.";
  }
  return (
    <SlideShell>
      <SlideHeader title={slide.title} subtitle={slide.subtitle} />
      <input
        type="date"
        autoComplete="bday"
        max={new Date().toISOString().split("T")[0]}
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          setAnswer(slide.field!, v);
          setAnswer("_age", calcAge(v));
        }}
        className="h-12 w-full max-w-[320px] rounded-lg bg-white px-4 font-ui text-[14px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40"
      />
      {warning ? (
        <p className="mt-3 font-ui text-[13px] text-red-700">{warning}</p>
      ) : null}
    </SlideShell>
  );
}

/* ---- Height (cm or ft/in) ---- */

function HeightSlide({ slide, answers, setAnswer }: SlideProps) {
  const [unit, setUnit] = useState<"cm" | "ftin">("cm");
  const cm = answers.height_cm as number | undefined;
  return (
    <SlideShell>
      <SlideHeader title={slide.title} />

      {unit === "cm" ? (
        <div className="relative max-w-[280px]">
          <input
            type="number"
            inputMode="decimal"
            placeholder="e.g. 170"
            min={100}
            max={250}
            value={cm ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setAnswer("height_cm", v === "" ? null : Number(v));
            }}
            className="h-12 w-full rounded-lg bg-white px-4 pr-12 font-ui text-[14px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-ui text-[12px] font-medium text-[#142e2a]/55">
            cm
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 max-w-[400px]">
          <FtInInput
            label="ft"
            value={(answers._height_ft as number | undefined) ?? ""}
            onChange={(v) => {
              setAnswer("_height_ft", v);
              const ft = Number(v) || 0;
              const inches = Number(answers._height_in) || 0;
              if (ft || inches) setAnswer("height_cm", ft * 30.48 + inches * 2.54);
              else setAnswer("height_cm", null);
            }}
          />
          <FtInInput
            label="in"
            value={(answers._height_in as number | undefined) ?? ""}
            onChange={(v) => {
              setAnswer("_height_in", v);
              const ft = Number(answers._height_ft) || 0;
              const inches = Number(v) || 0;
              if (ft || inches) setAnswer("height_cm", ft * 30.48 + inches * 2.54);
              else setAnswer("height_cm", null);
            }}
          />
        </div>
      )}

      <UnitToggle
        options={[
          { id: "cm", label: "cm" },
          { id: "ftin", label: "ft/in" },
        ]}
        value={unit}
        onChange={(u) => {
          setUnit(u as "cm" | "ftin");
          setAnswer("height_cm", null);
          setAnswer("_height_ft", null);
          setAnswer("_height_in", null);
        }}
      />
    </SlideShell>
  );
}

function FtInInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        inputMode="decimal"
        placeholder={label === "ft" ? "5" : "11"}
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-lg bg-white px-4 pr-12 font-ui text-[14px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40"
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-ui text-[12px] font-medium text-[#142e2a]/55">
        {label}
      </span>
    </div>
  );
}

/* ---- Weight (kg or st/lbs) ---- */

function WeightSlide({ slide, answers, setAnswer }: SlideProps) {
  const [unit, setUnit] = useState<"kg" | "stlbs">("kg");
  const kg = answers.current_weight_kg as number | undefined;
  return (
    <SlideShell>
      <SlideHeader title={slide.title} />

      {unit === "kg" ? (
        <div className="relative max-w-[280px]">
          <input
            type="number"
            inputMode="decimal"
            placeholder="e.g. 90"
            min={30}
            max={300}
            value={kg ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setAnswer("current_weight_kg", v === "" ? null : Number(v));
            }}
            className="h-12 w-full rounded-lg bg-white px-4 pr-12 font-ui text-[14px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-ui text-[12px] font-medium text-[#142e2a]/55">
            kg
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 max-w-[400px]">
          <FtInInput
            label="st"
            value={(answers._weight_st as number | undefined) ?? ""}
            onChange={(v) => {
              setAnswer("_weight_st", v);
              const st = Number(v) || 0;
              const lbs = Number(answers._weight_lbs) || 0;
              if (st || lbs)
                setAnswer("current_weight_kg", st * 6.35029 + lbs * 0.453592);
              else setAnswer("current_weight_kg", null);
            }}
          />
          <FtInInput
            label="lbs"
            value={(answers._weight_lbs as number | undefined) ?? ""}
            onChange={(v) => {
              setAnswer("_weight_lbs", v);
              const st = Number(answers._weight_st) || 0;
              const lbs = Number(v) || 0;
              if (st || lbs)
                setAnswer("current_weight_kg", st * 6.35029 + lbs * 0.453592);
              else setAnswer("current_weight_kg", null);
            }}
          />
        </div>
      )}

      <UnitToggle
        options={[
          { id: "kg", label: "kg" },
          { id: "stlbs", label: "st/lbs" },
        ]}
        value={unit}
        onChange={(u) => {
          setUnit(u as "kg" | "stlbs");
          setAnswer("current_weight_kg", null);
          setAnswer("_weight_st", null);
          setAnswer("_weight_lbs", null);
        }}
      />

      {(() => {
        const bmi = calcBmi(answers);
        return bmi ? (
          <p className="mt-4 font-ui text-[13px] text-[#142e2a]/65">
            Your BMI: <span className="font-semibold text-[#142e2a]">{bmi.toFixed(1)}</span>
          </p>
        ) : null;
      })()}
    </SlideShell>
  );
}

function UnitToggle({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="mt-4 flex gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-ui text-[13px] font-medium transition-all ${
            value === o.id
              ? "border-[#142e2a] bg-[#142e2a] text-white"
              : "border-[#142e2a]/15 bg-white text-[#142e2a] hover:border-[#142e2a]"
          }`}
        >
          <span
            aria-hidden
            className={`grid h-3.5 w-3.5 place-items-center rounded-full border ${
              value === o.id ? "border-[#dff49f] bg-[#dff49f]" : "border-[#142e2a]/30"
            }`}
          />
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---- Generic date ---- */

function DateSlide({ slide, answers, setAnswer }: SlideProps) {
  return (
    <SlideShell>
      <SlideHeader title={slide.title} subtitle={slide.subtitle} />
      <input
        type="date"
        max={new Date().toISOString().split("T")[0]}
        value={(answers[slide.field!] as string) ?? ""}
        onChange={(e) => setAnswer(slide.field!, e.target.value)}
        className="h-12 w-full max-w-[320px] rounded-lg bg-white px-4 font-ui text-[14px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40"
      />
    </SlideShell>
  );
}

/* ---- Upload (uses our /api/blob-upload) ---- */

function UploadSlide({ slide, answers, setAnswer }: SlideProps) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const url = answers[slide.field!] as string | undefined;
  const skipped = answers._upload_skipped === true;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/blob-upload?no-record=1", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const json = await res.json();
      setAnswer(slide.field!, json.url);
      setAnswer("_upload_skipped", false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SlideShell>
      <SlideHeader title={slide.title} subtitle={slide.subtitle} />
      <label className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#142e2a]/20 bg-[#f7f9f2] px-6 py-10 transition-colors hover:border-[#142e2a]/40 cursor-pointer">
        <span className="text-3xl" aria-hidden>📎</span>
        <span className="font-ui text-[14px] font-medium text-[#142e2a]">
          {busy
            ? "Uploading…"
            : url
              ? "✓ Uploaded — Continue"
              : "Tap to upload a photo or screenshot"}
        </span>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFile}
          disabled={busy}
          className="hidden"
        />
      </label>
      <button
        type="button"
        onClick={() => {
          setAnswer(slide.field!, null);
          setAnswer("_upload_skipped", true);
        }}
        className="mt-3 font-ui text-[13px] font-medium text-[#142e2a] underline underline-offset-4 hover:text-[#0c2421]"
      >
        I can&apos;t upload right now
      </button>
      {skipped && (
        <p className="mt-2 font-ui text-[12px] text-[#142e2a]/65">
          No file — clinician review required.
        </p>
      )}
      {err && <p className="mt-2 font-ui text-[12px] text-red-700">{err}</p>}
    </SlideShell>
  );
}

/* ---- GP details (simple text inputs; no autocomplete API yet) ---- */

function GpSlide({ slide, answers, setAnswer }: SlideProps) {
  return (
    <SlideShell>
      <SlideHeader title={slide.title} subtitle={slide.subtitle} />
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-ui text-[13px] font-semibold text-[#142e2a]">
            GP practice name (optional)
          </span>
          <input
            type="text"
            placeholder="e.g. The Mill Practice, Brighton"
            value={(answers["gp_practice_name"] as string) ?? ""}
            onChange={(e) => setAnswer("gp_practice_name", e.target.value)}
            className="h-12 w-full rounded-lg bg-white px-4 font-ui text-[14px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-ui text-[13px] font-semibold text-[#142e2a]">
            Practice address (optional)
          </span>
          <textarea
            rows={3}
            placeholder="House/flat, street, town, postcode"
            value={(answers["gp_practice_full_address"] as string) ?? ""}
            onChange={(e) =>
              setAnswer("gp_practice_full_address", e.target.value)
            }
            className="w-full rounded-lg bg-white px-4 py-3 font-ui text-[14px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40"
          />
        </label>
        <p className="font-ui text-[12px] text-[#142e2a]/55">
          You can leave this blank if you&apos;d rather we didn&apos;t share an
          outcome letter with your GP.
        </p>
      </div>
    </SlideShell>
  );
}

/* ---- Dose selector (slide 14b + 16) ---- */

function DoseSelectorSlide({
  slide,
  answers,
  setAnswer,
  onAdvance,
}: SlideProps) {
  const med = doseMedicine(answers);
  const opts = DOSES[med];
  const value = answers[slide.field!] as string | undefined;
  const isStarter = answers.current_glp_1_use_status === "No, I have never used one";
  const starterDose = med === "Wegovy" ? "0.25 mg" : "2.5 mg";
  const isRequestedDose = slide.field === "requested_dose";

  return (
    <SlideShell>
      <SlideHeader
        title={`What ${med} dose are you ${isRequestedDose ? "hoping to receive next" : "on now (or last used)"}?`}
        subtitle={
          isRequestedDose && isStarter
            ? `New users start on ${starterDose}.`
            : undefined
        }
      />
      <ChoiceGrid
        options={[...opts]}
        value={value}
        onSelect={(v) => {
          if (isRequestedDose && isStarter && v !== starterDose) return;
          setAnswer(slide.field!, v);
          setTimeout(() => onAdvance(), 200);
        }}
      />
    </SlideShell>
  );
}

/* ---- Purchase ---- */

function PurchaseSlide({ slide, answers, onAdvance, setAnswer }: SlideProps) {
  return (
    <SlideShell>
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <h1 className="font-display text-[28px] font-bold leading-[34px] tracking-[-0.01em] text-[#142e2a] md:text-[32px] md:leading-[40px]">
          {slide.title}
        </h1>
        <p className="font-ui text-[14px] leading-[22px] text-[#142e2a]/75 md:text-[15px] md:leading-[24px] max-w-[480px]">
          {slide.subtitle}
        </p>
        <button
          type="button"
          onClick={() => {
            setAnswer("video_consultation_preference", "Book now");
            onAdvance();
          }}
          className="mt-6 inline-flex h-[52px] w-full max-w-[260px] items-center justify-center rounded-full bg-[#142e2a] px-8 font-ui text-[14px] font-semibold text-white transition-all hover:bg-[#0c2421] hover:shadow-[0_8px_18px_rgba(20,46,42,0.16)]"
        >
          Buy now
        </button>
        {answers.email ? (
          <p className="mt-4 font-ui text-[12px] text-[#142e2a]/55">
            Confirmation will be sent to {String(answers.email)}.
          </p>
        ) : null}
      </div>
    </SlideShell>
  );
}

/* ---- Block screens ---- */

function BlockSlide({ slide, onJumpTo }: SlideProps) {
  return (
    <SlideShell>
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span
          aria-hidden
          className="grid h-14 w-14 place-items-center rounded-full border-[2.5px] border-red-500 text-2xl font-bold text-red-500"
        >
          ✕
        </span>
        <h1 className="font-display text-[24px] font-bold leading-[30px] tracking-[-0.01em] text-[#142e2a] md:text-[28px] md:leading-[36px]">
          {slide.title}
        </h1>
        <p className="font-ui text-[14px] leading-[22px] text-[#142e2a]/75 max-w-[520px]">
          Based on the information provided, our clinicians are unable to offer
          treatment through this service at the moment.
        </p>
        <p className="font-ui text-[14px] leading-[22px] text-[#142e2a]/75 max-w-[520px]">
          This may be due to clinical, safety, or eligibility reasons. We
          recommend speaking with your GP or healthcare provider.
        </p>
        <p className="mt-3 font-ui text-[14px] font-semibold text-[#142e2a]">
          Think something may not be quite right?
        </p>
        <p className="font-ui text-[14px] leading-[22px] text-[#142e2a]/75 max-w-[520px]">
          You can review and update your answers below. Accurate information is
          important to ensure your safety.
        </p>
        <button
          type="button"
          onClick={() => slide.reviewSlideId && onJumpTo(slide.reviewSlideId)}
          className="mt-5 inline-flex h-12 items-center justify-center rounded-lg bg-[#142e2a] px-8 font-ui text-[13px] font-semibold text-white transition-colors hover:bg-[#0c2421]"
        >
          Review your answers
        </button>
      </div>
    </SlideShell>
  );
}

/* ---- Footer nav (Back + Continue) ---- */

function FooterNav({
  slide,
  saving,
  showBack,
  canContinue,
  onBack,
  onContinue,
}: {
  slide: SlideDef;
  answers: Answers;
  saving: boolean;
  showBack: boolean;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  // Single-select with auto-advance doesn't need its own Continue
  const showContinue = !(slide.type === "single" && slide.auto) && slide.type !== "purchase";

  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      {showBack ? (
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#142e2a]/15 bg-white px-5 font-ui text-[13px] font-semibold text-[#142e2a] transition-colors hover:bg-[#f7f9f2] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Back
        </button>
      ) : (
        <span />
      )}

      {showContinue && (
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue || saving}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#142e2a] px-7 font-ui text-[13px] font-semibold text-white transition-all hover:bg-[#0c2421] hover:shadow-[0_8px_18px_rgba(20,46,42,0.16)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#142e2a]"
        >
          {saving ? (
            <>
              <span
                aria-hidden
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
              Saving…
            </>
          ) : (
            <>
              Continue <span>→</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

/* ---- Continue gate ---- */

function slideCanContinue(slide: SlideDef, answers: Answers): boolean {
  if (slide.type === "consent") return answers[slide.field!] === "Yes";
  if (slide.type === "single") {
    return Boolean(answers[slide.field!]);
  }
  if (slide.type === "multi") {
    const arr = answers[slide.field!] as string[] | undefined;
    return Array.isArray(arr) && arr.length > 0;
  }
  if (slide.type === "email") {
    const v = (answers[slide.field!] as string | undefined) ?? "";
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }
  if (slide.type === "phone") {
    const v = (answers[slide.field!] as string | undefined) ?? "";
    return v.replace(/\D/g, "").length >= 7;
  }
  if (slide.type === "dob") {
    const age = answers._age as number | undefined;
    return typeof age === "number"; // age-block routing handles bad values
  }
  if (slide.type === "height") {
    return Boolean(answers.height_cm) && Number(answers.height_cm) > 0;
  }
  if (slide.type === "weight") {
    return Boolean(answers.current_weight_kg) && Number(answers.current_weight_kg) > 0;
  }
  if (slide.type === "date") {
    return Boolean(answers[slide.field!]);
  }
  if (slide.type === "upload") {
    return Boolean(answers[slide.field!]) || answers._upload_skipped === true;
  }
  if (slide.type === "gp") {
    return true; // optional — always allow continue
  }
  if (slide.type === "doseSelector") {
    return Boolean(answers[slide.field!]);
  }
  if (slide.type === "purchase") return true;
  return true;
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
  // Clear the saved state once we've reached success
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch {}
    }
  }, []);

  return (
    <section className="mx-auto w-full max-w-[640px] px-6 py-16 text-center md:py-24">
      <div className="mx-auto mb-8 grid h-16 w-16 place-items-center rounded-full bg-[#142e2a] text-[#dff49f]">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
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
      <span className="inline-flex items-center rounded-full bg-[#dff49f] px-3 py-1 font-ui text-[12px] font-semibold uppercase tracking-[0.04em] text-[#142e2a]">
        Submitted
      </span>
      <h1 className="mt-4 font-display text-[28px] font-bold leading-[34px] tracking-[-0.01em] text-[#142e2a] md:text-[32px] md:leading-[40px]">
        Thank you for completing your consultation
      </h1>
      <p className="mx-auto mt-3 max-w-[480px] font-ui text-[15px] leading-[24px] text-[#142e2a]/75">
        A UK-licensed clinician will review your answers and follow up by email
        {productSlug ? ` about your ${productSlug} treatment` : ""} within one
        working day.
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
