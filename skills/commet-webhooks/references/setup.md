# Webhook Setup and Configuration

## Registering an Endpoint

1. Go to **Settings > Webhooks** in the Commet dashboard
2. Click **Add Endpoint** and enter your URL (e.g. `https://yourapp.com/api/webhooks/commet`)
3. Select which events to subscribe to
4. Copy the signing secret (`whsec_xxx`) -- store it securely as `COMMET_WEBHOOK_SECRET`

## Signature Verification

Every webhook request includes an `X-Commet-Signature` header containing an HMAC-SHA256 hex digest of the raw request body, signed with your webhook secret.

### Using @commet/next (recommended)

The `Webhooks` handler verifies signatures automatically:

```typescript
// app/api/webhooks/commet/route.ts
import { Webhooks } from "@commet/next";

export const POST = Webhooks({
  webhookSecret: process.env.COMMET_WEBHOOK_SECRET!,
  onSubscriptionActivated: async (payload) => { /* ... */ },
});
```

Returns `200` for valid signatures, `403` for invalid.

### Using @commet/node (manual)

```typescript
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

  // payload: { event, timestamp, organizationId, data }
  return new Response("OK", { status: 200 });
}
```

### Verify only (without parsing)

```typescript
const isValid = commet.webhooks.verify({
  payload: rawBody,
  signature: headers["x-commet-signature"],
  secret: process.env.COMMET_WEBHOOK_SECRET!,
});
```

## Retry Policy

If your endpoint returns a non-2xx status or times out (10 seconds), Commet retries with exponential backoff:

| Attempt | Delay |
|---------|-------|
| 1st retry | 1 minute |
| 2nd retry | 5 minutes |
| 3rd retry | 15 minutes |
| 4th retry | 30 minutes |
| 5th retry | 1 hour |
| 6th retry | 2 hours |
| 7th retry | 4 hours |
| 8th retry | 6 hours |

After 8 failed attempts, the delivery is marked as failed. Monitor delivery status in the Commet dashboard.

## Security Best Practices

1. **Always verify signatures.** Never process a webhook without verifying the `X-Commet-Signature` header. Use `@commet/next` or `commet.webhooks.verifyAndParse()`.

2. **Use HTTPS.** Webhook endpoints must use HTTPS in production. Commet will not deliver to plain HTTP URLs.

3. **Return 200 quickly.** Process heavy work asynchronously (queue, background job). The 10-second timeout triggers retries, and duplicate processing is worse than delayed processing.

4. **Handle idempotently.** Retries mean you may receive the same event multiple times. Use `subscriptionId` or `invoiceId` from the payload to deduplicate.

5. **Don't use webhooks for access control.** Webhooks can be delayed, retried, or arrive out of order. Always query `commet.subscriptions.get()` or `commet.features.check()` for real-time access decisions.

## Environment Variables

```env
COMMET_WEBHOOK_SECRET=whsec_xxx   # From dashboard, Webhooks section
COMMET_API_KEY=ck_xxx             # Required if using @commet/node for manual verification
```
