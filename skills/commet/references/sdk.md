# @commet/node SDK Reference

## Initialization

```typescript
import { Commet } from "@commet/node";

const commet = new Commet({
  apiKey: string,          // Required. Format: ck_xxx
  environment?: "sandbox" | "production", // Default: "sandbox"
  debug?: boolean,         // Log requests/responses
  timeout?: number,        // Request timeout in ms (default: 30000)
  retries?: number,        // Auto-retry on 408/429/5xx (default: 3)
});
```

## Resources

### commet.customers

```typescript
// Create (idempotent with id)
await commet.customers.create({
  email: string,              // Required
  id?: string,                // Your user/org ID
  fullName?: string,
  domain?: string,
  timezone?: string,
  metadata?: Record<string, unknown>,
  address?: { line1, line2?, city, state?, postalCode, country }, // country: ISO-2
});

// Batch create
await commet.customers.createBatch({ customers: CreateCustomerParams[] });

// Get by Commet ID
await commet.customers.get("cus_xxx");

// Update
await commet.customers.update({ customerId: "cus_xxx", email?: string, ... });

// List with filters
await commet.customers.list({ customerId?, isActive?, search?, limit?, cursor? });

```

### commet.plans

```typescript
// List public plans
const { data: plans } = await commet.plans.list();

// Include private plans
const { data: all } = await commet.plans.list({ includePrivate: true });

// Get plan by code (autocomplete after `commet pull`)
const { data: plan } = await commet.plans.get("pro");
// plan.prices: [{ billingInterval, price, isDefault }]
// plan.features: [{ code, name, type, includedAmount, overageUnitPrice, ... }]
```

**Plan types:**
```typescript
interface Plan {
  id: PlanID;           // plan_xxx
  code: string;         // "pro", "enterprise"
  name: string;
  prices: PlanPrice[];  // { billingInterval, price (cents), isDefault }
  features: PlanFeature[]; // { code, name, type, includedAmount, overageUnitPrice, ... }
}
```

### commet.subscriptions

Each customer can only have ONE active subscription.

```typescript
// Create subscription -> returns checkoutUrl for payment
const { data: sub } = await commet.subscriptions.create({
  customerId: "user_123",     // your ID or cus_xxx
  planCode: "pro",            // or planId: "plan_xxx"
  billingInterval?: "monthly" | "quarterly" | "yearly",
  initialSeats?: { editor: 5 },
  skipTrial?: boolean,
  successUrl?: string,        // Redirect after checkout
});
// sub.checkoutUrl -> redirect user here for payment

// Get active subscription
const { data: active } = await commet.subscriptions.getActive({ customerId: "user_123" });
// active.status: "active" | "trialing" | "pending_payment" | ...
// active.plan: { name, basePrice, billingInterval }
// active.features: [{ code, name, type, usage: { current, included, overage } }]
// active.currentPeriod: { start, end, daysRemaining }

// Cancel
await commet.subscriptions.cancel({
  id: "sub_xxx",
  reason?: string,
  immediate?: boolean,  // default: cancel at period end
});
```

**Subscription statuses:** `draft`, `pending_payment`, `trialing`, `active`, `paused`, `past_due`, `canceled`, `expired`.

### commet.usage

Track consumption events for metered features. Two modes: value-based (standard) and token-based (AI models).

```typescript
// Track value-based event (standard metered usage)
await commet.usage.track({
  customerId: "user_123",     // your ID or cus_xxx
  feature: "api_calls",       // feature.code from your plan
  value?: number,             // default: 1
  idempotencyKey?: string,    // prevent duplicate billing
  timestamp?: string,         // ISO 8601, default: now
  properties?: Record<string, string>, // metadata
});

// Track AI model token usage (balance model with AI pricing)
await commet.usage.track({
  customerId: "user_123",
  feature: "ai_generation",
  model: "anthropic/claude-3-opus",  // provider/modelId
  inputTokens: 1000,
  outputTokens: 500,
  cacheReadTokens?: 100,
  cacheWriteTokens?: 50,
});

```

