/**
 * Thin storefront wrapper around Payload's `orders` collection.
 *
 * POST /api/orders
 * Body (JSON or form-encoded):
 *   { items: [{ productId, quantity }], discountCode?, paymentMethod? }
 *
 * Creates an order for the currently authenticated user. Stock reduction
 * + payment flows are handled downstream by Payload hooks.
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import { evaluateDiscount } from "@/src/payload/hooks/validateDiscount";

type OrderItemInput = { productId: string; quantity?: number };
type Body = {
  items?: OrderItemInput[];
  discountCode?: string;
  paymentMethod?: string;
};

export async function POST(req: NextRequest) {
  const payload = await getPayloadInstance();

  // Authenticate the caller — Payload reads its auth cookie from the request.
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req
    .json()
    .catch(() => ({}))) as Body;
  const items = body.items ?? [];
  if (!items.length) {
    return NextResponse.json({ error: "No items" }, { status: 400 });
  }

  // Pull fresh product docs + compute a server-trusted subtotal.
  const orderItems = await Promise.all(
    items.map(async (i) => {
      const product = await payload.findByID({
        collection: "products",
        id: i.productId,
        depth: 0,
      });
      const quantity = Math.max(1, Number(i.quantity ?? 1));
      return {
        product: product.id,
        quantity,
        priceAtPurchase: product.price,
        _stock: product.stock,
      };
    })
  );

  const insufficient = orderItems.find((i) => i.quantity > (i._stock ?? 0));
  if (insufficient) {
    return NextResponse.json(
      { error: "Insufficient stock for one or more items" },
      { status: 409 }
    );
  }

  const subtotal =
    Math.round(
      orderItems.reduce(
        (acc, i) => acc + i.priceAtPurchase * i.quantity,
        0
      ) * 100
    ) / 100;

  // Discount
  let discountId: string | undefined;
  let discountAmount = 0;
  if (body.discountCode) {
    const { docs } = await payload.find({
      collection: "discounts",
      where: { code: { equals: body.discountCode.toUpperCase() } },
      limit: 1,
      overrideAccess: true,
    });
    const result = evaluateDiscount(docs[0], subtotal);
    if (!result.valid) {
      return NextResponse.json(
        { error: `Discount: ${result.reason}` },
        { status: 400 }
      );
    }
    discountId = docs[0]?.id;
    discountAmount = result.amount;
  }

  const totalAmount =
    Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

  const order = await payload.create({
    collection: "orders",
    data: {
      user: user.id,
      products: orderItems.map(({ _stock, ...rest }) => rest),
      discount: discountId,
      discountAmount,
      totalAmount,
      status: "pending",
      paymentMethod: body.paymentMethod ?? "card",
    },
    user,
  });

  // Increment discount usage in the background
  if (discountId) {
    payload
      .update({
        collection: "discounts",
        id: discountId,
        data: {
          usageCount:
            (await payload.findByID({
              collection: "discounts",
              id: discountId,
              overrideAccess: true,
            }).then((d) => d.usageCount ?? 0)) + 1,
        },
        overrideAccess: true,
      })
      .catch(() => undefined);
  }

  return NextResponse.json({ order }, { status: 201 });
}
