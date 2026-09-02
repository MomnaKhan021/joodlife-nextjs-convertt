import "server-only";

import type { FullPost, StorefrontPost } from "./posts";

/**
 * Jood Journal — starter content.
 *
 * The /blogs (“Jood wellness library”) surface is database-backed
 * (Payload `posts`). When the database has no published posts yet,
 * lib/posts falls back to these curated articles so the Library is
 * never empty. Once real posts are published in the CMS, these are
 * automatically superseded.
 *
 * Everything here is self-hosted on our own site — images live in
 * /public/assets/journal, and nothing links off to another site.
 */

const AUTHOR = "The Jood Clinical Team";

export const journalSeedPosts: FullPost[] = [
  {
    id: 9001,
    title: "How Weight Loss Medications Are Changing Everyday Lives",
    slug: "how-weight-loss-medications-are-changing-everyday-lives",
    excerpt:
      "Modern GLP-1 treatments are helping people quiet food noise, build steadier habits and feel more in control — here's what that really looks like day to day.",
    heroImageUrl: "/assets/journal/food-1.jpg",
    heroImageAlt: "A man jogging outdoors, smiling",
    category: "weight-loss",
    publishedAt: "2026-08-06T09:00:00.000Z",
    authorName: AUTHOR,
    tags: ["GLP-1", "weight loss", "everyday life"],
    content: null,
    bodyHtml: `
      <p>For a long time, weight management advice boiled down to “eat less, move more” — as if willpower alone were the missing ingredient. We now understand that appetite is driven by biology, not just discipline, and that changes everything about how we help people.</p>
      <h2>Quieting the “food noise”</h2>
      <p>Many people describe a constant background chatter about food — what to eat next, second helpings, the biscuit tin at 4pm. GLP-1 medications such as Wegovy and Mounjaro work with the body's own appetite signals, and one of the first things people notice is that this noise gets quieter. Meals feel like enough. Cravings lose their grip.</p>
      <h2>Small changes that actually stick</h2>
      <p>When hunger is calmer, healthy habits stop feeling like a fight. People tell us they finally have the headspace to cook properly, walk after dinner, and sleep better — not because they're forcing themselves, but because the biological pressure has eased.</p>
      <ul>
        <li>Steadier energy through the day, with fewer sharp dips and cravings.</li>
        <li>More consistent, moderate portions without constant counting.</li>
        <li>Confidence that builds slowly as the scales — and how clothes fit — start to shift.</li>
      </ul>
      <h2>Treatment is a tool, not a shortcut</h2>
      <p>Medication works best alongside good food, movement and support. That's why every Jood plan starts with a proper clinical consultation and includes ongoing care — so your treatment is matched to you and reviewed as you progress.</p>
      <blockquote>The goal isn't a quick number on the scales. It's a healthier relationship with food that lasts.</blockquote>
      <p>If you're wondering whether treatment could be right for you, the first step is a short, confidential consultation with a UK-registered prescriber.</p>
    `,
    metaTitle: null,
    metaDescription:
      "How modern GLP-1 weight loss treatments help people quiet cravings and build lasting habits.",
  },
  {
    id: 9002,
    title: "GLP-1 Medications Explained: How Wegovy and Mounjaro Work",
    slug: "glp-1-medications-explained-how-wegovy-and-mounjaro-work",
    excerpt:
      "A clear, jargon-free guide to what GLP-1 (and GIP) medicines do in the body, why they help with appetite, and what to expect when you start.",
    heroImageUrl: "/assets/journal/frame-5.png",
    heroImageAlt: "A man running up outdoor steps at sunset",
    category: "science",
    publishedAt: "2026-07-30T09:00:00.000Z",
    authorName: AUTHOR,
    tags: ["GLP-1", "Wegovy", "Mounjaro", "science"],
    content: null,
    bodyHtml: `
      <p>GLP-1 medications get talked about a lot, but rarely explained simply. Here's what's actually happening in the body.</p>
      <h2>What is GLP-1?</h2>
      <p>GLP-1 (glucagon-like peptide-1) is a hormone your gut naturally releases after you eat. It tells your brain you're full, slows how quickly your stomach empties, and helps your body manage blood sugar. Medicines like Wegovy (semaglutide) mimic this hormone, so those “I've had enough” signals last longer.</p>
      <h2>Where Mounjaro is different</h2>
      <p>Mounjaro (tirzepatide) acts on two hormone pathways — GLP-1 and GIP — which is why many people find its appetite effect especially strong. Your prescriber will help decide which option suits your health profile and goals.</p>
      <h2>What to expect early on</h2>
      <ul>
        <li>Doses start low and increase gradually to help your body adjust.</li>
        <li>Mild digestive side effects (nausea, feeling full quickly) are common at first and usually settle.</li>
        <li>Appetite changes often appear within the first few weeks.</li>
      </ul>
      <p>None of this replaces medical advice. A consultation lets a clinician check the treatment is safe and appropriate for you before you begin.</p>
    `,
    metaTitle: null,
    metaDescription:
      "A plain-English explanation of how GLP-1 medicines like Wegovy and Mounjaro work.",
  },
  {
    id: 9003,
    title: "Building a Plate That Keeps You Full",
    slug: "building-a-plate-that-keeps-you-full",
    excerpt:
      "Protein, fibre and colour do the heavy lifting. A simple framework for meals that satisfy — especially helpful while your appetite is changing on treatment.",
    heroImageUrl: "/assets/journal/food-2.jpg",
    heroImageAlt: "A fresh mixed green salad with tomatoes",
    category: "nutrition",
    publishedAt: "2026-07-22T09:00:00.000Z",
    authorName: AUTHOR,
    tags: ["nutrition", "protein", "fibre"],
    content: null,
    bodyHtml: `
      <p>When you're eating less, every mouthful matters more. The aim is to get enough protein, fibre and nutrients from smaller portions — so you feel full, protect muscle, and stay well.</p>
      <h2>The simple plate</h2>
      <ul>
        <li><strong>Half the plate vegetables or salad</strong> — fibre, volume and nutrients.</li>
        <li><strong>A quarter protein</strong> — fish, chicken, eggs, tofu, beans or Greek yoghurt.</li>
        <li><strong>A quarter slow carbs</strong> — wholegrains, potatoes or lentils for steady energy.</li>
      </ul>
      <h2>Prioritise protein</h2>
      <p>Protein keeps you fuller for longer and helps preserve muscle while you lose weight. Aim to include a source at every meal — many people find front-loading protein at breakfast makes the whole day easier.</p>
      <h2>Don't forget fluids</h2>
      <p>Appetite changes can blunt your thirst too. Keep water handy, and go gently with rich or very fatty meals if your stomach is emptying more slowly.</p>
      <p>If you're unsure how to adapt your meals on treatment, our care team is always happy to help.</p>
    `,
    metaTitle: null,
    metaDescription:
      "A simple framework for building filling, balanced meals while losing weight.",
  },
  {
    id: 9004,
    title: "Eating Out Without Derailing Your Progress",
    slug: "eating-out-without-derailing-your-progress",
    excerpt:
      "Restaurants, takeaways and celebrations are part of life. Here's how to enjoy them while staying on track — no guilt, no all-or-nothing thinking.",
    heroImageUrl: "/assets/journal/food-3.jpg",
    heroImageAlt: "Plated restaurant dishes on a wooden table",
    category: "nutrition",
    publishedAt: "2026-07-15T09:00:00.000Z",
    authorName: AUTHOR,
    tags: ["nutrition", "lifestyle", "eating out"],
    content: null,
    bodyHtml: `
      <p>A sustainable plan has room for meals out. The trick is a few easy habits, not strict rules.</p>
      <h2>Before you go</h2>
      <ul>
        <li>Have a glass of water and a small protein snack so you don't arrive ravenous.</li>
        <li>Glance at the menu ahead of time and pick something you'll genuinely enjoy.</li>
      </ul>
      <h2>At the table</h2>
      <ul>
        <li>Start with a broth-based soup or a salad to take the edge off your appetite.</li>
        <li>Eat slowly — on treatment you may feel full sooner than the person next to you, and that's fine.</li>
        <li>Box up the rest. Feeling comfortably satisfied beats finishing the plate.</li>
      </ul>
      <h2>Keep perspective</h2>
      <p>One meal never makes or breaks your progress. What matters is the pattern across weeks, not any single evening. Enjoy the occasion, then carry on as normal the next day.</p>
    `,
    metaTitle: null,
    metaDescription:
      "Practical, guilt-free tips for eating out while on a weight loss plan.",
  },
  {
    id: 9005,
    title: "Movement That Complements Your Treatment",
    slug: "movement-that-complements-your-treatment",
    excerpt:
      "You don't need punishing workouts. Gentle, regular movement protects muscle, lifts your mood and supports the results your treatment is helping you build.",
    heroImageUrl: "/assets/journal/frame-4.png",
    heroImageAlt: "A woman walking outdoors in activewear",
    category: "lifestyle",
    publishedAt: "2026-07-08T09:00:00.000Z",
    authorName: AUTHOR,
    tags: ["movement", "lifestyle", "muscle"],
    content: null,
    bodyHtml: `
      <p>Exercise isn't the main driver of weight loss on GLP-1 treatment — appetite change is. But movement matters hugely for how you feel and for keeping the weight off.</p>
      <h2>Why it helps</h2>
      <ul>
        <li><strong>Protects muscle</strong> — resistance work helps you lose fat, not strength.</li>
        <li><strong>Supports mood and sleep</strong> — even a daily walk makes a difference.</li>
        <li><strong>Builds the habit</strong> that keeps results steady long term.</li>
      </ul>
      <h2>A realistic starting point</h2>
      <p>Begin with what you can sustain: a 20–30 minute walk most days, plus two short strength sessions a week (bodyweight or light weights is plenty). Consistency beats intensity every time.</p>
      <p>Listen to your body — appetite changes can mean lower energy at first, so build up gradually and fuel with enough protein.</p>
    `,
    metaTitle: null,
    metaDescription:
      "How gentle, regular movement supports weight loss treatment and long-term results.",
  },
  {
    id: 9006,
    title: "Real Results: What a Sustainable Journey Looks Like",
    slug: "real-results-what-a-sustainable-journey-looks-like",
    excerpt:
      "Lasting change rarely looks like a straight line. Here's a realistic picture of the ups, downs and quiet wins along the way — and why patience pays off.",
    heroImageUrl: "/assets/journal/frame-1.png",
    heroImageAlt: "A smiling woman standing confidently",
    category: "lifestyle",
    publishedAt: "2026-06-30T09:00:00.000Z",
    authorName: AUTHOR,
    tags: ["motivation", "lifestyle", "results"],
    content: null,
    bodyHtml: `
      <p>It's easy to compare your journey to a dramatic before-and-after. Real progress is quieter, and far more reassuring once you know what to expect.</p>
      <h2>Progress isn't linear</h2>
      <p>Weight can stall for a week or two and then move again. Plateaus are normal — they're often your body adjusting, not a sign anything is wrong. Zoom out and look at the monthly trend, not the daily number.</p>
      <h2>Wins that don't show on the scales</h2>
      <ul>
        <li>Clothes fitting differently before the number moves.</li>
        <li>More energy, better sleep, steadier mood.</li>
        <li>Feeling in control around food for the first time in years.</li>
      </ul>
      <h2>Why ongoing support matters</h2>
      <p>Regular check-ins let your clinician adjust your treatment, troubleshoot side effects and keep you moving forward. You're not doing this alone — that's the whole point of a supported plan.</p>
      <blockquote>Slow and steady really does win. The people who keep the weight off are the ones who gave themselves time.</blockquote>
    `,
    metaTitle: null,
    metaDescription:
      "A realistic look at what a sustainable, supported weight loss journey looks like.",
  },
];

/** Strip full-article fields down to the list/card shape. */
export function seedToStorefront(p: FullPost): StorefrontPost {
  const { content, bodyHtml, metaTitle, metaDescription, ...list } = p;
  void content;
  void bodyHtml;
  void metaTitle;
  void metaDescription;
  return list;
}
