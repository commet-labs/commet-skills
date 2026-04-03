---
name: commet-webhooks
description: Use when setting up Commet webhook endpoints, verifying signatures, handling billing events (subscription.created, subscription.activated, subscription.canceled, subscription.updated, payment.received, payment.failed, invoice.created), or building event-driven billing workflows.
license: Apache-2.0
metadata:
  author: commet
  version: "1.0.0"
  homepage: https://commet.co
  source: https://github.com/commet-labs/commet-skills
inputs:
  - name: COMMET_WEBHOOK_SECRET
    description: Webhook signing secret (whsec_xxx). Found in Commet dashboard under Webhooks.
    required: true
references:
  - references/setup.md
  - references/events.md
  - references/framework-handlers.md
---

# Commet Webhooks

Receive real-time HTTP notifications when billing events happen in Commet -- subscriptions activating, payments failing, invoices being created, and more.

## Quick Start

```typescript
// app/api/webhooks/commet/route.ts
import { Webhooks } from "@commet/next";

export const POST = Webhooks({
  webhookSecret: process.env.COMMET_WEBHOOK_SECRET!,

  onSubscriptionActivated: async (payload) => {
    await sendWelcomeEmail(payload.data.externalId);
  },

  onSubscriptionCanceled: async (payload) => {
    await sendCancellationEmail(payload.data.externalId);
  },
});
```

Install the handler package:

```bash
npm install @commet/next
```

## Key Gotcha: Query State Directly

Webhooks are for background tasks (sending emails, provisioning resources, logging). They should never be the source of truth for access control or subscription state.

Always query the SDK directly when you need to check a customer's status:

```typescript
import { Commet } from "@commet/node";

const commet = new Commet({ apiKey: process.env.COMMET_API_KEY! });

// Check subscription status -- do this, not webhook state sync
const { data: sub } = await commet.subscriptions.get("user_123");
if (sub?.status === "active" || sub?.status === "trialing") {
  // grant access
}

// Check feature access
const { data } = await commet.features.check({
  code: "advanced_analytics",
  externalId: "user_123",
});
```

## Event Types

| Event | When Fired | Common Use |
|-------|-----------|------------|
| `subscription.created` | New subscription created, before payment | Logging, analytics |
| `subscription.activated` | Payment successful, subscription active | Welcome email, provision resources |
| `subscription.canceled` | Subscription canceled | Cancellation email, schedule cleanup |
| `subscription.updated` | Subscription details changed | Sync external systems |
| `subscription.plan_changed` | Plan upgrade/downgrade | Notify of plan change, adjust resources |
| `payment.received` | Recurring payment processed | Receipt email, update accounting |
| `payment.failed` | Recurring charge failed | Alert customer, dunning flow |
| `invoice.created` | New invoice generated | Custom invoice handling |

See [references/events.md](references/events.md) for full payload shapes and examples.

## Payload Envelope

Every webhook delivers a JSON payload with this structure:

```json
{
  "event": "subscription.activated",
  "timestamp": "2026-03-25T14:30:00.000Z",
  "organizationId": "org_abc123",
  "data": { }
}
```

## Headers

| Header | Description |
|--------|-------------|
| `X-Commet-Signature` | HMAC-SHA256 hex signature of the raw body |
| `X-Commet-Event` | The event type |
| `X-Commet-Timestamp` | ISO 8601 datetime when the event was emitted |

## When to Load References

- **Setting up webhooks or verifying signatures** -> [references/setup.md](references/setup.md)
- **Event payload shapes and fields** -> [references/events.md](references/events.md)
- **Next.js, Express, or Better Auth handlers** -> [references/framework-handlers.md](references/framework-handlers.md)
