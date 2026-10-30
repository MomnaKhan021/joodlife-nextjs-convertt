"use client";

import Link from "next/link";
import { useState } from "react";

import type {
  LanderContent,
  LanderFeature,
  LanderStyleKey,
} from "@/lib/landerContentTypes";
import type { SectionStyle } from "@/lib/sectionStyle";

import {
  AreaField,
  cmsAddBtn,
  cmsCard,
  CtaFields,
  moved,
  Pair,
  PictureField,
  RowTools,
  StringList,
  TextField,
} from "../FormKit";
import { saveGlobal } from "../LinkFields";
import SaveBar from "../SaveBar";
import SectionControl from "../SectionControl";
import { useDirty } from "../useDirty";
import VideoField from "./VideoField";

/**
 * Editor for the weight-loss ads lander at /weight-loss-lander — every
 * section in page order. Lists (slides, steps, reviews, FAQs…) can be added
 * to, removed from and reordered. Slides take an image, a video, or both.
 */

function SectionHead({ n, title, note, control }: { n: number; title: string; note?: string; control: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[15px] font-medium text-[#1a1a1a]">
          {n}. {title}
        </h2>
        {note ? <p className="mt-1 text-[12px] text-[#8a8a8a]">{note}</p> : null}
      </div>
      {control}
    </div>
  );
}

/** A list of cards: each with ↑ ↓ ✕, plus an add button. */
function Repeater<T>({
  title,
  items,
  onChange,
  blank,
  addLabel,
  render,
}: {
  title: string;
  items: T[];
  onChange: (next: T[]) => void;
  blank: () => T;
  addLabel: string;
  render: (item: T, set: (patch: Partial<T>) => void, i: number) => React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="space-y-3 rounded-lg border border-[#eceee8] bg-[#fafbf8] p-4">
          <RowTools
            title={`${title} ${i + 1}`}
            index={i}
            count={items.length}
            onMove={(dir) => onChange(moved(items, i, dir))}
            onRemove={() => onChange(items.filter((_, j) => j !== i))}
          />
          {render(item, (patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x))), i)}
        </div>
      ))}
      <button type="button" className={cmsAddBtn} onClick={() => onChange([...items, blank()])}>
        {addLabel}
      </button>
    </div>
  );
}

/** Icon + title + body cards (story features, closing benefits). */
function FeatureList({ items, onChange, title }: { items: LanderFeature[]; onChange: (v: LanderFeature[]) => void; title: string }) {
  return (
    <Repeater
      title={title}
      items={items}
      onChange={onChange}
      blank={() => ({ icon: "", title: "", body: "" })}
      addLabel={`+ Add ${title.toLowerCase()}`}
      render={(f, set) => (
        <>
          <PictureField label="Icon (small, SVG or PNG)" src={f.icon} onSrc={(icon) => set({ icon })} />
          <TextField label="Title" value={f.title} onChange={(t) => set({ title: t })} />
          <AreaField label="Text" value={f.body} onChange={(body) => set({ body })} rows={2} />
        </>
      )}
    />
  );
}

