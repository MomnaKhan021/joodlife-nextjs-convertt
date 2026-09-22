"use client";

import Link from "next/link";
import { useState } from "react";

import {
  slugifyCategory,
  type PostCategory,
} from "@/lib/postCategories";

import { cmsAddBtn, cmsCard, cmsDelBtn, cmsIconBtn, moved } from "../FormKit";
import { fieldInput, fieldLabel, saveGlobal } from "../LinkFields";

/**
 * Editor for the blog category list.
 *
 * Names are freely editable; the stored value is not. A category's value is
 * written onto every post filed under it and appears in /blogs?category=…,
 * so renaming it would orphan those posts and break shared links. The value
 * is therefore generated from the name once, at creation, and shown
 * read-only afterwards.
 *
 * Removing a category is allowed but warned about, because posts already
 * filed under it keep that value — they simply lose their tab.
 */
export default function CategoriesForm({
  initial,
  counts,
}: {
  initial: PostCategory[];
  /** How many posts currently use each value. */
  counts: Record<string, number>;
}) {
  const [items, setItems] = useState<PostCategory[]>(initial);
  const [draft, setDraft] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draftValue = slugifyCategory(draft);
  const clash = items.some((c) => c.value === draftValue);

  function add() {
    if (!draft.trim() || !draftValue || clash) return;
    setItems([...items, { label: draft.trim(), value: draftValue }]);
    setDraft("");
  }

  function remove(i: number) {
    const c = items[i];
    const used = counts[c.value] ?? 0;
    if (
      used > 0 &&
      !confirm(
        `${used} post${used === 1 ? "" : "s"} ${used === 1 ? "is" : "are"} filed under "${c.label}".\n\n` +
          "Removing it won't delete those posts, but they'll lose their filter " +
          "tab on /blogs until they're moved to another category.\n\nRemove it anyway?",
      )
    ) {
      return;
    }
    setItems(items.filter((_, j) => j !== i));
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveGlobal("blog-categories", {
        items: items.filter((c) => c.value.trim() && c.label.trim()),
      });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[840px]">
      <header className="mb-6">
        <Link
          href="/cms/blogs"
          className="text-[13px] text-[#616161] underline-offset-2 hover:underline"
        >
          ← Blog posts
        </Link>
        <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">
          Blog categories
        </h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          The filter tabs on{" "}
          <code className="rounded bg-[#eef1e8] px-1.5 py-0.5">/blogs</code> and
          the dropdown when writing a post. Order here is the order they appear.
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-lg border border-[#e5b3b3] bg-[#fdf3f3] px-4 py-3 text-[13px] text-[#8a2b2b]">
          {error}
        </p>
      )}
      {saved && (
        <p className="mb-4 rounded-lg border border-[#bcd9b8] bg-[#f1f8ef] px-4 py-3 text-[13px] text-[#2f6b33]">
          Saved. Reload a page to see the change.
        </p>
      )}

      <div className={cmsCard}>
        <div>
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">
            Categories ({items.length})
          </h2>
          <p className="mt-1 text-[13px] text-[#616161]">
            The name is what readers see and is safe to change. The short id
            beside it is stored on every post and used in the page address, so
            it&apos;s fixed once created.
          </p>
        </div>

        <div className="space-y-2">
          {items.map((c, i) => {
            const used = counts[c.value] ?? 0;
            return (
              <div
                key={c.value}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-[#eef1e8] bg-[#fafbf7] p-3"
              >
                <input
                  aria-label={`Name for ${c.value}`}
                  className={`${fieldInput} min-w-[180px] flex-1`}
                  value={c.label}
                  onChange={(e) =>
                    setItems(
                      items.map((x, j) =>
                        j === i ? { ...x, label: e.target.value } : x,
                      ),
                    )
                  }
                />
                <code
                  className="rounded bg-[#eef1e8] px-2 py-1.5 text-[12px] text-[#616161]"
                  title="Stored on every post and used in the page address — fixed once created"
                >
                  {c.value}
                </code>
                <span
                  className="text-[12px] text-[#8a8a8a]"
                  title="Published posts using this category"
                >
                  {used} post{used === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  className={cmsIconBtn}
                  title="Move up"
                  onClick={() => setItems(moved(items, i, -1))}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={cmsIconBtn}
                  title="Move down"
                  onClick={() => setItems(moved(items, i, 1))}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={cmsDelBtn}
                  title="Remove"
                  onClick={() => remove(i)}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        <div className="border-t border-[#eef1e8] pt-4">
          <label className={fieldLabel} htmlFor="new-category">
            Add a category
          </label>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <input
              id="new-category"
              className={`${fieldInput} min-w-[200px] flex-1`}
              value={draft}
              placeholder="Mental health"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
            />
            <button
              type="button"
              className={cmsAddBtn}
              onClick={add}
              disabled={!draftValue || clash}
            >
              + Add
            </button>
          </div>
          {draftValue && (
            <p
              className={`mt-1 text-[12px] ${clash ? "text-[#8a2b2b]" : "text-[#8a8a8a]"}`}
            >
              {clash
                ? `“${draftValue}” already exists.`
                : `Will be stored as ${draftValue} — permanent once saved.`}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save categories"}
        </button>
      </div>

      <p className="mt-3 text-[12px] text-[#8a8a8a]">
        Removing every category restores the ones the site ships with, so
        /blogs is never left without filter tabs.
      </p>
    </div>
  );
}
