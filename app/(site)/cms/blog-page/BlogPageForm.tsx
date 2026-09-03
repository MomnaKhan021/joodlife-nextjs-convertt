"use client";

import Link from "next/link";
import { useState } from "react";

import type { BlogPageContent } from "@/lib/blogPageContentTypes";

import { fieldInput, fieldLabel, saveGlobal } from "../LinkFields";
import MediaPicker from "../MediaPicker";

/**
 * Editor for the /blogs listing page, in page order: the photo hero, the
 * heading above the grid, the newsletter block and the closing banner.
 *
 * The articles themselves are not here — they live in Blog posts. This is
 * only the furniture around them.
 */

const card = "space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5";

export default function BlogPageForm({
  initial,
}: {
  initial: BlogPageContent;
}) {
  const [hero, setHero] = useState(initial.hero);
  const [list, setList] = useState(initial.list);
  const [newsletter, setNewsletter] = useState(initial.newsletter);
  const [cta, setCta] = useState(initial.cta);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveGlobal("blog-page", { hero, list, newsletter, cta });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <header className="mb-6">
        <Link
          href="/cms"
          className="text-[13px] text-[#616161] underline-offset-2 hover:underline"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">
          Blog listing page
        </h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Live at <code className="rounded bg-[#eef1e8] px-1.5 py-0.5">/blogs</code>{" "}
          — the page around the articles. The articles themselves are in{" "}
          <Link href="/cms/blogs" className="underline underline-offset-2">
            Blog posts
          </Link>
          .
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-lg border border-[#e5b3b3] bg-[#fdf3f3] px-4 py-3 text-[13px] text-[#8a2b2b]">
          {error}
        </p>
      )}
      {saved && (
        <p className="mb-4 rounded-lg border border-[#bcd9b8] bg-[#f1f8ef] px-4 py-3 text-[13px] text-[#2f6b33]">
          Saved. Reload the page to see the change.
        </p>
      )}

      <div className="space-y-5">
        {/* ── 1. Hero ── */}
        <div className={card}>
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">
            1. Hero banner
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabel}>Title</label>
              <input
                className={`${fieldInput} mt-1`}
                value={hero.title}
                onChange={(e) => setHero({ ...hero, title: e.target.value })}
              />
            </div>
            <div>
              <label className={fieldLabel}>Title (italic part)</label>
              <input
                className={`${fieldInput} mt-1`}
                value={hero.titleAccent}
                onChange={(e) =>
                  setHero({ ...hero, titleAccent: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className={fieldLabel}>Body</label>
              <textarea
                rows={3}
                className={`${fieldInput} mt-1`}
                value={hero.body}
                onChange={(e) => setHero({ ...hero, body: e.target.value })}
              />
            </div>
            <div>
              <label className={fieldLabel}>Button text</label>
              <input
                className={`${fieldInput} mt-1`}
                value={hero.ctaLabel}
                onChange={(e) => setHero({ ...hero, ctaLabel: e.target.value })}
              />
              <p className="mt-1 text-[12px] text-[#8a8a8a]">
                Leave empty to hide the button.
              </p>
            </div>
            <div>
              <label className={fieldLabel}>Button link</label>
              <input
                className={`${fieldInput} mt-1`}
                value={hero.ctaHref}
                onChange={(e) => setHero({ ...hero, ctaHref: e.target.value })}
              />
            </div>
            <div>
              <label className={fieldLabel}>Background photo</label>
              <div className="mt-1">
                <MediaPicker
                  valueId={null}
                  valueUrl={hero.image}
                  onChange={(_id, url) => setHero({ ...hero, image: url ?? "" })}
                />
              </div>
            </div>
            <div>
              <label className={fieldLabel}>Photo description</label>
              <input
                className={`${fieldInput} mt-1`}
                value={hero.imageAlt}
                onChange={(e) => setHero({ ...hero, imageAlt: e.target.value })}
              />
              <p className="mt-1 text-[12px] text-[#8a8a8a]">
                Read aloud by screen readers. Describe what the photo shows.
              </p>
            </div>
          </div>
        </div>

        {/* ── 2. Listing heading ── */}
        <div className={card}>
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">
              2. Above the articles
            </h2>
            <p className="mt-1 text-[13px] text-[#616161]">
              The heading and intro that sit over the category tabs.
            </p>
          </div>
          <div>
            <label className={fieldLabel}>Heading</label>
            <input
              className={`${fieldInput} mt-1`}
              value={list.heading}
              onChange={(e) => setList({ ...list, heading: e.target.value })}
            />
          </div>
          <div>
            <label className={fieldLabel}>Intro</label>
            <textarea
              rows={3}
              className={`${fieldInput} mt-1`}
              value={list.body}
              onChange={(e) => setList({ ...list, body: e.target.value })}
            />
          </div>
        </div>

        {/* ── 3. Newsletter ── */}
        <div className={card}>
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">
              3. Newsletter block
            </h2>
            <p className="mt-1 text-[13px] text-[#616161]">
              Photo on the left, subscribe form on the right.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabel}>Heading</label>
              <input
                className={`${fieldInput} mt-1`}
                value={newsletter.heading}
                onChange={(e) =>
                  setNewsletter({ ...newsletter, heading: e.target.value })
                }
              />
            </div>
            <div>
              <label className={fieldLabel}>Heading (italic part)</label>
              <input
                className={`${fieldInput} mt-1`}
                value={newsletter.headingAccent}
                onChange={(e) =>
                  setNewsletter({ ...newsletter, headingAccent: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className={fieldLabel}>Bold line</label>
              <input
                className={`${fieldInput} mt-1`}
                value={newsletter.kicker}
                onChange={(e) =>
                  setNewsletter({ ...newsletter, kicker: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className={fieldLabel}>Body</label>
              <textarea
                rows={2}
                className={`${fieldInput} mt-1`}
                value={newsletter.body}
                onChange={(e) =>
                  setNewsletter({ ...newsletter, body: e.target.value })
                }
              />
            </div>
            <div>
              <label className={fieldLabel}>Email box placeholder</label>
              <input
                className={`${fieldInput} mt-1`}
                value={newsletter.placeholder}
                onChange={(e) =>
                  setNewsletter({ ...newsletter, placeholder: e.target.value })
                }
              />
            </div>
            <div>
              <label className={fieldLabel}>Submit button text</label>
              <input
                className={`${fieldInput} mt-1`}
                value={newsletter.submitLabel}
                onChange={(e) =>
                  setNewsletter({ ...newsletter, submitLabel: e.target.value })
                }
              />
            </div>
            <div>
              <label className={fieldLabel}>Photo</label>
              <div className="mt-1">
                <MediaPicker
                  valueId={null}
                  valueUrl={newsletter.image}
                  onChange={(_id, url) =>
                    setNewsletter({ ...newsletter, image: url ?? "" })
                  }
                />
              </div>
            </div>
            <div>
              <label className={fieldLabel}>Photo description</label>
              <input
                className={`${fieldInput} mt-1`}
                value={newsletter.imageAlt}
                onChange={(e) =>
                  setNewsletter({ ...newsletter, imageAlt: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* ── 4. Closing banner ── */}
        <div className={card}>
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">
              4. Closing banner
            </h2>
            <p className="mt-1 text-[13px] text-[#616161]">
              The last block before the footer.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={fieldLabel}>Heading</label>
              <textarea
                rows={2}
                className={`${fieldInput} mt-1`}
                value={cta.title}
                onChange={(e) => setCta({ ...cta, title: e.target.value })}
              />
              <p className="mt-1 text-[12px] text-[#8a8a8a]">
                Press Enter for a line break — each line is centred separately.
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className={fieldLabel}>Body</label>
              <input
                className={`${fieldInput} mt-1`}
                value={cta.body}
                onChange={(e) => setCta({ ...cta, body: e.target.value })}
              />
            </div>
            <div>
              <label className={fieldLabel}>Button text</label>
              <input
                className={`${fieldInput} mt-1`}
                value={cta.ctaLabel}
                onChange={(e) => setCta({ ...cta, ctaLabel: e.target.value })}
              />
              <p className="mt-1 text-[12px] text-[#8a8a8a]">
                Leave empty to hide the button.
              </p>
            </div>
            <div>
              <label className={fieldLabel}>Button link</label>
              <input
                className={`${fieldInput} mt-1`}
                value={cta.ctaHref}
                onChange={(e) => setCta({ ...cta, ctaHref: e.target.value })}
              />
            </div>
            <div>
              <label className={fieldLabel}>Background photo</label>
              <div className="mt-1">
                <MediaPicker
                  valueId={null}
                  valueUrl={cta.image}
                  onChange={(_id, url) => setCta({ ...cta, image: url ?? "" })}
                />
              </div>
            </div>
            <div>
              <label className={fieldLabel}>Photo description</label>
              <input
                className={`${fieldInput} mt-1`}
                value={cta.imageAlt}
                onChange={(e) => setCta({ ...cta, imageAlt: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save blog listing page"}
        </button>
      </div>
    </div>
  );
}
