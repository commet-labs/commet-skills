# @commet/node SDK Reference

## Initialization

```typescript
import { Commet } from "@commet/node";

const commet = new Commet({
  apiKey: string,          // Required. Format: ck_xxx
  apiVersion?: string,     // Pin requests to a specific API version
  debug?: boolean,         // Log requests/responses
  timeout?: number,        // Request timeout in ms (default: 30000)
  retries?: number,        // Auto-retry on 408/429/5xx (default: 3)
  telemetry?: boolean,     // Set false to disable client telemetry
});
```

There is no `environment` option: the organization behind the API key decides sandbox vs live. A sandbox organization's key only touches sandbox data.

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
await commet.customers.get({ id: "cus_xxx" });

// Update
await commet.customers.update({ id: "cus_xxx", email: "new@example.com" });

// List with filters
const { data, hasMore, nextCursor } = await commet.customers.list({
  externalId: "user_123",
  limit: 25,
});

```

### commet.plans

```typescript
// List public plans
const { data: plans } = await commet.plans.list();

// Include private plans
const { data: all } = await commet.plans.list({ includePrivate: true });

// Get plan by public ID
const plan = await commet.plans.get({ id: "pln_xxx" });
// plan.prices include public IDs, market prices, and automatic offer IDs
// plan.features use typed feature and overage fields
```

**Plan types:**
```typescript
interface Plan {
  id: PlanID;           // pln_xxx
  code: string;         // "pro", "enterprise"
  name: string;
  prices: PlanPrice[];
  features: PlanFeature[];
}
```

### commet.subscriptions

Each customer can only have ONE active subscription.

```typescript
// Create subscription -> returns checkoutUrl for payment
const sub = await commet.subscriptions.create({
  customerId: "user_123",     // your ID or cus_xxx
  planCode: "pro",            // or planId: "pln_xxx"
  billingInterval: "monthly",
  priceId: "pp_xxx",          // optional explicit base price or variant
  offerId: "ofr_xxx",         // optional direct Offer
  initialSeats: { editor: 5 },
  successUrl: "https://app.example.com/billing",
});
// sub.checkoutUrl -> redirect user here for payment

// Get active subscription
const active = await commet.subscriptions.getActive({ customerId: "user_123" });
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

**Subscription statuses:** `draft`, `pending_payment`, `trialing`, `active`, `past_due`, `canceled`.

### commet.usage

Track consumption events for metered features. Two modes: value-based (standard) and token-based (AI models).

```typescript
// Track value-based event (standard metered usage)
await commet.usage.track({
  customerId: "user_123",     // your ID or cus_xxx
  featureCode: "api_calls",   // feature.code from your plan
  value: 1,
  eventId: "usage_xxx",       // stable logical event identity
  properties: [{ property: "route", value: "/reports" }],
}, { idempotencyKey: "request_xxx" });

// Track AI model token usage (balance model with AI pricing)
await commet.usage.track({
  customerId: "user_123",
  featureCode: "ai_generation",
  model: "anthropic/claude-3-opus",  // provider/modelId
  inputTokens: 1000,
  outputTokens: 500,
  cacheReadTokens: 100,
  cacheWriteTokens: 50,
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
const balance = await commet.seats.getBalance({ customerId: "user_123", featureCode: "editor" });
// balance.current: number, balance.asOf: string

// Get all balances
const all = await commet.seats.getAllBalances({ customerId: "user_123" });
// { editor: { current: 10, asOf: "..." }, viewer: { current: 50, asOf: "..." } }
```

### commet.featureAccess

Check a customer's feature access without parsing subscription data.

```typescript
// Get detailed feature info
const access = await commet.featureAccess.get({
  code: "team_members",
  customerId: "user_123",
});
// access is discriminated by type and consumption model

// Check a prospective consumption
const check = await commet.usage.check({
  featureCode: "api_calls",
  customerId: "user_123",
  quantity: 1,
});
// check.allowed plus model-specific cost and remaining fields

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
const portal = await commet.portal.getUrl({ customerId: "user_123" });

// By email
const portalByEmail = await commet.portal.getUrl({ email: "user@example.com" });

// portal.portalUrl -> redirect user here
```

