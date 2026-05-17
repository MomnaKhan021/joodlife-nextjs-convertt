# Stripe checkout — setup guide

This is the exact sequence to take JoodLife from "test orders saved in
Payload" to **live Stripe-processed payments**. Everything is already
wired up in code; you only need to drop in three keys and add one
webhook endpoint in the Stripe dashboard.

## 1 — Get your three keys

1. Sign in to [https://dashboard.stripe.com](https://dashboard.stripe.com).
2. Toggle the dashboard to **Test mode** (top-right switch) while you
   wire things up. Switch to Live mode later — same steps.
3. Open **Developers → API keys**.
4. Copy these two values:

   | What you need                                | Looks like     |
   | -------------------------------------------- | -------------- |
   | **Secret key**  (server-side, never exposed) | `sk_test_…`    |
   | **Publishable key** (sent to the browser)    | `pk_test_…`    |

> Don't enable "restricted keys" for now — use the standard secret.

## 2 — Add the keys to your environment

### Local development (`.env`)

```dotenv
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXX
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=               # filled in step 3
```

Restart `npm run dev` after editing `.env`.

### Vercel (production)

1. Vercel → your project → **Settings → Environment Variables**.
2. Add the three vars above, scoped to **Production** (and Preview if
   you want test payments on preview branches).
3. Hit **Save** — Vercel redeploys automatically.

## 3 — Add the webhook endpoint

Stripe needs to ping our server when a customer finishes paying, so we
can flip the order to `paid` in Payload. The endpoint is already built
at `/api/stripe/webhook` — you just need to register the URL in the
dashboard.

1. **Developers → Webhooks → Add endpoint.**
2. **Endpoint URL** — `https://YOUR-DOMAIN.com/api/stripe/webhook`.
   - On Vercel, this is your live deployment URL or your custom domain.
   - For local testing, install the Stripe CLI and run
     `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
     The CLI prints its own signing secret to use in `.env`.
3. **Events to send** — add these five:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `charge.refunded`
4. After saving, click into the endpoint → **Signing secret** →
   **Reveal**. Copy the `whsec_…` string and paste it into your
   environment as `STRIPE_WEBHOOK_SECRET`. Redeploy / restart.

## 4 — Test the flow end-to-end

1. Open `/shop`, add a product to your cart.
2. Go to `/checkout`, fill in the form. The **Payment method** card
   now shows "Credit or debit card · stripe" — that's the live UI
   reacting to `/api/stripe/status` reporting `configured: true`.
3. Click **Pay £XX.XX securely**. You'll redirect to
   `checkout.stripe.com`.
4. Enter Stripe's test card:

   | Field      | Value                  |
   | ---------- | ---------------------- |
   | Card no.   | `4242 4242 4242 4242`  |
   | Expiry     | any future date        |
   | CVC        | any 3 digits           |
   | Postcode   | any                    |
5. Stripe sends you to `/checkout/success?orderNumber=JL-…` and
   simultaneously POSTs the webhook to your server. Within ~1s the
   order row flips:

   - `status` → `paid`
   - `payment_status` → `paid`
   - `stripe_payment_intent_id` → `pi_…`
   - `stripe_session_id` → `cs_…`
   - `stripe_customer_id` → `cus_…`
6. Open Payload admin → **Commerce → Orders**. The order is visible
   with all of the above in the sidebar.

## 5 — Going live

1. Toggle dashboard to **Live mode**.
2. Repeat steps 1 + 3 with the **live** keys
   (`sk_live_…` / `pk_live_…` / `whsec_…live`).
3. Vercel → swap the env vars for Production scope.

## What's already protected (without you doing anything)

- Server-side reprice — we ignore any `price` the browser sends and
  read it back from the products table.
- Origin/Referer same-origin guard (CSRF).
- Sliding-window 8 req/min/IP rate limit.
- Sanitised customer name / address / phone / notes (no HTML, no
  control chars).
- Audit columns — IP and User-Agent saved with every order.
- Webhook signature verified against your `STRIPE_WEBHOOK_SECRET`.
- Duplicate webhook events idempotently dropped via the
  `stripe_webhook_events` table.
- CSP, X-Frame-Options DENY, HSTS, Permissions-Policy on every page.

## Troubleshooting

| Symptom                                            | What to check                                                                                |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Payment section says "Test mode is active"         | `STRIPE_SECRET_KEY` is missing or empty. Restart after adding it.                            |
| `503 Stripe is not configured`                     | Same as above — the `/api/stripe/session` route can't see the env var.                       |
| Webhook tab shows `400 Signature verification failed` | `STRIPE_WEBHOOK_SECRET` is wrong, or your reverse proxy is mangling the raw body.        |
| Order stays in `awaiting` after checkout           | Webhook isn't reaching `/api/stripe/webhook`. In Stripe → Webhooks, click the endpoint and look at the latest delivery — it'll show the response status. |
| Stripe dashboard says "POST 200 OK"  but order didn't update | Open Payload admin → Orders, search by `stripe_session_id`. If row exists but status didn't change, check `stripe_webhook_events` table for the event id. |

## File map (for future maintainers)

```
app/api/checkout/route.ts          ← creates order in pending/unpaid
app/api/stripe/session/route.ts    ← creates Stripe Checkout Session
app/api/stripe/webhook/route.ts    ← receives events from Stripe
app/api/stripe/status/route.ts     ← booleans for the UI to read
app/(site)/checkout/CheckoutClient.tsx ← shows Stripe card, drives redirect
lib/stripe.ts                      ← lazy server-only Stripe client
lib/sanitize.ts                    ← PII sanitisation helpers
src/payload/collections/Orders.ts  ← Stripe + audit columns
```
