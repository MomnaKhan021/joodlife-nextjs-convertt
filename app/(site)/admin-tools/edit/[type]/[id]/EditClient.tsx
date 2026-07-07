"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SECTIONS } from "@/lib/adminSections";
import { fmtDate, isDateKey, labelFor, toDate } from "@/lib/consultationDisplay";

/**
 * Generic editor for any record in any whitelisted collection.
 * Reads the editable column map from /api/admin-tools/record on
 * mount, then renders one form input per editable field. Saves
 * via POST, deletes via DELETE.
 */

type ColumnType = "text" | "textarea" | "number" | "boolean" | "date" | "json";

type RecordResponse = {
  ok: boolean;
  row: Record<string, unknown> | null;
  editable?: Record<string, ColumnType>;
  error?: string;
  detail?: string;
};

const TYPE_LABELS: Record<string, string> = {
  orders: "Order",
  consultations: "Consultation",
  posts: "Post",
  users: "User",
  products: "Product",
  media: "Media",
  discounts: "Discount",
};

// Friendlier labels for snake_case columns.
function fieldLabel(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .replace(/\bId\b/, "ID")
    .replace(/\bUrl\b/, "URL")
    .replace(/\bSeo\b/, "SEO");
}

// Predefined enum options for known status / role / type fields so
// the editor renders a <select> instead of a free-form text input.
const ENUM_OPTIONS: Record<string, Record<string, string[]>> = {
  orders: {
    status: ["pending", "paid", "shipped", "delivered", "cancelled"],
    payment_method: [
      "test",
      "card",
      "paypal",
      "apple_pay",
      "google_pay",
      "bank_transfer",
    ],
  },
  consultations: {
    status: ["draft", "submitted", "reviewed", "approved", "rejected"],
  },
  posts: {
    status: ["draft", "published"],
    category: [
      "weight-loss",
      "nutrition",
      "lifestyle",
      "science",
      "company-news",
      "other",
    ],
  },
  users: {
    role: ["customer", "staff", "admin"],
  },
  discounts: {
    type: ["percentage", "fixed"],
  },
};

function toInputValue(type: ColumnType, raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  switch (type) {
    case "boolean":
      return raw === true || raw === "true" || raw === 1 ? "true" : "false";
    case "date":
      if (typeof raw === "string") return raw.slice(0, 16);
      return "";
    case "json":
      try {
        return JSON.stringify(raw, null, 2);
      } catch {
        return String(raw);
      }
    default:
      return String(raw);
  }
}

function fromInputValue(type: ColumnType, raw: string): unknown {
  if (raw === "" || raw === null || raw === undefined) return null;
  switch (type) {
    case "boolean":
      return raw === "true";
    case "number":
      return Number(raw);
    case "json":
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    default:
      return raw;
  }
}