export default function LanderForm({ initial }: { initial: LanderContent }) {
  const [hero, setHero] = useState(initial.hero);
  const [trust, setTrust] = useState(initial.trust);
  const [stories, setStories] = useState(initial.stories);
  const [results, setResults] = useState(initial.results);
  const [expertise, setExpertise] = useState(initial.expertise);
  const [steps, setSteps] = useState(initial.steps);
  const [journey, setJourney] = useState(initial.journey);
  const [reviews, setReviews] = useState(initial.reviews);
  const [faq, setFaq] = useState(initial.faq);
  const [final, setFinal] = useState(initial.final);

  const [styles, setStyles] = useState<Record<LanderStyleKey, SectionStyle>>(initial.styles);
  const control = (k: LanderStyleKey) => (
    <SectionControl sectionKey={k} value={styles[k]} onChange={(next) => setStyles((p) => ({ ...p, [k]: next }))} />
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // What Save would send; compared with what the screen loaded with.
  const payload = {
    styles,
    hero: { ...hero, bullets: hero.bullets.filter((b) => b.trim()) },
    trust: { ...trust, badges: trust.badges.filter((b) => b.trim()) },
    stories: {
      ...stories,
      items: stories.items.filter((s) => s.image || s.video),
      features: stories.features.filter((f) => f.title.trim()),
    },
    results: { ...results, items: results.items.filter((r) => r.name.trim() || r.quote.trim()) },
    expertise,
    steps: { ...steps, items: steps.items.filter((s) => s.title.trim()) },
    journey: { ...journey, items: journey.items.filter((s) => s.title.trim()) },
    reviews: { ...reviews, items: reviews.items.filter((r) => r.title.trim() || r.quote.trim()) },
    faq: { ...faq, items: faq.items.filter((f) => f.q.trim()) },
    final: { ...final, benefits: final.benefits.filter((b) => b.title.trim()) },
  };
  const { dirty, markSaved } = useDirty(JSON.stringify(payload));

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveGlobal("weight-loss-lander", payload);
      setSaved(true);
      markSaved();
      window.setTimeout(() => setSaved(false), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <header className="mb-6">
        <Link href="/cms" className="text-[13px] text-[#616161] underline-offset-2 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">Weight loss ads lander</h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Live at <code className="rounded bg-[#eef1e8] px-1.5 py-0.5">/a7g64pt</code> — the page paid ads
          send people to. It isn&apos;t in the site menu and is hidden from Google. Sections are in page order.
        </p>
      </header>

      <div className="space-y-5">
        {/* Offer popup — stored with the hero */}
        <div className={cmsCard}>
          <div>
            <h2 className="text-[16px] font-semibold text-[#1a1a1a]">Offer popup</h2>
            <p className="mt-1 text-[13px] text-[#616161]">
              Opens 3 seconds after someone lands, once per visit. The code must exist in the dashboard&apos;s
              Discounts list, or it won&apos;t work at checkout.
            </p>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-[#1a1a1a]">
            <input type="checkbox" checked={hero.popup.enabled} onChange={(e) => setHero({ ...hero, popup: { ...hero.popup, enabled: e.target.checked } })} />
            Show the offer popup
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Headline — start" value={hero.popup.title} onChange={(title) => setHero({ ...hero, popup: { ...hero.popup, title } })} />
            <TextField label="Headline — highlighted (italic)" value={hero.popup.titleAccent} onChange={(titleAccent) => setHero({ ...hero, popup: { ...hero.popup, titleAccent } })} />
            <TextField label="Headline — end" value={hero.popup.titleEnd} onChange={(titleEnd) => setHero({ ...hero, popup: { ...hero.popup, titleEnd } })} />
          </div>
          <TextField label="Discount code" value={hero.popup.code} onChange={(code) => setHero({ ...hero, popup: { ...hero.popup, code } })} hint="Shown with a Copy button. The main button copies it too." />
          <CtaFields
            label={hero.popup.ctaLabel}
            href={hero.popup.ctaHref}
            onLabel={(ctaLabel) => setHero({ ...hero, popup: { ...hero.popup, ctaLabel } })}
            onHref={(ctaHref) => setHero({ ...hero, popup: { ...hero.popup, ctaHref } })}
          />
          <TextField label="Small note under the button" value={hero.popup.note} onChange={(note) => setHero({ ...hero, popup: { ...hero.popup, note } })} hint="Empty hides it." />
        </div>

        {/* 1. Hero */}
        <div className={cmsCard}>
          <SectionHead n={1} title="Hero" note="Full-width photo with the copy over it. The colour shows behind the photo while it loads." control={control("hero")} />
          <TextField label="Top bar text" value={hero.topBar} onChange={(topBar) => setHero({ ...hero, topBar })} hint="Empty hides the bar." />
          <TextField label="Trustpilot score" value={hero.rating} onChange={(rating) => setHero({ ...hero, rating })} hint='Shown as "4.4 out of 5". Links to Trustpilot.' />
          <Pair
            label="Headline"
            first={hero.title}
            second={hero.titleAccent}
            onFirst={(title) => setHero({ ...hero, title })}
            onSecond={(titleAccent) => setHero({ ...hero, titleAccent })}
          />
          <StringList items={hero.bullets} onChange={(bullets) => setHero({ ...hero, bullets })} label="Tick list" addLabel="+ Add line" />
          <CtaFields
            label={hero.ctaLabel}
            href={hero.ctaHref}
            onLabel={(ctaLabel) => setHero({ ...hero, ctaLabel })}
            onHref={(ctaHref) => setHero({ ...hero, ctaHref })}
          />
          <PictureField label="Photo (desktop, wide)" src={hero.image} onSrc={(image) => setHero({ ...hero, image })} alt={hero.imageAlt} onAlt={(imageAlt) => setHero({ ...hero, imageAlt })} />
          <PictureField label="Photo (phones, tall) — optional, the desktop photo is used if empty" src={hero.mobileImage} onSrc={(mobileImage) => setHero({ ...hero, mobileImage })} />
          <label className="flex items-start gap-2 text-[13px] text-[#1a1a1a]">
            <input type="checkbox" className="mt-[3px]" checked={hero.overlay} onChange={(e) => setHero({ ...hero, overlay: e.target.checked })} />
            <span>
              Darken the photo behind the text (overlay)
              <span className="block text-[12px] text-[#8a8a8a]">
                Leave unticked if the photo already has its own shading. Ticked: a dark green shade from the left on desktop and from the bottom on phones.
              </span>
            </span>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Message card — sender" value={hero.cardName} onChange={(cardName) => setHero({ ...hero, cardName })} />
            <TextField label="Message card — channel" value={hero.cardChannel} onChange={(cardChannel) => setHero({ ...hero, cardChannel })} />
          </div>
          <AreaField label="Message card — message" value={hero.cardMessage} onChange={(cardMessage) => setHero({ ...hero, cardMessage })} rows={2} hint="Empty sender and message hide the card." />
        </div>

        {/* 2. Trust strip */}
        <div className={cmsCard}>
          <SectionHead n={2} title="Trust strip" note="The row under the hero. Scrolls on phones." control={control("trust")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Review count (phones)" value={trust.reviewsLabel} onChange={(reviewsLabel) => setTrust({ ...trust, reviewsLabel })} />
            <TextField label="Trustpilot score" value={trust.rating} onChange={(rating) => setTrust({ ...trust, rating })} />
          </div>
          <StringList items={trust.badges} onChange={(badges) => setTrust({ ...trust, badges })} label="Badges" addLabel="+ Add badge" />
        </div>

        {/* 3. Stories */}
        <div className={cmsCard}>
          <SectionHead n={3} title="Real stories (video slider)" note="Three fit on desktop. Add more and the row becomes a slider with dots." control={control("stories")} />
          <Pair label="Heading" first={stories.heading} second={stories.headingAccent} onFirst={(heading) => setStories({ ...stories, heading })} onSecond={(headingAccent) => setStories({ ...stories, headingAccent })} />
          <TextField label="Line under the heading" value={stories.subtitle} onChange={(subtitle) => setStories({ ...stories, subtitle })} />
          <Repeater
            title="Slide"
            items={stories.items}
            onChange={(items) => setStories({ ...stories, items })}
            blank={() => ({ image: "", video: "", alt: "" })}
            addLabel="+ Add slide"
            render={(s, set) => (
              <>
                <PictureField label="Image / video cover" src={s.image} onSrc={(image) => set({ image })} alt={s.alt} onAlt={(alt) => set({ alt })} />
                <VideoField value={s.video} onChange={(video) => set({ video })} />
              </>
            )}
          />
          <h3 className="pt-2 text-[13px] font-medium text-[#1a1a1a]">Feature cards</h3>
          <FeatureList title="Card" items={stories.features} onChange={(features) => setStories({ ...stories, features })} />
        </div>

        {/* 4. Results */}
        <div className={cmsCard}>
          <SectionHead n={4} title="Before & after (slider)" note="Two fit on desktop, one on phones. Dots show only when there are more." control={control("results")} />
          <Pair label="Heading" first={results.heading} second={results.headingAccent} onFirst={(heading) => setResults({ ...results, heading })} onSecond={(headingAccent) => setResults({ ...results, headingAccent })} />
          <Repeater
            title="Patient"
            items={results.items}
            onChange={(items) => setResults({ ...results, items })}
            blank={() => ({ name: "", before: "", after: "", beforeLabel: "Week 0", afterLabel: "Week 4", lost: "", detail: "", quote: "" })}
            addLabel="+ Add patient"
            render={(r, set) => (
              <>
                <TextField label="Name and age" value={r.name} onChange={(name) => set({ name })} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <PictureField label="Before photo" src={r.before} onSrc={(before) => set({ before })} />
                  <PictureField label="After photo" src={r.after} onSrc={(after) => set({ after })} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Before label" value={r.beforeLabel} onChange={(beforeLabel) => set({ beforeLabel })} />
                  <TextField label="After label" value={r.afterLabel} onChange={(afterLabel) => set({ afterLabel })} />
                  <TextField label="Weight lost" value={r.lost} onChange={(lost) => set({ lost })} placeholder="−17kg" />
                  <TextField label="Under the figure" value={r.detail} onChange={(detail) => set({ detail })} placeholder="38 lbs in 4 weeks" />
                </div>
                <AreaField label="Quote" value={r.quote} onChange={(quote) => set({ quote })} rows={3} />
              </>
            )}
          />
          <CtaFields label={results.ctaLabel} href={results.ctaHref} onLabel={(ctaLabel) => setResults({ ...results, ctaLabel })} onHref={(ctaHref) => setResults({ ...results, ctaHref })} />
        </div>

        {/* 5. Expertise */}
        <div className={cmsCard}>
          <SectionHead n={5} title="Medical expertise" control={control("expertise")} />
          <Pair label="Heading" first={expertise.heading} second={expertise.headingAccent} onFirst={(heading) => setExpertise({ ...expertise, heading })} onSecond={(headingAccent) => setExpertise({ ...expertise, headingAccent })} />
          <AreaField label="Paragraph" value={expertise.body} onChange={(body) => setExpertise({ ...expertise, body })} />
          <TextField label="Card — name line" value={expertise.leadName} onChange={(leadName) => setExpertise({ ...expertise, leadName })} />
          <AreaField label="Card — role" value={expertise.leadRole} onChange={(leadRole) => setExpertise({ ...expertise, leadRole })} rows={2} />
          <CtaFields
            title="Link"
            label={expertise.linkLabel}
            href={expertise.linkHref}
            onLabel={(linkLabel) => setExpertise({ ...expertise, linkLabel })}
            onHref={(linkHref) => setExpertise({ ...expertise, linkHref })}
          />
        </div>

        {/* 6. Steps */}
        <div className={cmsCard}>
          <SectionHead n={6} title="How the programme works (dropdown steps)" note="Each step can have its own image, or none." control={control("steps")} />
          <Pair label="Heading" first={steps.heading} second={steps.headingAccent} onFirst={(heading) => setSteps({ ...steps, heading })} onSecond={(headingAccent) => setSteps({ ...steps, headingAccent })} />
          <TextField label="Line under the heading" value={steps.subtitle} onChange={(subtitle) => setSteps({ ...steps, subtitle })} />
          <Repeater
            title="Step"
            items={steps.items}
            onChange={(items) => setSteps({ ...steps, items })}
            blank={() => ({ title: "", body: "", image: "" })}
            addLabel="+ Add step"
            render={(s, set) => (
              <>
                <TextField label="Title" value={s.title} onChange={(title) => set({ title })} />
                <AreaField label="Text when open" value={s.body} onChange={(body) => set({ body })} rows={2} />
                <PictureField label="Image (optional)" src={s.image} onSrc={(image) => set({ image })} />
                {s.image ? (
                  <button type="button" className="text-[12px] text-[#8a2b2b] underline" onClick={() => set({ image: "" })}>
                    Remove this step&apos;s image
                  </button>
                ) : null}
              </>
            )}
          />
          <CtaFields label={steps.ctaLabel} href={steps.ctaHref} onLabel={(ctaLabel) => setSteps({ ...steps, ctaLabel })} onHref={(ctaHref) => setSteps({ ...steps, ctaHref })} />
        </div>

        {/* 7. Journey */}
        <div className={cmsCard}>
          <SectionHead
            n={7}
            title="Your journey (one video + steps)"
            note="One video explains the whole process; the steps sit beside it. Give a step a time (e.g. 0:45) and clicking it jumps the video there."
            control={control("journey")}
          />
          <Pair label="Heading" first={journey.heading} second={journey.headingAccent} onFirst={(heading) => setJourney({ ...journey, heading })} onSecond={(headingAccent) => setJourney({ ...journey, headingAccent })} />
          <TextField label="Line under the heading" value={journey.subtitle} onChange={(subtitle) => setJourney({ ...journey, subtitle })} />
          <PictureField
            label="Video cover image"
            src={journey.image}
            onSrc={(image) => setJourney({ ...journey, image })}
            alt={journey.alt}
            onAlt={(alt) => setJourney({ ...journey, alt })}
          />
          <VideoField label="The journey video" value={journey.video} onChange={(video) => setJourney({ ...journey, video })} />
          <Repeater
            title="Step"
            items={journey.items}
            onChange={(items) => setJourney({ ...journey, items })}
            blank={() => ({ badge: "", title: "", body: "", time: "" })}
            addLabel="+ Add step"
            render={(s, set) => (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <TextField label="Badge" value={s.badge} onChange={(badge) => set({ badge })} placeholder="Day 1" />
                  <TextField label="Title" value={s.title} onChange={(title) => set({ title })} />
                  <TextField
                    label="Starts at (optional)"
                    value={s.time}
                    onChange={(time) => set({ time })}
                    placeholder="0:45"
                    hint="Where this step begins in the video."
                  />
                </div>
                <AreaField label="Text" value={s.body} onChange={(body) => set({ body })} rows={2} />
              </>
            )}
          />
          <CtaFields label={journey.ctaLabel} href={journey.ctaHref} onLabel={(ctaLabel) => setJourney({ ...journey, ctaLabel })} onHref={(ctaHref) => setJourney({ ...journey, ctaHref })} />
        </div>

        {/* 8. Reviews */}
        <div className={cmsCard}>
          <SectionHead n={8} title="Verified reviews (slider)" note="Three fit on desktop. Add more and the row becomes a slider with dots." control={control("reviews")} />
          <Pair label="Heading" first={reviews.heading} second={reviews.headingAccent} onFirst={(heading) => setReviews({ ...reviews, heading })} onSecond={(headingAccent) => setReviews({ ...reviews, headingAccent })} />
          <TextField label="Trustpilot score" value={reviews.rating} onChange={(rating) => setReviews({ ...reviews, rating })} />
          <Repeater
            title="Review"
            items={reviews.items}
            onChange={(items) => setReviews({ ...reviews, items })}
            blank={() => ({ tag: "", title: "", quote: "", name: "" })}
            addLabel="+ Add review"
            render={(r, set) => (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Title" value={r.title} onChange={(title) => set({ title })} />
                  <TextField label="Name" value={r.name} onChange={(name) => set({ name })} />
                </div>
                <TextField label="Green tag (optional)" value={r.tag} onChange={(tag) => set({ tag })} placeholder="6 stone lost · 18 months" />
                <AreaField label="Quote" value={r.quote} onChange={(quote) => set({ quote })} rows={3} />
              </>
            )}
          />
          <CtaFields label={reviews.ctaLabel} href={reviews.ctaHref} onLabel={(ctaLabel) => setReviews({ ...reviews, ctaLabel })} onHref={(ctaHref) => setReviews({ ...reviews, ctaHref })} />
        </div>

        {/* 9. FAQ */}
        <div className={cmsCard}>
          <SectionHead n={9} title="FAQs" control={control("faq")} />
          <Pair label="Heading" first={faq.heading} second={faq.headingAccent} onFirst={(heading) => setFaq({ ...faq, heading })} onSecond={(headingAccent) => setFaq({ ...faq, headingAccent })} />
          <Repeater
            title="Question"
            items={faq.items}
            onChange={(items) => setFaq({ ...faq, items })}
            blank={() => ({ q: "", a: "" })}
            addLabel="+ Add question"
            render={(f, set) => (
              <>
                <TextField label="Question" value={f.q} onChange={(q) => set({ q })} />
                <AreaField label="Answer" value={f.a} onChange={(a) => set({ a })} rows={3} />
              </>
            )}
          />
        </div>

        {/* 10. Final */}
        <div className={cmsCard}>
          <SectionHead n={10} title="Closing call to action" control={control("final")} />
          <Pair label="Heading" first={final.heading} second={final.headingAccent} onFirst={(heading) => setFinal({ ...final, heading })} onSecond={(headingAccent) => setFinal({ ...final, headingAccent })} />
          <TextField label="Line under the heading" value={final.subtitle} onChange={(subtitle) => setFinal({ ...final, subtitle })} />
          <CtaFields label={final.ctaLabel} href={final.ctaHref} onLabel={(ctaLabel) => setFinal({ ...final, ctaLabel })} onHref={(ctaHref) => setFinal({ ...final, ctaHref })} />
          <TextField label="Button text on phones" value={final.mobileCtaLabel} onChange={(mobileCtaLabel) => setFinal({ ...final, mobileCtaLabel })} hint="Empty uses the button text above." />
          <AreaField label="Small print" value={final.disclaimer} onChange={(disclaimer) => setFinal({ ...final, disclaimer })} rows={2} />
          <PictureField label="Photo" src={final.image} onSrc={(image) => setFinal({ ...final, image })} alt={final.imageAlt} onAlt={(imageAlt) => setFinal({ ...final, imageAlt })} />
          <h3 className="pt-2 text-[13px] font-medium text-[#1a1a1a]">Benefit cards</h3>
          <FeatureList title="Benefit" items={final.benefits} onChange={(benefits) => setFinal({ ...final, benefits })} />
        </div>
      </div>

      <SaveBar
        onSave={() => void save()}
        saving={saving}
        dirty={dirty}
        saved={saved}
        error={error}
        label="Save ads lander"
        viewHref="/a7g64pt"
      />

      <p className="mt-3 text-[12px] text-[#8a8a8a]">
        Clearing a heading brings back the wording the page ships with. Clearing a button&apos;s text hides the
        button. Removing every item from a list brings back the shipped list.
      </p>
    </div>
  );
}
