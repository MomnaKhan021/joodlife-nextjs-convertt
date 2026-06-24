"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import ImageUpload from "@/components/admin/ImageUpload";

/* ------------------------------------------------------------------ */
type Variant = {
  label: string;
  price: number | string;
  compare_price?: number | string | null;
  stock?: number | string | null;
};

type ProductForm = {
  title: string;
  slug: string;
  treatment: string;
  tagline: string;
  card_copy: string;
  description: string;
  from_price: string;
  compare_price: string;
  subscription_price: string;
  hero_image_url: string;
  gallery_image_urls: string;
  display_order: string;
  is_active: boolean;
  variants_json: Variant[];
};

const EMPTY: ProductForm = {
  title: "",
  slug: "",
  treatment: "",
  tagline: "",
  card_copy: "",
  description: "",
  from_price: "",
  compare_price: "",
  subscription_price: "",
  hero_image_url: "",
  gallery_image_urls: "",
  display_order: "",
  is_active: true,
  variants_json: [],
};

const CATEGORIES = ["weight-loss", "erectile-dysfunction", "period-delay"];

function str(v: unknown): string {
  return v === null || v === undefined ? "" : String(v);
}
function parseVariants(v: unknown): Variant[] {
  if (Array.isArray(v)) return v as Variant[];
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

/* ------------------------------------------------------------------ */
function Card({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[12px] border border-[#e1e3e5] bg-white shadow-[0_1px_0_rgba(0,0,0,0.05)]">
      {title ? (
        <h2 className="border-b border-[#e1e3e5] px-4 py-3 text-[14px] font-semibold text-[#1a1a1a]">
          {title}
        </h2>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[13px] font-medium text-[#303030]">
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-[8px] border border-[#8a8a8a]/40 bg-white px-3 py-2 text-[13px] text-[#1a1a1a] outline-none transition-colors focus:border-[#005bd3] focus:ring-2 focus:ring-[#005bd3]/20";

function Field({
  label,
  value,
  onChange,
  placeholder,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center rounded-[8px] border border-[#8a8a8a]/40 focus-within:border-[#005bd3] focus-within:ring-2 focus-within:ring-[#005bd3]/20">
        {prefix ? (
          <span className="pl-3 text-[13px] text-[#616161]">{prefix}</span>
        ) : null}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent px-3 py-2 text-[13px] text-[#1a1a1a] outline-none"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
export default function ProductEditClient({ id }: { id: string }) {
  const router = useRouter();
  const isNew = id === "new";
  const [form, setForm] = useState<ProductForm>(EMPTY);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const set = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/admin-tools/record?type=products&id=${encodeURIComponent(id)}`,
          { credentials: "include" },
        );
        const json = await res.json();
        if (!res.ok || !json.ok || !json.row) throw new Error(json?.error ?? "Not found");
        if (cancelled) return;
        const r = json.row as Record<string, unknown>;
        setForm({
          title: str(r.title),
          slug: str(r.slug),
          treatment: str(r.treatment),
          tagline: str(r.tagline),
          card_copy: str(r.card_copy),
          description: str(r.description),
          from_price: str(r.from_price),
          compare_price: str(r.compare_price),
          subscription_price: str(r.subscription_price),
          hero_image_url: str(r.hero_image_url),
          gallery_image_urls: Array.isArray(r.gallery_image_urls)
            ? (r.gallery_image_urls as string[]).join("\n")
            : str(r.gallery_image_urls),
          display_order: str(r.display_order),
          is_active: r.is_active === true || r.is_active === "true",
          variants_json: parseVariants(r.variants_json),
        });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);
    setOk(false);
    try {
      const gallery = form.gallery_image_urls
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const fields: Record<string, unknown> = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        treatment: form.treatment.trim() || null,
        tagline: form.tagline.trim(),
        card_copy: form.card_copy,
        description: form.description,
        from_price: form.from_price === "" ? null : Number(form.from_price),
        compare_price: form.compare_price === "" ? null : Number(form.compare_price),
        subscription_price:
          form.subscription_price === "" ? null : Number(form.subscription_price),
        hero_image_url: form.hero_image_url.trim(),
        gallery_image_urls: gallery,
        display_order: form.display_order === "" ? null : Number(form.display_order),
        is_active: form.is_active,
        variants_json: form.variants_json.map((v) => ({
          label: String(v.label ?? "").trim(),
          price: Number(v.price) || 0,
          compare_price:
            v.compare_price === "" || v.compare_price === null || v.compare_price === undefined
              ? null
              : Number(v.compare_price),
          stock:
            v.stock === "" || v.stock === null || v.stock === undefined
              ? null
              : Number(v.stock),
        })),
      };
      const res = await fetch(
        `/api/admin-tools/record?type=products&id=${encodeURIComponent(id)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ fields }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        const msg = json?.detail
          ? `${json.error ?? "Save failed"}: ${json.detail}`
          : json?.error ?? `Save failed (HTTP ${res.status})`;
        throw new Error(msg);
      }
      setOk(true);
      if (isNew && json.id) {
        router.replace(`/admin-tools/products/${json.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  function addVariant() {
    set("variants_json", [
      ...form.variants_json,
      { label: "", price: "", compare_price: "", stock: "" },
    ]);
  }
  function updateVariant(i: number, patch: Partial<Variant>) {
    set(
      "variants_json",
      form.variants_json.map((v, idx) => (idx === i ? { ...v, ...patch } : v)),
    );
  }
  function removeVariant(i: number) {
    set(
      "variants_json",
      form.variants_json.filter((_, idx) => idx !== i),
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f1f1f1] px-4 py-10">
        <p className="mx-auto max-w-[900px] text-[14px] text-[#616161]">Loading product…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f1f1f1] pb-24 font-ui text-[#303030]">
      <div className="mx-auto max-w-[900px] px-4 pt-5 md:px-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-5">
          <div className="flex items-center gap-2">
            <Link
              href="/admin-tools/data-browser"
              aria-label="Back"
              className="grid h-8 w-8 place-items-center rounded-[8px] border border-[#babfc3] bg-white text-[#616161] hover:bg-[#f7f7f7]"
            >
              ‹
            </Link>
            <h1 className="text-[20px] font-semibold text-[#1a1a1a]">
              {isNew ? "Add product" : form.title || "Edit product"}
            </h1>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-[34px] items-center rounded-[8px] bg-[#303030] px-4 text-[13px] font-medium text-white hover:bg-[#1a1a1a] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        ) : null}
        {ok ? (
          <div className="mb-4 rounded-[10px] border border-green-200 bg-green-50 px-4 py-3 text-[13px] text-green-700">
            Saved.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* MAIN */}
          <div className="flex flex-col gap-4">
            <Card>
              <div className="flex flex-col gap-4">
                <Field label="Title" value={form.title} onChange={(v) => set("title", v)} placeholder="Short sleeve t-shirt" />
                <div>
                  <Label>Description</Label>
                  <textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={5}
                    className={inputCls}
                    placeholder="Describe the product…"
                  />
                </div>
                <Field label="Tagline" value={form.tagline} onChange={(v) => set("tagline", v)} placeholder="One-line summary shown on cards" />
                <div>
                  <Label>Card copy</Label>
                  <textarea
                    value={form.card_copy}
                    onChange={(e) => set("card_copy", e.target.value)}
                    rows={2}
                    className={inputCls}
                  />
                </div>
              </div>
            </Card>

            <Card title="Media">
              <div className="flex flex-col gap-6">
                <div>
                  <Label>Hero image</Label>
                  <p className="mb-2 text-[12px] text-[#616161]">
                    The main image shown on the product card and PDP gallery.
                  </p>
                  <ImageUpload
                    mode="single"
                    value={form.hero_image_url}
                    onChange={(url) => set("hero_image_url", url)}
                  />
                </div>
                <div>
                  <Label>Gallery images</Label>
                  <p className="mb-2 text-[12px] text-[#616161]">
                    Additional images shown in the PDP gallery slider. Drop
                    multiple files at once.
                  </p>
                  <ImageUpload
                    mode="gallery"
                    value={form.gallery_image_urls
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean)}
                    onChange={(urls) => set("gallery_image_urls", urls.join("\n"))}
                  />
                </div>
              </div>
            </Card>

            <Card title="Pricing">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Price (from)" prefix="£" value={form.from_price} onChange={(v) => set("from_price", v)} placeholder="0.00" />
                <Field label="Compare-at price" prefix="£" value={form.compare_price} onChange={(v) => set("compare_price", v)} placeholder="0.00" />
                <Field label="Subscription price" prefix="£" value={form.subscription_price} onChange={(v) => set("subscription_price", v)} placeholder="0.00" />
              </div>
            </Card>

            <Card title="Variants">
              <div className="flex flex-col gap-3">
                {form.variants_json.length === 0 ? (
                  <p className="text-[13px] text-[#616161]">
                    No variants. Add dosage/size options with their own price.
                  </p>
                ) : null}
                {form.variants_json.map((v, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_90px_90px_70px_auto] items-end gap-2 rounded-[8px] border border-[#e1e3e5] p-3"
                  >
                    <div>
                      <Label>Option (e.g. 12.5 mg)</Label>
                      <input className={inputCls} value={str(v.label)} onChange={(e) => updateVariant(i, { label: e.target.value })} />
                    </div>
                    <div>
                      <Label>Price £</Label>
                      <input className={inputCls} value={str(v.price)} onChange={(e) => updateVariant(i, { price: e.target.value })} />
                    </div>
                    <div>
                      <Label>Compare £</Label>
                      <input className={inputCls} value={str(v.compare_price)} onChange={(e) => updateVariant(i, { compare_price: e.target.value })} />
                    </div>
                    <div>
                      <Label>Stock</Label>
                      <input className={inputCls} value={str(v.stock)} onChange={(e) => updateVariant(i, { stock: e.target.value })} />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      className="mb-1 rounded-[8px] border border-[#babfc3] px-2 py-2 text-[12px] text-[#616161] hover:bg-[#f7f7f7]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addVariant}
                  className="w-fit rounded-[8px] border border-[#babfc3] bg-white px-3 py-2 text-[13px] font-medium text-[#303030] hover:bg-[#f7f7f7]"
                >
                  Add variant
                </button>
              </div>
            </Card>
          </div>

          {/* SIDEBAR */}
          <div className="flex flex-col gap-4">
            <Card title="Status">
              <select
                value={form.is_active ? "active" : "draft"}
                onChange={(e) => set("is_active", e.target.value === "active")}
                className={inputCls}
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </Card>

            <Card title="Organization">
              <div className="flex flex-col gap-4">
                <div>
                  <Label>Treatment category</Label>
                  <select
                    value={form.treatment}
                    onChange={(e) => set("treatment", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">— Select —</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <Field label="Slug (URL)" value={form.slug} onChange={(v) => set("slug", v)} placeholder="mounjaro" />
                <Field label="Display order" value={form.display_order} onChange={(v) => set("display_order", v)} placeholder="0" />
              </div>
            </Card>
          </div>
        </div>

        {/* Footer save */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-[36px] items-center rounded-[8px] bg-[#303030] px-5 text-[13px] font-medium text-white hover:bg-[#1a1a1a] disabled:opacity-50"
          >
            {saving ? "Saving…" : isNew ? "Add product" : "Save changes"}
          </button>
        </div>
      </div>
    </main>
  );
}
