# AI Costs - Token-Based Pricing & Tracking

AI cost tracking enables billing for AI model usage with per-token pricing and configurable margins.

## AI Model Catalog

### ai_model_catalog Table

| Field | Type | Purpose |
|-------|------|---------|
| `provider` | text | AI provider (e.g., "anthropic", "openai") |
| `modelId` | text | Model identifier (e.g., "claude-3-opus") |
| `displayName` | text | Human-readable name |
| `inputPricePerMillionTokens` | bigint | Input token cost in rate scale (10000 = $1.00) |
| `outputPricePerMillionTokens` | bigint | Output token cost in rate scale |
| `cacheReadPricePerMillionTokens` | bigint | Cache read cost (nullable) |
| `cacheWritePricePerMillionTokens` | bigint | Cache write cost (nullable) |
| `isActive` | boolean | Whether model is available |
| `lastSyncedAt` | timestamp | Last sync from AI Gateway |

Unique on `(provider, modelId)`.

### ai_model_price_history Table

Audit trail of all price changes. Same price fields as catalog, plus `aiModelCatalogId` FK and `syncedAt` timestamp. History entries created only when a model is new or its prices change.

## Model Synchronization

Cron job (`sync-ai-models`) syncs from AI Gateway:

1. Fetch `https://ai-gateway.vercel.sh/v3/ai/config`
2. Filter language models only
3. Convert per-token prices to rate scale: `Math.round(perTokenPrice × 1_000_000 × 10000)`
4. Upsert into catalog (ON CONFLICT DO UPDATE)
5. Record price history if prices changed

## Usage Event Cost Tracking

### usage_event_cost Table

| Field | Type | Purpose |
|-------|------|---------|
| `usageEventId` | FK (unique) | One-to-one with usage_event |
| `model` | text | Model used (e.g., "anthropic/claude-3-opus") |
| `inputTokens` | integer | Input tokens consumed |
| `outputTokens` | integer | Output tokens produced |
| `cacheReadTokens` | integer | Cache hit tokens (default 0) |
| `cacheWriteTokens` | integer | Cache write tokens (default 0) |
| `inputCost` | bigint | Input cost in rate scale |
| `outputCost` | bigint | Output cost in rate scale |
| `cacheReadCost` | bigint | Cache read cost in rate scale |
| `cacheWriteCost` | bigint | Cache write cost in rate scale |
| `subtotal` | bigint | Sum of all token costs |
| `margin` | integer | Markup in basis points (10000 = 100%) |
| `marginAmount` | bigint | Calculated margin amount |
| `total` | bigint | subtotal + marginAmount |
| `currency` | text | Subscription currency |

Cost records only exist for AI model pricing features. Regular metered/balance features have no cost record.

## Cost Calculation

```
inputCost = Math.ceil(inputTokens × inputPricePerMillionTokens / 1_000_000)
outputCost = Math.ceil(outputTokens × outputPricePerMillionTokens / 1_000_000)
cacheReadCost = Math.ceil(cacheReadTokens × cacheReadPricePerMillionTokens / 1_000_000)
cacheWriteCost = Math.ceil(cacheWriteTokens × cacheWritePricePerMillionTokens / 1_000_000)
subtotal = inputCost + outputCost + cacheReadCost + cacheWriteCost
marginAmount = Math.ceil(subtotal × margin / 10000)
total = subtotal + marginAmount
```

All costs use `Math.ceil()` to prevent underbilling.

## Margin

Stored as basis points on `plan_feature.margin`:
- 0 = 0% markup
- 100 = 1%
- 2000 = 20%
- 10000 = 100%

Configured per feature per plan. Enables different margins for different customers/plans.

## Usage API with AI Fields

```
POST /api/usage/events
{
  feature: "ai_generation",
  model: "anthropic/claude-3-opus",
  inputTokens: 1000,
  outputTokens: 500,
  cacheReadTokens: 100,
  cacheWriteTokens: 50,
  customerId: "cus_abc123"
}
```

When `model` is provided, `inputTokens` and `outputTokens` are required.

## Balance Model Integration

For balance-based subscriptions with AI features:

1. Calculate total cost (including margin)
2. Check if balance sufficient (if `blockOnExhaustion` enabled)
3. Deduct from `subscription_balance.currentBalance`
4. Record ledger entry (type = "consumption", balanceType = "money_balance")
5. Ledger description includes: feature code, model name, token counts

If balance goes negative and `blockOnExhaustion = false`, overage is charged at period end via the balance calculator's backward attribution algorithm.

## Model Resolution

`resolveAIModelPrice()` accepts:
- `"anthropic/claude-3-opus"` → splits into provider + modelId
- `"claude-3-opus"` → searches by modelId only

Returns 404 if model not found or inactive.

## Multi-Currency

- AI model prices are global (same for all currencies in rate scale)
- Balance deductions happen in subscription currency
- Ledger entries stored in subscription currency
- Exchange rates apply to plan pricing, not to AI token costs directly

## Billing Engine Integration

At period end, balance calculator:
1. Queries ledger entries for the period (type = "consumption")
2. Computes per-feature breakdown of negative balance
3. For AI features: creates `feature_overage` invoice line
4. Overage amount already includes margin (calculated at usage time)

## Error Handling

| Code | Condition |
|------|-----------|
| 422 | `inputTokens` required when `model` provided |
| 404 | Model not found in catalog |
| 403 | Feature not in plan or disabled |
| 402 | Insufficient balance (blockOnExhaustion enabled) |
