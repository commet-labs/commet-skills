# Cost Calculation

How Commet calculates the cost of AI token usage, from model catalog prices through margin application to final balance deduction.

## AI Model Catalog

Commet maintains a catalog of AI models with per-token pricing. The catalog syncs automatically from AI Gateway via a cron job (`sync-ai-models`), so new models and price changes are picked up without manual intervention.

Each catalog entry contains:

| Field | Description |
|-------|-------------|
| `provider` | AI provider (e.g., `anthropic`, `openai`) |
| `modelId` | Model identifier (e.g., `claude-sonnet-4-20250514`) |
| `inputPricePerMillionTokens` | Input token cost in rate scale |
| `outputPricePerMillionTokens` | Output token cost in rate scale |
| `cacheReadPricePerMillionTokens` | Cache read cost (nullable) |
| `cacheWritePricePerMillionTokens` | Cache write cost (nullable) |

Price changes are tracked in `ai_model_price_history` for audit purposes.

## Rate Scale

All token prices and costs use **rate scale** where 10000 = $1.00. This enables sub-cent pricing, which is essential for per-token billing where individual costs are fractions of a cent.

```
Rate scale:     10000 = $1.00
                    1 = $0.0001

Settlement scale:  100 = $1.00  (plan base prices, invoice totals, Stripe)
```

Do not confuse the two. Token pricing and cost calculations always operate in rate scale.

## Cost Formula

When `tracked()` reports token usage, Commet calculates cost as follows:

```
inputCost      = ceil(inputTokens      x inputPricePerMillionTokens      / 1,000,000)
outputCost     = ceil(outputTokens     x outputPricePerMillionTokens     / 1,000,000)
cacheReadCost  = ceil(cacheReadTokens  x cacheReadPricePerMillionTokens  / 1,000,000)
cacheWriteCost = ceil(cacheWriteTokens x cacheWritePricePerMillionTokens / 1,000,000)

subtotal     = inputCost + outputCost + cacheReadCost + cacheWriteCost
marginAmount = ceil(subtotal x margin / 10000)
total        = subtotal + marginAmount
```

All intermediate calculations use `Math.ceil()` to round up. This prevents underbilling -- every fraction of a rate unit is rounded in the provider's (your) favor.

### Worked Example

A request uses Claude Sonnet with 1,000 input tokens and 500 output tokens. Assume catalog prices of $3.00/M input and $15.00/M output, with a 20% margin:

```
Catalog prices (rate scale):
  inputPricePerMillionTokens  = 30000   ($3.00)
  outputPricePerMillionTokens = 150000  ($15.00)

Cost calculation:
  inputCost  = ceil(1000 x 30000  / 1,000,000) = ceil(30)    = 30
  outputCost = ceil(500  x 150000 / 1,000,000) = ceil(75)    = 75
  subtotal   = 30 + 75 = 105

Margin (2000 basis points = 20%):
  marginAmount = ceil(105 x 2000 / 10000) = ceil(21) = 21

Total: 105 + 21 = 126 rate units = $0.0126
```

## Margins

Margins are configured in **basis points** on `plan_feature.margin`:

| Basis Points | Percentage | Use Case |
|-------------|------------|----------|
| 0 | 0% | Pass-through cost (no markup) |
| 100 | 1% | Minimal markup |
| 2000 | 20% | Moderate markup |
| 5000 | 50% | Premium tier |
| 10000 | 100% | 2x cost |

Margins are set **per feature per plan**. This means:

- A "Pro" plan can have 20% margin on AI chat
- An "Enterprise" plan can have 10% margin on the same feature
- Different AI features on the same plan can have different margins

Margin is applied at the time of usage, not at invoice time. The balance deduction already includes the margin.

## Model Resolution

When a usage event arrives with a `model` field, Commet resolves the price:

| Format | Resolution |
|--------|------------|
| `"anthropic/claude-sonnet-4-20250514"` | Split into provider `anthropic` + modelId `claude-sonnet-4-20250514` |
| `"claude-sonnet-4-20250514"` | Search by modelId only (less specific) |

If the model is not found or is marked inactive in the catalog, the API returns 404. Always use the full `provider/modelId` format for reliable resolution.

## Usage Event Storage

Each tracked usage event creates two records:

1. **`usage_event`** -- the event itself (feature, customer, timestamp)
2. **`usage_event_cost`** -- the cost breakdown (one-to-one with usage_event)

The cost record stores:

| Field | Description |
|-------|-------------|
| `model` | Full model identifier (e.g., `anthropic/claude-sonnet-4-20250514`) |
| `inputTokens`, `outputTokens` | Token counts |
| `cacheReadTokens`, `cacheWriteTokens` | Cache token counts |
| `inputCost`, `outputCost`, `cacheReadCost`, `cacheWriteCost` | Individual costs (rate scale) |
| `subtotal` | Sum of all token costs |
| `margin` | Margin in basis points |
| `marginAmount` | Calculated margin |
| `total` | Final cost (subtotal + marginAmount) |
| `currency` | Subscription currency |

Cost records only exist for features with `pricingMode: "ai_model"`. Regular metered or balance features do not have cost records.

## Multi-Currency

AI model prices in the catalog are **global** and denominated in a single rate scale (effectively USD-based). Currency handling works as follows:

- Catalog prices are the same regardless of the customer's currency
- Balance deductions happen in the **subscription's currency**
- Ledger entries are stored in the subscription's currency
- Exchange rates apply to plan pricing (base price, included balance), not to per-token costs

This means a customer on a BRL subscription pays the same token cost in rate scale as a USD customer. The balance itself may have been purchased at a different exchange rate, but the per-token deduction is identical.

## Direct API Usage

If you are not using the Vercel AI SDK, you can report usage directly:

```typescript
// POST /api/usage/events
const response = await fetch("https://api.commet.co/api/usage/events", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.COMMET_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    feature: "ai_generation",
    model: "anthropic/claude-sonnet-4-20250514",
    inputTokens: 1000,
    outputTokens: 500,
    cacheReadTokens: 100,
    cacheWriteTokens: 50,
    customerId: "cus_abc123",
  }),
});
```

When `model` is provided, `inputTokens` and `outputTokens` are required fields. Cache token fields default to 0 if omitted.

## Billing Engine Integration

At billing period end, the balance calculator processes AI costs:

1. Queries ledger entries for the period (type = `consumption`)
2. Computes per-feature breakdown of any negative balance
3. For AI features with overage: creates `feature_overage` invoice line
4. Overage amount already includes margin (calculated at usage time, not invoice time)

The customer is never double-charged for margin. Margin is baked into the balance deduction at the moment of usage, and the same total flows through to the invoice if overage occurs.
