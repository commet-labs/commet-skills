---
name: commet-webhooks
description: Use when setting up Commet webhook endpoints, verifying signatures, handling billing events, or building event-driven billing workflows. Covers the full 50-event catalog across subscription lifecycle, scheduled actions (cancellation_scheduled, plan_change_scheduled), trials, checkout, payments, disputes, invoices, payment methods, customers, consumption (credits, balance, quota, usage), seats, add-ons, and payouts. Highlights customer.state_changed — the aggregate entitlement event for syncing access in one handler — plus predictive events (trial.will_end, invoice.upcoming, credits.low, balance.low) and the high-volume usage.recorded opt-in.
license: MIT
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
    await sendWelcomeEmail(payload.data.customerId);
  },

  onSubscriptionCanceled: async (payload) => {
    await sendCancellationEmail(payload.data.customerId);
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
const { data: sub } = await commet.subscriptions.getActive({ customerId: "user_123" });
if (sub?.status === "active" || sub?.status === "trialing") {
  // grant access
}

// Check feature access
const { data } = await commet.featureAccess.get({
  code: "advanced_analytics",
  customerId: "user_123",
});
```

## Event Catalog

Commet emits 50 events across 12 families. See [references/events.md](references/events.md) for every payload shape, field, and example.

| Family | Events |
|--------|--------|
| Subscription | `created`, `activated`, `canceled`, `updated`, `plan_changed`, `cancellation_scheduled`, `cancellation_revoked`, `plan_change_scheduled`, `plan_change_revoked`, `past_due` |
| Trial | `trial.started`, `trial.converted`, `trial.expired`, `trial.will_end`, `trial.checkout_ready` |
| Checkout | `checkout.ready` |
| Payment | `payment.received`, `payment.failed`, `payment.recovered`, `payment.refunded`, `payment.disputed`, `payment.dispute_resolved` |
| Invoice | `invoice.created`, `invoice.upcoming`, `invoice.overdue`, `invoice.voided` |
| Payment Method | `payment_method.attached`, `payment_method.updated` |
| Customer | `customer.created`, `customer.updated`, `customer.state_changed` |
| Credits & Balance | `credits.granted`, `credits.purchased`, `credits.low`, `credits.depleted`, `credits.expired`, `balance.topped_up`, `balance.low`, `balance.depleted` |
| Quota & Usage | `quota.threshold_reached`, `quota.exceeded`, `usage.recorded` |
| Seat | `seats.updated`, `seats.limit_reached` |
| Add-on | `addon.activated`, `addon.deactivated` |
| Payout | `payout.available`, `payout.created`, `payout.paid`, `payout.failed` |

**Scheduled actions** (`cancellation_scheduled`, `plan_change_scheduled`, and their `_revoked` pairs) fire when a change is queued for the end of the billing period — the subscription stays usable until it executes. Don't change access on these; wait for `subscription.canceled` / `subscription.plan_changed`.

**Predictive events** (`trial.will_end`, `invoice.upcoming`, `credits.low`, `balance.low`) fire ahead of time so you can warn the customer. They are emitted once per crossing with deterministic idempotency keys.

### Recommended: gate access with `customer.state_changed`

`customer.state_changed` is the aggregate entitlement event. It fires on every transition that can change what a customer can access (subscription lifecycle, plan changes, trials, past due, scheduled cancellations, seats, add-ons, depletions) and carries the customer's CURRENT plan, features, seats, and credits or balance. Handle this one event to keep access in sync instead of wiring every lifecycle event:

```typescript
export const POST = Webhooks({
  webhookSecret: process.env.COMMET_WEBHOOK_SECRET!,

  onCustomerStateChanged: async (payload) => {
    const { customerId, status, plan, features } = payload.data;
    const hasAccess = status === "active" || status === "trialing";
    await syncEntitlements(customerId, { hasAccess, plan, features });
  },
});
```

### High-volume opt-in: `usage.recorded`

`usage.recorded` fires once per tracked usage event, so it can match your full ingest rate. It is excluded from family select-all in the dashboard — subscribe to it explicitly and only when you need a raw event stream, and make sure your endpoint can absorb the volume.

## Payload Envelope

Every webhook delivers a JSON payload with this structure:

```json
{
  "event": "subscription.activated",
  "timestamp": "2026-03-25T14:30:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": { }
}
```

`mode` is `live` or `sandbox`; `apiVersion` is the API version the payload is shaped for. Inside `data`, `customerId` returns your `externalId` when you set one on the customer, otherwise the Commet public ID.

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
