"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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
    role: ["customer", "admin"],
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
