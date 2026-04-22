/**
 * Seed script — run with `npm run seed`.
 *
 * Creates an admin user, a couple of products, and one discount code.
 * Safe to re-run: it checks for existing docs before creating.
 */
import "dotenv/config";
import { getPayload } from "payload";
import config from "../../payload.config";

async function ensureAdmin(payload: Awaited<ReturnType<typeof getPayload>>) {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@joodlife.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const existing = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  });

  if (existing.docs.length) {
    payload.logger?.info(`Admin user ${email} already exists — skipping.`);
    return existing.docs[0];
  }

  const admin = await payload.create({
    collection: "users",
    data: {
      name: "Jood Admin",
      email,
      password,
      role: "admin",
    },
    overrideAccess: true,
  });

  payload.logger?.info(`Created admin user ${email}.`);
  return admin;
}

async function ensureProducts(
  payload: Awaited<ReturnType<typeof getPayload>>
) {
  const samples = [
    {
      title: "Mounjaro 2.5mg",
      slug: "mounjaro-2-5mg",
      description: "GLP-1/GIP receptor agonist, 4-week pen starter dose.",
      price: 199,
      comparePrice: 259,
      sku: "MJ-2.5-4W",
      stock: 50,
      category: "medication",
      isActive: true,
    },
    {
      title: "Wegovy 0.25mg",
      slug: "wegovy-0-25mg",
      description: "Weekly GLP-1 injection, 4-week titration starter.",
      price: 185,
      comparePrice: 229,
      sku: "WG-0.25-4W",
      stock: 40,
      category: "medication",
      isActive: true,
    },
    {
      title: "Saxenda 6mg",
      slug: "saxenda-6mg",
      description: "Daily injection for long-term weight management.",
      price: 145,
      sku: "SX-6-4W",
      stock: 30,
      category: "medication",
      isActive: true,
    },
  ];

  for (const p of samples) {
    const existing = await payload.find({
      collection: "products",
      where: { sku: { equals: p.sku } },
      limit: 1,
      overrideAccess: true,
    });
    if (existing.docs.length) {
      payload.logger?.info(`Product ${p.sku} exists — skipping.`);
      continue;
    }
    await payload.create({
      collection: "products",
      data: { ...p, images: [] },
      overrideAccess: true,
    });
    payload.logger?.info(`Created product ${p.sku}.`);
  }
}

async function ensureDiscount(
  payload: Awaited<ReturnType<typeof getPayload>>
) {
  const code = "WELCOME10";
  const existing = await payload.find({
    collection: "discounts",
    where: { code: { equals: code } },
    limit: 1,
    overrideAccess: true,
  });
  if (existing.docs.length) {
    payload.logger?.info(`Discount ${code} exists — skipping.`);
    return;
  }
  await payload.create({
    collection: "discounts",
    data: {
      code,
      type: "percentage",
      value: 10,
      expiryDate: new Date(
        Date.now() + 1000 * 60 * 60 * 24 * 90
      ).toISOString(),
      usageLimit: 1000,
      isActive: true,
    },
    overrideAccess: true,
  });
  payload.logger?.info(`Created discount ${code}.`);
}

async function run() {
  const payload = await getPayload({ config });
  await ensureAdmin(payload);
  await ensureProducts(payload);
  await ensureDiscount(payload);
  payload.logger?.info("Seed complete.");
  process.exit(0);
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
