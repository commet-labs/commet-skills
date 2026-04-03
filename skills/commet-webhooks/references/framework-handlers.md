# Framework Webhook Handlers

## Next.js with @commet/next (Recommended)

The `Webhooks` helper auto-verifies signatures and routes events to typed handlers.

```bash
npm install @commet/next
```

```typescript
// app/api/webhooks/commet/route.ts
import { Webhooks } from "@commet/next";

export const POST = Webhooks({
  webhookSecret: process.env.COMMET_WEBHOOK_SECRET!,

  onSubscriptionCreated: async (payload) => {
    console.log("New subscription:", payload.data.subscriptionId);
  },

  onSubscriptionActivated: async (payload) => {
    await sendWelcomeEmail(payload.data.externalId);
    await provisionResources(payload.data.externalId);
  },

  onSubscriptionCanceled: async (payload) => {
    await sendCancellationEmail(payload.data.externalId);
    await scheduleResourceCleanup(payload.data.externalId);
  },

  onSubscriptionUpdated: async (payload) => {
    await syncExternalSystem(payload.data.subscriptionId);
  },

  // Catch-all handler (runs in parallel with specific handlers)
  onPayload: async (payload) => {
    console.log("Webhook received:", payload.event);
  },

  // Error handler
  onError: async (error, payload) => {
    console.error("Webhook error:", error);
  },
});
```

**Response behavior:**
- `200` -- valid signature, handlers executed successfully
- `403` -- invalid signature (rejects the request)
- `200` with warning -- handler threw an error (prevents retries from Commet)

## Express / Node.js with @commet/node

For non-Next.js frameworks, verify signatures manually using the SDK.

```bash
npm install @commet/node
```

```typescript
import express from "express";
import { Commet } from "@commet/node";

const app = express();
const commet = new Commet({ apiKey: process.env.COMMET_API_KEY! });

// Raw body is required for signature verification
app.post(
  "/api/webhooks/commet",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const rawBody = req.body.toString();
    const signature = req.headers["x-commet-signature"] as string;

    const payload = commet.webhooks.verifyAndParse({
      rawBody,
      signature,
      secret: process.env.COMMET_WEBHOOK_SECRET!,
    });

    if (!payload) {
      return res.status(403).send("Invalid signature");
    }

    switch (payload.event) {
      case "subscription.activated":
        await sendWelcomeEmail(payload.data.externalId);
        break;
      case "subscription.canceled":
        await sendCancellationEmail(payload.data.externalId);
        break;
      case "payment.failed":
        await alertCustomerPaymentFailed(payload.data.customerId);
        break;
      case "invoice.created":
        await logInvoice(payload.data.invoiceId);
        break;
    }

    res.status(200).send("OK");
  },
);
```

**Important:** Use `express.raw()` or equivalent to get the raw body string. Parsed JSON bodies will produce incorrect signature hashes.

## Next.js Manual Verification (without @commet/next)

If you prefer not to use the `@commet/next` package:

```typescript
// app/api/webhooks/commet/route.ts
import { Commet } from "@commet/node";

const commet = new Commet({ apiKey: process.env.COMMET_API_KEY! });

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-commet-signature");

  const payload = commet.webhooks.verifyAndParse({
    rawBody,
    signature,
    secret: process.env.COMMET_WEBHOOK_SECRET!,
  });

  if (!payload) {
    return new Response("Invalid signature", { status: 403 });
  }

  switch (payload.event) {
    case "subscription.activated":
      await sendWelcomeEmail(payload.data.externalId);
      break;
    case "subscription.canceled":
      await sendCancellationEmail(payload.data.externalId);
      break;
  }

  return new Response("OK", { status: 200 });
}
```

## Better Auth Webhook Plugin

If using `@commet/better-auth`, webhooks are handled as a plugin on the auth server.

```bash
npm install @commet/better-auth
```

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { commet, webhooks } from "@commet/better-auth";

export const auth = betterAuth({
  plugins: [
    commet({
      apiKey: process.env.COMMET_API_KEY!,
      environment: "production",
      createCustomerOnSignUp: true,
      use: [
        webhooks({
          secret: process.env.COMMET_WEBHOOK_SECRET!,
          onSubscriptionActivated: async (payload) => {
            await sendWelcomeEmail(payload.data.externalId);
          },
          onSubscriptionCanceled: async (payload) => {
            await sendCancellationEmail(payload.data.externalId);
          },
        }),
      ],
    }),
  ],
});
```

The Better Auth plugin automatically registers a webhook endpoint at `/api/auth/commet/webhooks` and handles signature verification.

## Common Patterns

### Process-then-acknowledge

Return `200` quickly, process heavy work asynchronously:

```typescript
// app/api/webhooks/commet/route.ts
import { Webhooks } from "@commet/next";

export const POST = Webhooks({
  webhookSecret: process.env.COMMET_WEBHOOK_SECRET!,

  onSubscriptionActivated: async (payload) => {
    // Queue heavy work instead of doing it inline
    await queue.add("provision-customer", {
      externalId: payload.data.externalId,
      subscriptionId: payload.data.subscriptionId,
    });
  },
});
```

### Idempotent handling

Webhooks may be delivered more than once due to retries. Deduplicate using event identifiers:

```typescript
onPaymentReceived: async (payload) => {
  const alreadyProcessed = await db
    .select()
    .from(processedWebhooks)
    .where(eq(processedWebhooks.invoiceId, payload.data.invoiceId));

  if (alreadyProcessed.length > 0) return;

  await processPayment(payload.data);
  await db.insert(processedWebhooks).values({
    invoiceId: payload.data.invoiceId,
  });
},
```
