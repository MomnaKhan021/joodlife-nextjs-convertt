import type { CollectionAfterChangeHook } from "payload";

/**
 * When a new order is created (or transitions to `paid`), decrement the
 * stock on each referenced product by the ordered quantity. Wrapped in
 * a try/catch so a failing stock update doesn't block the order write.
 */
export const reduceStockAfterOrder: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  const shouldRun =
    operation === "create" ||
    (operation === "update" &&
      previousDoc?.status !== "paid" &&
      doc.status === "paid");

  if (!shouldRun) return doc;

  const items: Array<{ product: string | { id: string }; quantity: number }> =
    doc.products ?? [];

  await Promise.all(
    items.map(async (item) => {
      const productId =
        typeof item.product === "object" ? item.product.id : item.product;
      if (!productId) return;

      try {
        const product = await req.payload.findByID({
          collection: "products",
          id: productId,
          depth: 0,
        });

        const nextStock = Math.max(
          0,
          (product?.stock ?? 0) - (item.quantity ?? 0)
        );

        await req.payload.update({
          collection: "products",
          id: productId,
          data: { stock: nextStock },
          overrideAccess: true,
        });
      } catch (err) {
        req.payload.logger?.error(
          `reduceStockAfterOrder failed for product ${productId}: ${String(err)}`
        );
      }
    })
  );

  return doc;
};
