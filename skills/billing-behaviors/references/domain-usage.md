# Usage - Consumption & Billing Models

## Consumption Models (mutually exclusive per plan)

| Model | For whom | Behavior |
|-------|----------|----------|
| **Metered** | Traditional SaaS | Charges overage at end of period |
| **Credits** | AI products | Blocks when exhausted, can buy packs |
| **Balance** | Platforms | $X to spend on any feature |

## Metered Model

Included units free, overage charged at period end. Never blocks.

## Credits Model

X credits/month included. Blocks when balance = 0. Plan credits reset each period, purchased credits never expire. Consumption order: plan credits first, then purchased.

### Credit Packs
Purchasable via Customer Portal. Applied immediately.

## Balance Model

$X included balance. Behavior on exhaustion configurable: `blockOnExhaustion = false` (default, charges excess) or `true` (blocks). Top-ups via Customer Portal.

## Usage Events

```
SDK: commet.usage.track({
  feature: "api_calls",    // feature.code
  customerId: "cus_xxx",
  value: 1,
  idempotencyKey: "req_abc123"
})
```

## AI Token Tracking

Usage events support AI-specific fields for token-based billing:

```
SDK: commet.usage.track({
  feature: "ai_generation",
  customerId: "cus_xxx",
  model: "anthropic/claude-3-opus",
  inputTokens: 1000,
  outputTokens: 500,
  cacheReadTokens: 100,
  cacheWriteTokens: 50
})
```

When `model` is provided, `inputTokens` and `outputTokens` are required. Costs are calculated from the AI model catalog with configurable margins per feature. See [domain-ai-costs.md](domain-ai-costs.md) for full details.

Token costs are stored in `usage_event_cost` (one-to-one with `usage_event`). For balance model subscriptions, costs are deducted from balance in real-time.

## Subscription Balance

### Credits Model
- `planCredits`: Reset each period
- `purchasedCredits`: Never expire

### Balance Model
- `currentBalance`: Reset each period

All changes recorded in `credit_balance_ledger`: consumption, purchase, topup, reset, adjustment.
