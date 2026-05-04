/**
 * GET /api/posts/seed-sample
 * Admin-only. Inserts 3 sample blog posts so the operator can see the
 * /blogs layout populated end-to-end. Idempotent — keyed on the stable
 * shopify_article_id "sample:1"…"sample:3", so re-running is a no-op.
 *
 *   Returns: { ok, inserted, skipped }
 *
 * After running, visit /blogs to see them. Edit/delete in
 * /admin/collections/posts like any other post.
 */
import { NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

async function getDrizzle(): Promise<{ drizzle: DrizzleLike; sql: SqlRaw }> {
  const payload = await getPayloadInstance();
  const drizzle = (
    payload.db as unknown as {
      drizzle?: { execute?: (q: unknown) => Promise<unknown> };
    }
  ).drizzle;
  if (!drizzle?.execute) throw new Error("payload.db.drizzle.execute unavailable");
  const { sql: drizzleSql } = (await import("drizzle-orm")) as { sql: SqlRaw };
  return { drizzle: drizzle as DrizzleLike, sql: drizzleSql };
}

function esc(s: string | null | undefined) {
  return s === null || s === undefined
    ? "NULL"
    : "'" + String(s).replace(/'/g, "''") + "'";
}

function readRows(result: unknown): Array<{ id: number }> {
  if (Array.isArray(result)) return result as Array<{ id: number }>;
  if (result && typeof result === "object" && "rows" in result) {
    const r = (result as { rows?: Array<{ id: number }> }).rows;
    return Array.isArray(r) ? r : [];
  }
  return [];
}

type Sample = {
  shopifyId: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  publishedAtDaysAgo: number;
  heroImageUrl: string;
  tags: string[];
  bodyHtml: string;
};

const SAMPLES: Sample[] = [
  {
    shopifyId: "sample:1",
    title:
      "Five myths about GLP-1 medications, debunked by clinicians",
    slug: "five-myths-about-glp-1-medications-debunked",
    category: "weight-loss",
    publishedAtDaysAgo: 1,
    excerpt:
      "From rapid weight regain to so-called \"easy way out\" criticism — we asked our medical team to set the record straight on the most common misconceptions about GLP-1 treatment.",
    heroImageUrl: "https://picsum.photos/seed/joodlife-glp1/1600/900",
    tags: ["GLP-1", "myths", "clinical"],
    bodyHtml: `<p>If you've read anything about GLP-1 medications in the last twelve months, chances are you've come across at least one claim that doesn't quite add up. Some are well-meaning oversimplifications. Others are flat-out wrong. Here are the five we hear most often, and what the evidence actually says.</p>

<h2>Myth 1: "You'll just put the weight back on the moment you stop"</h2>
<p>Weight regain after stopping any treatment — diet, exercise, surgery, or medication — is the rule, not the exception. What GLP-1s do is buy you time to build the habits that make maintenance possible. The clinical trials show that <strong>continued treatment maintains continued results</strong>, which is consistent with how we treat every other chronic metabolic condition.</p>

<h2>Myth 2: "It's the easy way out"</h2>
<p>There is nothing easy about it. Weekly injections, dietary recalibration, side-effect management, and the reality of changing your relationship with food all require active engagement from the patient. The medication is a tool, not a substitute for the work.</p>

<h2>Myth 3: "It's just an appetite suppressant"</h2>
<p>GLP-1 receptor agonists work through several pathways at once: slowing gastric emptying, signalling satiety in the hypothalamus, improving insulin sensitivity, and reducing hedonic food drive. Calling them "appetite suppressants" is like calling a smartphone a calculator.</p>

<h2>Myth 4: "Everyone gets serious side effects"</h2>
<p>Most people experience mild gastrointestinal effects in the first few weeks — nausea, fullness, occasional reflux — and most of those resolve as the body adjusts. Slow titration, hydration, and small frequent meals are usually enough.</p>

<blockquote>The first month is the hardest. By month three, most patients tell us they barely think about it.</blockquote>

<h2>Myth 5: "It's only for people with diabetes"</h2>
<p>Tirzepatide, semaglutide and liraglutide all have specific licences for chronic weight management in adults who meet BMI criteria, regardless of diabetes status. The mechanism that makes them effective for blood glucose control is the same mechanism that makes them effective for weight management.</p>

<h2>The bottom line</h2>
<p>GLP-1 medications aren't magic, and they aren't a shortcut. They're a clinically validated tool for a chronic condition that has long been treated with willpower and finger-wagging. Used well, they can give people the breathing room to do the work that actually sticks.</p>`,
  },
  {
    shopifyId: "sample:2",
    title:
      "Building a sustainable routine on weight-loss medication",
    slug: "building-a-sustainable-routine-on-weight-loss-medication",
    category: "lifestyle",
    publishedAtDaysAgo: 5,
    excerpt:
      "The medication does some of the heavy lifting. The habits you build around it decide whether the results last. A practical, no-nonsense framework from the JoodLife clinical team.",
    heroImageUrl: "https://picsum.photos/seed/joodlife-routine/1600/900",
    tags: ["habits", "routine", "lifestyle"],
    bodyHtml: `<p>Most people start treatment focused on the number on the scale. Six months later, the patients who keep their results are almost universally focused on something else: the routine they've built around the medication. Here is the framework we walk every new patient through.</p>

<h2>Eat protein first</h2>
<p>On a GLP-1, you'll feel full sooner. If the first thing you eat is rice, pasta or bread, you'll fill up before you've taken in enough protein to protect lean muscle mass. Reverse the order: <strong>protein and vegetables first, starches last</strong>.</p>

<h2>Hydrate like it's a medication</h2>
<p>Slowed gastric emptying makes mild dehydration feel like nausea. Two litres of water a day, sipped consistently, prevents 80% of the GI complaints we hear about in clinic.</p>

<h2>Resistance train, twice a week minimum</h2>
<p>Rapid weight loss without resistance training means you'll lose fat <em>and</em> muscle. Two short sessions a week — twenty to thirty minutes of compound movements — is the floor, not the goal.</p>

<ul>
  <li>Squats, lunges, or step-ups</li>
  <li>Push-ups, dumbbell presses, or seated rows</li>
  <li>Deadlifts, hip hinges, or kettlebell swings</li>
</ul>

<h2>Sleep is part of the protocol</h2>
<p>Poor sleep raises ghrelin and lowers leptin — the exact opposite of what your medication is doing. Aim for seven to nine hours, and treat consistency (same wake time, same wind-down) as more important than perfection.</p>

<h2>Track three things, not thirty</h2>
<p>Weight, weekly resistance sessions, and protein per day. That's enough signal to course-correct without becoming obsessive about it.</p>

<h2>Build the off-ramp early</h2>
<p>Decide now what your routine looks like at maintenance dose, and what it looks like if you decide to stop. The patients who keep their results are the ones who've already rehearsed the answer.</p>`,
  },
  {
    shopifyId: "sample:3",
    title: "What the science says about long-term weight maintenance",
    slug: "what-science-says-about-long-term-weight-maintenance",
    category: "science",
    publishedAtDaysAgo: 12,
    excerpt:
      "A plain-English read of what the last decade of obesity research actually tells us about keeping weight off — and where the field still doesn't have a clean answer.",
    heroImageUrl: "https://picsum.photos/seed/joodlife-science/1600/900",
    tags: ["research", "metabolism", "evidence"],
    bodyHtml: `<p>Long-term weight maintenance is the single hardest problem in obesity medicine. Most diet studies stop at twelve months. Most surgical studies stop at five years. The honest answer to "what works long-term" requires reading between the studies. Here's a tour.</p>

<h2>The set-point question</h2>
<p>Your body defends a weight range, and that range is set by a mix of genetics, early-life environment, and decades of metabolic adaptation. Crash dieting compresses the defended weight downward briefly, then it springs back. The mechanisms — leptin signalling, thyroid axis, sympathetic tone — are all measurable, and they all push the same direction.</p>

<h2>What actually moves the set point</h2>
<p>Three interventions are the only ones with multi-year evidence of moving the defended weight:</p>

<ol>
  <li><strong>Bariatric surgery</strong> — five-to-ten-year studies show durable weight loss with substantial co-morbidity reversal.</li>
  <li><strong>Sustained GLP-1/dual-agonist therapy</strong> — emerging long-term data shows results hold while treatment continues.</li>
  <li><strong>Sustained behavioural change</strong> — works, but the dropout rate at year five is brutal in every published cohort.</li>
</ol>

<h2>Where the science is honest about uncertainty</h2>
<p>We don't yet know whether long-term GLP-1 use eventually re-sets the defended weight, or whether it simply suppresses it as long as treatment continues. The trials that would answer that question are running now. Anyone who tells you they already have the answer is selling something.</p>

<blockquote>The most useful frame: treat obesity like hypertension, not like a moral failing. We don't tell hypertension patients to "stop being hypertensive" — we treat the condition.</blockquote>

<h2>What this means for you</h2>
<p>Plan for treatment that lasts as long as the condition does. Build the habits that compound regardless of what's in your fridge or your medication box. And — this is the unromantic truth — accept that maintenance will be a longer project than weight loss ever was.</p>`,
  },
];

export async function GET() {
  const payload = await getPayloadInstance();
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user || (user as unknown as { role?: string }).role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Admin role required" },
      { status: 403 }
    );
  }

  let drizzle: DrizzleLike;
  let sql: SqlRaw;
  try {
    const d = await getDrizzle();
    drizzle = d.drizzle;
    sql = d.sql;
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "DB init failed", detail: String(err) },
      { status: 500 }
    );
  }

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const s of SAMPLES) {
    try {
      // ON CONFLICT (slug) DO NOTHING covers the slug-uniqueness path;
      // we additionally check shopify_article_id manually so re-runs
      // also no-op on rows that were inserted previously with a
      // different slug.
      const existing = await drizzle.execute(
        sql.raw(
          `SELECT id FROM "posts" WHERE shopify_article_id = ${esc(s.shopifyId)} LIMIT 1`
        )
      );
      if (readRows(existing).length > 0) {
        skipped++;
        continue;
      }

      const publishedIso = new Date(
        Date.now() - s.publishedAtDaysAgo * 24 * 60 * 60 * 1000
      ).toISOString();

      const insertStmt = `
        INSERT INTO "posts"
          (title, slug, excerpt, body_html, hero_image_url, category, status,
           published_at, shopify_article_id, updated_at, created_at)
        VALUES
          (${esc(s.title)}, ${esc(s.slug)}, ${esc(s.excerpt)},
           ${esc(s.bodyHtml)}, ${esc(s.heroImageUrl)}, ${esc(s.category)},
           'published', ${esc(publishedIso)}, ${esc(s.shopifyId)},
           now(), now())
        ON CONFLICT (slug) DO NOTHING
        RETURNING id;
      `;
      const res = await drizzle.execute(sql.raw(insertStmt));
      const rows = readRows(res);
      if (rows.length === 0) {
        skipped++;
        continue;
      }

      // Tags
      const postId = rows[0].id;
      const values = s.tags
        .map((t, i) => `(${postId}, ${i}, ${esc(t)})`)
        .join(", ");
      if (values) {
        try {
          await drizzle.execute(
            sql.raw(
              `INSERT INTO "posts_tags" (_parent_id, _order, tag) VALUES ${values}`
            )
          );
        } catch {
          /* tag table not yet created on a very fresh deploy — non-fatal */
        }
      }

      inserted++;
    } catch (err) {
      errors.push(
        `${s.slug}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return NextResponse.json({
    ok: true,
    inserted,
    skipped,
    errors: errors.slice(0, 10),
    next: "/blogs",
  });
}
