---
name: commet
description: Integrate Commet billing and payments into any application. Use when working with @commet/node, @commet/next, @commet/better-auth, the Commet CLI, or building billing features like subscriptions, usage tracking, seat management, checkout, customer portal, webhooks, feature gating, or payment flows. Triggers on imports from "@commet/node", "@commet/next", "@commet/better-auth", commet SDK usage, billing integration tasks, or mentions of Commet.
license: MIT
metadata:
  author: commet
  version: "1.0.0"
  homepage: https://commet.co
  source: https://github.com/commet-labs/skills
---

# Commet Integration

Commet is an all-in-one billing and payments platform. Merchant of Record handling taxes, compliance, refunds, and payouts. Integrate with a few lines of code.

## Packages

| Package | Purpose | Install |
|---------|---------|---------|
| `@commet/node` | Core SDK - customers, subscriptions, usage, seats, features, portal, webhooks | `npm i @commet/node` |
| `@commet/next` | Next.js helpers - webhook handler, customer portal, pricing markdown | `npm i @commet/next` |
| `@commet/ai-sdk` | Vercel AI SDK middleware - automatic AI token usage billing | `npm i @commet/ai-sdk` |
| `@commet/better-auth` | Better Auth plugin - auto customer sync, auth-scoped billing | `npm i @commet/better-auth` |
| `commet` | CLI - login, link, config push/pull, webhook forwarding, scaffold projects from templates | `npm install -g commet` |

## Quick Start

```typescript
import { Commet } from "@commet/node";

const commet = new Commet({
  apiKey: process.env.COMMET_API_KEY!, // ck_xxx format
});
```

One URL, one key: the organization behind the API key decides sandbox vs live. A sandbox organization's key only touches sandbox data; a live organization's key touches live data. There is no `environment` option.

## Integration Workflow

1. **Setup**: `commet login` -> `commet link` -> `commet pull` (syncs your billing config into `commet.config.ts`)
2. **Create customer**: On user signup, create Commet customer with `id` = your user ID
3. **Create subscription**: Call `subscriptions.create()` -> redirect to `checkoutUrl`
4. **Check state**: Query `subscriptions.getActive()` to check subscription status (preferred over webhooks)
5. **Track usage**: `usage.track()` for metered features, `seats.add/remove/set()` for seats
6. **Feature gating**: `featureAccess.get()` / `featureAccess.list()` for current state, `usage.check()` before prospective consumption
7. **Customer portal**: `portal.getUrl()` -> redirect for self-service billing management

## SDK Reference

See [references/sdk.md](references/sdk.md) for the complete API surface of `@commet/node`.

## Next.js Integration

See [references/nextjs.md](references/nextjs.md) for `@commet/next` webhook handlers, customer portal routes, and pricing markdown.

## AI SDK Integration

See [references/ai-sdk.md](references/ai-sdk.md) for `@commet/ai-sdk` middleware that auto-tracks AI token usage for billing.

## Better Auth Integration

See [references/better-auth.md](references/better-auth.md) for the `@commet/better-auth` plugin that auto-syncs customers and provides auth-scoped billing endpoints.

## Billing Concepts

See [references/billing-concepts.md](references/billing-concepts.md) for plan structure, feature types, consumption models, and charging behavior.

## Key Patterns

### Query-first, webhooks optional

Always query subscription/feature state directly with the SDK instead of relying on webhooks to sync state. The recommended pattern is to call `subscriptions.getActive()`, `featureAccess.get()`, or `featureAccess.list()` when you need to know a customer's status. Webhooks are useful for background tasks (sending emails, provisioning resources) but should never be the source of truth for access control.

```typescript
// Recommended: query state directly
const sub = await commet.subscriptions.getActive({ customerId: "user_123" });
if (sub?.status === "active") { /* grant access */ }

// Recommended: feature gating
const access = await commet.featureAccess.get({
  code: "advanced_analytics",
  customerId: "user_123",
});
if (!access.allowed) { /* show upgrade prompt */ }
```

### Customer identification

Always use `customerId` (your user/org ID) to identify customers. The SDK accepts both your own IDs and Commet's `cus_xxx` IDs.

### Idempotency

All POST requests auto-generate idempotency keys. For critical operations, pass explicit keys:

```typescript
await commet.usage.track({
  customerId: "user_123",
  featureCode: "api_calls",
  eventId: `usage_${requestId}`,
}, {
  idempotencyKey: `request_${requestId}`,
});
```

### Error handling

```typescript
import { CommetAPIError, CommetValidationError } from "@commet/node";

try {
  await commet.subscriptions.create({ ... });
} catch (error) {
  if (error instanceof CommetValidationError) {
    console.log(error.validationErrors); // { field: ["message"] }
  }
  if (error instanceof CommetAPIError) {
    console.log(error.statusCode, error.code);
  }
}
```

### Environment variables

```env
COMMET_API_KEY=ck_xxx           # API key from dashboard - the key's organization decides sandbox vs live
COMMET_WEBHOOK_SECRET=whsec_xxx # Optional - webhook secret for signature verification
```