### commet.creditPacks

```typescript
const { data: packs } = await commet.creditPacks.list();
// [{ id, name, description, credits, price, currency }]
```

### commet.markets and selectable prices

Markets map reusable country sets to price overrides. Currency pricing and market pricing coexist.

```typescript
const market = await commet.markets.create({
  name: "South Asia",
  countryCodes: ["IN", "PK", "BD", "LK"],
});

const basePrice = await commet.plans.addPrice({
  id: "pln_xxx",
  billingInterval: "monthly",
  price: 1000,
  isDefault: true,
  marketPrices: [
    { marketGroupId: market.id, currency: "usd", price: 800 },
  ],
});

const variant = await commet.plans.addPrice({
  id: "pln_xxx",
  billingInterval: "monthly",
  inheritsFromPriceId: basePrice.id,
  metadata: { name: "Experiment B" },
  marketPrices: [
    { marketGroupId: market.id, currency: "usd", price: 600 },
  ],
});

await commet.subscriptions.create({
  customerId: "user_123",
  planId: "pln_xxx",
  priceId: variant.id,
});
```

Omit `priceId` to use the default base price. A variant inherits its base price in every market it does not override. A subscription keeps the selected price identity; renewals use that price's current catalog value. Archiving hides a price from new selection without breaking subscriptions already bound to it.

### commet.offers

Offers are independent reusable phase sequences. They do not contain a purpose or plan-price associations. Introductory, direct Promotional, and Promo Code are selection channels.

```typescript
const offer = await commet.offers.create({
  name: "Launch experiment B",
  phases: [
    { type: "free_trial", durationDays: 14 },
    { type: "percentage", durationCycles: 3, percentage: 2500 },
  ],
  metadata: { experiment: "launch", variant: "B" },
});

await commet.subscriptions.create({
  customerId: "user_123",
  planId: "pln_xxx",
  offerId: offer.id,
});
```

Attach a compatible Offer to one base price in the Dashboard for automatic introductory selection. Passing `offerId` applies an Offer directly and overrides the automatic Intro. Promo Codes can reference only an Offer with exactly one `percentage` or `amount_off` phase. Experiment assignment belongs to the caller.

Accepted phases are stored in an immutable Offer Application. The v9 response exposes its target through `appliesTo`; current public subscription channels create `plan_price` applications.

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

Use `webhooks.on(event, handler)` for typed dispatch. The generated event catalog includes subscription, trial, checkout, payment, invoice, customer, usage, quota, seat, add-on, and payout events.

## Response Format

Successful singular operations return the resource or action result directly. List operations use one pagination envelope:

```typescript
const customer = await commet.customers.get({ id: "cus_xxx" });
const { data, hasMore, nextCursor } = await commet.customers.list();
```

Failures throw typed SDK errors. Do not look for `success` or `error` on successful values.

## CLI

```bash
commet login          # Authenticate with Commet (browser device-code flow)
commet logout         # Logout
commet link           # Link project to an organization (--org <slug-or-id> to switch, --clear to unlink)
commet orgs           # List organizations you have access to
commet pull           # Sync remote billing config -> commet.config.ts
commet push           # Push commet.config.ts changes -> remote
commet listen <url>   # Forward webhook events to a local server
commet create [name]  # Scaffold new project from template
```

`commet pull` writes your features and plans to `commet.config.ts` (config as code); edit the file and run `commet push` to apply changes. Per-resource commands (`commet customers`, `commet subscriptions`, `commet plans`, `commet usage`, ...) mirror the SDK from the terminal.

### Templates (`commet create`)

| Template | Description |
|----------|-------------|
| `fixed` | Fixed subscriptions with boolean features |
| `seats` | Per-seat billing for team collaboration |
| `metered` | Usage-based billing with included amounts and overage |
| `credits` | Credit-based consumption with packs and top-ups |
| `balance-ai` | AI products with automatic token cost tracking and margin |
| `balance-fixed` | Prepaid balance with fixed unit prices |