export default function EditClient({
  type,
  id,
}: {
  type: string;
  id: string;
}) {
  const router = useRouter();
  const isNew = id === "new";

  const [data, setData] = useState<RecordResponse | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const label = TYPE_LABELS[type] ?? type;

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/admin-tools/record?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`,
        { credentials: "include" }
      );
      const j = (await res.json()) as RecordResponse;
      if (!res.ok || !j.ok) {
        setErr(j.error ?? `HTTP ${res.status}`);
        setData(null);
        return;
      }
      setData(j);
      // Seed form values
      const seed: Record<string, string> = {};
      for (const [col, type] of Object.entries(j.editable ?? {})) {
        seed[col] = toInputValue(type, j.row?.[col] ?? null);
      }
      // New records: default is_active to Yes so a freshly-created product
      // is visible in the shop by default (the DB column defaults to true).
      if (isNew && "is_active" in (j.editable ?? {})) {
        seed["is_active"] = "true";
      }
      setValues(seed);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [type, id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const editable = data?.editable ?? {};
  const fields = useMemo(() => Object.entries(editable), [editable]);

  const setField = (col: string, value: string) => {
    setValues((prev) => ({ ...prev, [col]: value }));
    setSavedAt(null);
  };

  const save = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setErr(null);
    try {
      const fieldsBody: Record<string, unknown> = {};
      for (const [col, t] of fields) {
        fieldsBody[col] = fromInputValue(t, values[col] ?? "");
      }
      const res = await fetch(
        `/api/admin-tools/record?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: fieldsBody }),
        }
      );
      const j = (await res.json()) as {
        ok: boolean;
        id?: number | string;
        created?: boolean;
        error?: string;
        detail?: string;
      };
      if (!res.ok || !j.ok) {
        setErr(j.detail ? `${j.error}: ${j.detail}` : j.error ?? `HTTP ${res.status}`);
        return;
      }
      setSavedAt(Date.now());
      if (isNew && j.id) {
        // Hop the URL to /edit/<type>/<id> so subsequent saves update.
        router.replace(`/admin-tools/edit/${type}/${j.id}`);
      } else {
        // Re-fetch to show the canonical server-side values.
        void load();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }, [type, id, fields, values, isNew, saving, router, load]);

  const onDelete = useCallback(async () => {
    if (deleting) return;
    if (!confirm(`Delete this ${label.toLowerCase()}? This can't be undone.`))
      return;
    setDeleting(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/admin-tools/record?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const j = (await res.json()) as {
        ok: boolean;
        error?: string;
        detail?: string;
      };
      if (!res.ok || !j.ok) {
        setErr(
          [j.error, j.detail].filter(Boolean).join(" — ") || `HTTP ${res.status}`
        );
        return;
      }
      router.replace(`/admin-tools/data-browser?type=${encodeURIComponent(type)}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleting(false);
    }
  }, [type, id, deleting, label, router]);

  return (
    <>
      <header className="db-shell__header">
        <p className="db-shell__eyebrow">
          <Link
            href={`/admin-tools/data-browser?type=${encodeURIComponent(type)}`}
            className="ed-back-link"
          >
            ← {label}s
          </Link>
        </p>
        <h1 className="db-shell__title">
          {isNew ? `New ${label.toLowerCase()}` : `Edit ${label.toLowerCase()}`}
          {!isNew && data?.row?.id ? (
            <span className="ed-id">#{String(data.row.id)}</span>
          ) : null}
        </h1>
      </header>

      {loading ? (
        <p className="ed-loading">Loading…</p>
      ) : err ? (
        <div className="ed-error">
          <strong>Couldn&apos;t load:</strong> {err}
        </div>
      ) : !data || !editable ? (
        <p className="ed-loading">Not found.</p>
      ) : (
        <form
          className="ed-form"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <div className="ed-fields">
            {fields.map(([col, t]) => {
              const enumOpts = ENUM_OPTIONS[type]?.[col];
              const v = values[col] ?? "";
              // Staff permissions → checkbox group of dashboard sections.
              if (type === "users" && col === "permissions") {
                let selected: string[] = [];
                try {
                  const parsed = JSON.parse(v || "[]");
                  if (Array.isArray(parsed)) selected = parsed.map(String);
                } catch {
                  /* not valid JSON yet → treat as empty */
                }
                const toggle = (key: string) => {
                  const next = selected.includes(key)
                    ? selected.filter((s) => s !== key)
                    : [...selected, key];
                  setField(col, JSON.stringify(next));
                };
                return (
                  <Field key={col} label="Staff permissions" wide>
                    <p className="mb-2 text-[12px] text-[#616161]">
                      Tick the dashboard sections this staff member can access.
                      Admins always have full access, so this only applies when
                      Role is “staff”.
                    </p>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {SECTIONS.map((s) => (
                        <label
                          key={s.key}
                          className="flex cursor-pointer items-start gap-2.5 rounded-[8px] border border-[#e1e3e5] bg-white px-3 py-2 hover:bg-[#f7f7f7]"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 shrink-0 accent-[#142e2a]"
                            checked={selected.includes(s.key)}
                            onChange={() => toggle(s.key)}
                          />
                          <span className="min-w-0">
                            <span className="block text-[13px] font-medium text-[#1a1a1a]">
                              {s.label}
                            </span>
                            <span className="block text-[11px] text-[#8a8f94]">
                              {s.description}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </Field>
                );
              }
              if (enumOpts) {
                return (
                  <Field key={col} label={fieldLabel(col)}>
                    <select
                      value={v}
                      onChange={(e) => setField(col, e.target.value)}
                      className="ed-input"
                    >
                      <option value="">—</option>
                      {enumOpts.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </Field>
                );
              }
              if (t === "boolean") {
                return (
                  <Field key={col} label={fieldLabel(col)}>
                    <select
                      value={v}
                      onChange={(e) => setField(col, e.target.value)}
                      className="ed-input"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </Field>
                );
              }
              // Consultation answers → labelled, editable field group
              // (not a raw JSON blob), matching the clinical-queue layout.
              if (type === "consultations" && col === "answers") {
                return (
                  <AnswersEditor
                    key={col}
                    value={v}
                    onChange={(nv) => setField(col, nv)}
                  />
                );
              }
              if (t === "textarea" || t === "json") {
                return (
                  <Field key={col} label={fieldLabel(col)} wide>
                    <textarea
                      value={v}
                      onChange={(e) => setField(col, e.target.value)}
                      rows={t === "json" ? 6 : 4}
                      className="ed-input ed-input--textarea"
                    />
                  </Field>
                );
              }
              if (t === "number") {
                return (
                  <Field key={col} label={fieldLabel(col)}>
                    <input
                      type="number"
                      step="any"
                      value={v}
                      onChange={(e) => setField(col, e.target.value)}
                      className="ed-input"
                    />
                  </Field>
                );
              }
              if (t === "date") {
                return (
                  <Field key={col} label={fieldLabel(col)}>
                    <input
                      type="datetime-local"
                      value={v}
                      onChange={(e) => setField(col, e.target.value)}
                      className="ed-input"
                    />
                  </Field>
                );
              }
              return (
                <Field key={col} label={fieldLabel(col)}>
                  <input
                    type="text"
                    value={v}
                    onChange={(e) => setField(col, e.target.value)}
                    className="ed-input"
                  />
                </Field>
              );
            })}
          </div>

          {/* Read-only metadata that's useful for audit */}
          {data.row && !isNew ? (
            <div className="ed-meta">
              <h3>Metadata (read-only)</h3>
              <dl>
                {Object.entries(data.row)
                  .filter(([k]) => !(k in editable))
                  .filter(([k]) => k !== "hash" && k !== "salt")
                  .map(([k, v]) => (
                    <div key={k} className="ed-meta__row">
                      <dt>{fieldLabel(k)}</dt>
                      <dd>
                        <JsonView value={normalizeMaybeJson(v)} />
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
          ) : null}

          <div className="ed-actions">
            <button
              type="submit"
              disabled={saving || loading}
              className="db-btn ed-save"
            >
              {saving
                ? "Saving…"
                : isNew
                  ? `Create ${label.toLowerCase()}`
                  : `Save changes`}
            </button>
            {!isNew ? (
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting || loading}
                className="db-btn ed-delete"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            ) : null}
            {savedAt ? (
              <span className="ed-saved">Saved.</span>
            ) : null}
          </div>
        </form>
      )}
    </>
  );
}

function Field({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`ed-field ${wide ? "ed-field--wide" : ""}`}>
      <span className="ed-label">{label}</span>
      {children}
    </label>
  );
}

/**
 * Editable, labelled view of a consultation's `answers` JSON — one row per
 * questionnaire answer with a human label, instead of a raw JSON blob.
 * Dates render as date pickers (normalising legacy epoch values), booleans
 * as Yes/No, multi-select answers as one-per-line. Internal keys (prefixed
 * with "_") are hidden but preserved on save.
 */
function AnswersEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  let obj: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(value || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      obj = parsed as Record<string, unknown>;
    }
  } catch {
    /* fall through to raw editor below */
  }

  const keys = Object.keys(obj);
  const visible = keys.filter((k) => !k.startsWith("_"));
  const hidden = keys.filter((k) => k.startsWith("_"));

  const update = (k: string, next: unknown) => {
    onChange(JSON.stringify({ ...obj, [k]: next }, null, 2));
  };

  // If the value isn't parseable as an object, fall back to a raw textarea
  // so the field is never un-editable.
  if (keys.length === 0 && value.trim() && value.trim() !== "{}") {
    return (
      <Field label={fieldLabel("answers")} wide>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          className="ed-input ed-input--textarea"
        />
      </Field>
    );
  }

  return (
    <div className="ed-field ed-field--wide">
      <span className="ed-label">Consultation answers</span>
      <p className="ed-answers__hint">
        The customer&rsquo;s questionnaire responses. Edits save to the patient
        record; the medication/treatment preference is included.
      </p>
      {visible.length === 0 ? (
        <p className="ed-answers__hint">No answers recorded yet.</p>
      ) : (
        <div className="ed-answers__grid">
          {visible.map((k) => {
            const raw = obj[k];
            if (isDateKey(k)) {
              const d = toDate(raw);
              const iso = d ? d.toISOString().slice(0, 10) : "";
              return (
                <label key={k} className="ed-field">
                  <span className="ed-label">{labelFor(k)}</span>
                  <input
                    type="date"
                    value={iso}
                    onChange={(e) => update(k, e.target.value)}
                    className="ed-input"
                  />
                  {raw != null && !d ? (
                    <span className="ed-answers__hint">Stored: {String(raw)}</span>
                  ) : d ? (
                    <span className="ed-answers__hint">{fmtDate(raw)}</span>
                  ) : null}
                </label>
              );
            }
            if (typeof raw === "boolean") {
              return (
                <label key={k} className="ed-field">
                  <span className="ed-label">{labelFor(k)}</span>
                  <select
                    value={String(raw)}
                    onChange={(e) => update(k, e.target.value === "true")}
                    className="ed-input"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </label>
              );
            }
            if (Array.isArray(raw)) {
              return (
                <label key={k} className="ed-field ed-field--wide">
                  <span className="ed-label">{labelFor(k)}</span>
                  <textarea
                    value={raw.map((x) => String(x)).join("\n")}
                    onChange={(e) =>
                      update(
                        k,
                        e.target.value
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    rows={Math.max(2, raw.length)}
                    className="ed-input ed-input--textarea"
                  />
                  <span className="ed-answers__hint">One per line</span>
                </label>
              );
            }
            return (
              <label key={k} className="ed-field">
                <span className="ed-label">{labelFor(k)}</span>
                <input
                  type="text"
                  value={raw == null ? "" : String(raw)}
                  onChange={(e) => update(k, e.target.value)}
                  className="ed-input"
                />
              </label>
            );
          })}
        </div>
      )}
      {hidden.length > 0 ? (
        <span className="ed-answers__hint">
          {hidden.length} internal field{hidden.length === 1 ? "" : "s"} preserved
          (not shown).
        </span>
      ) : null}
    </div>
  );
}

/** Some columns store JSON as a string (e.g. items_json). Parse those so
 *  they render as a structured tree rather than an escaped blob. */
function normalizeMaybeJson(v: unknown): unknown {
  if (typeof v === "string") {
    const s = v.trim();
    if ((s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"))) {
      try {
        return JSON.parse(s);
      } catch {
        return v;
      }
    }
  }
  return v;
}

/** Renders any JSON value as a clean, readable, nested key/value tree.
 *  Arrays of objects (like order line items) become labelled cards. */
function JsonView({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || value === undefined || value === "") {
    return <span className="jv-empty">—</span>;
  }
  if (typeof value === "boolean") {
    return <span className="jv-bool">{value ? "Yes" : "No"}</span>;
  }
  if (typeof value === "number" || typeof value === "string") {
    return <span className="jv-scalar">{String(value)}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="jv-empty">None</span>;
    return (
      <div className="jv-array">
        {value.map((item, i) => (
          <div key={i} className="jv-array__item">
            {typeof item === "object" && item !== null ? (
              <JsonView value={item} depth={depth + 1} />
            ) : (
              <JsonView value={item} depth={depth + 1} />
            )}
          </div>
        ))}
      </div>
    );
  }
  // Plain object → label/value rows.
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return <span className="jv-empty">—</span>;
  return (
    <div className="jv-object">
      {entries.map(([k, v]) => (
        <div key={k} className="jv-object__row">
          <span className="jv-key">{fieldLabel(k)}</span>
          <span className="jv-val">
            <JsonView value={normalizeMaybeJson(v)} depth={depth + 1} />
          </span>
        </div>
      ))}
    </div>
  );
}