When `model` is provided, `inputTokens` and `outputTokens` are required. `value` and `model` are mutually exclusive. Token costs are calculated from the AI model catalog with configurable margins. For `@commet/ai-sdk` automatic tracking, see [ai-sdk.md](ai-sdk.md).

### commet.seats

Manage seat-based licenses. Seats are charged: advance at period start + prorated true-up for mid-period additions.

```typescript
// Add seats
await commet.seats.add({ customerId: "user_123", featureCode: "editor", count: 5 });

// Remove seats
await commet.seats.remove({ customerId: "user_123", featureCode: "editor", count: 2 });

// Set to exact count
await commet.seats.set({ customerId: "user_123", featureCode: "editor", count: 10 });

// Set all features at once
await commet.seats.setAll({ customerId: "user_123", seats: { editor: 10, viewer: 50 } });

// Get balance
const { data } = await commet.seats.getBalance({ customerId: "user_123", featureCode: "editor" });
// data.current: number, data.asOf: string

// Get all balances
const { data: all } = await commet.seats.getAllBalances({ customerId: "user_123" });
// { editor: { current: 10, asOf: "..." }, viewer: { current: 50, asOf: "..." } }
```

### commet.featureAccess

Check a customer's feature access without parsing subscription data.

```typescript
// Get detailed feature info
const { data } = await commet.featureAccess.get({ code: "team_members", customerId: "user_123" });
// data: { code, name, type, allowed, current, included, remaining, overage, unlimited, ... }

// Check if can use one more unit (metered/seats)
const { data } = await commet.featureAccess.canUse({ code: "team_members", customerId: "user_123" });
// data: { allowed: boolean, willBeCharged: boolean, reason?: string }

// List all features for a customer
const { data } = await commet.featureAccess.list({ customerId: "user_123" });
// data: FeatureAccess[]
```

### commet.features

```typescript
// List the org's feature catalog (definitions, not customer access)
const { data } = await commet.features.list();
```

### commet.portal

Generate customer self-service portal URLs.

```typescript
// By customerId
const { data } = await commet.portal.getUrl({ customerId: "user_123" });

// By email
const { data } = await commet.portal.getUrl({ email: "user@example.com" });

// By customerId
const { data } = await commet.portal.getUrl({ customerId: "cus_xxx" });

// data.portalUrl -> redirect user here
```

### commet.creditPacks

```typescript
const { data: packs } = await commet.creditPacks.list();
// [{ id, name, description, credits, price, currency }]
```

### commet.webhooks

Verify webhook signatures (HMAC-SHA256).

```typescript
// Verify signature
const isValid = commet.webhooks.verify({
  payload: rawBody,                    // Raw request body string
  signature: headers["x-commet-signature"],
  secret: process.env.COMMET_WEBHOOK_SECRET!,
});

// Verify + parse in one step
const payload = commet.webhooks.verifyAndParse({
  rawBody,
  signature,
  secret: process.env.COMMET_WEBHOOK_SECRET!,
});
// payload: { event, timestamp, organizationId, data } | null
```

**Webhook events:** `subscription.created`, `subscription.activated`, `subscription.canceled`, `subscription.updated`.

## Response Format

All methods return `ApiResponse<T>`:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  hasMore?: boolean;    // Pagination
  nextCursor?: string;  // Pagination
}
```

## CLI

```bash
commet login          # Authenticate with Commet
commet logout         # Logout
commet link           # Link project to organization
commet pull           # Generate .commet/types.d.ts (autocomplete for plan codes and feature codes)
commet list           # List organizations
commet switch         # Switch active organization
commet info           # Show project info
commet whoami         # Show authenticated user
commet create [name]  # Scaffold new project from template
```

After `commet pull`, TypeScript autocomplete works for `planCode`, `feature`, `featureCode` parameters.

### Templates (`commet create`)

| Template | Description |
|----------|-------------|
| `fixed` | Fixed subscriptions with boolean features |
| `seats` | Per-seat billing for team collaboration |
| `metered` | Usage-based billing with included amounts and overage |
| `credits` | Credit-based consumption with packs and top-ups |
| `balance-ai` | AI products with automatic token cost tracking and margin |
| `balance-fixed` | Prepaid balance with fixed unit prices |
