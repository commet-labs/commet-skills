---
name: ai-billing
description: Use when billing for AI model token usage — setting up @commet/ai-sdk tracked() middleware, configuring balance consumption model plans with AI model pricing, tracking input/output/cache tokens, cost calculation with margins, or building AI products that need usage-based billing.
license: MIT
metadata:
  author: commet
  version: "1.0.0"
  homepage: https://commet.co
  source: https://github.com/commet-labs/commet-skills
inputs:
  - name: COMMET_API_KEY
    description: Commet API key (ck_xxx format)
    required: true
references:
  - tracked-middleware.md
  - cost-calculation.md
  - balance-model.md
---

# AI Billing

## Quick Start

Wrap any Vercel AI SDK model with `tracked()` to automatically bill for token usage:

```typescript
import { Commet } from "@commet/node";
import { tracked } from "@commet/ai-sdk";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

const commet = new Commet({ apiKey: process.env.COMMET_API_KEY! });

const result = await generateText({
  model: tracked(anthropic("claude-sonnet-4-20250514"), {
    commet,
    feature: "ai_generation",
    customerId: "user_123",
  }),
  prompt: "Explain quantum computing",
});
// Tokens tracked, cost calculated, balance deducted. Done.
```

That's it. `tracked()` intercepts the model response, reports `inputTokens`, `outputTokens`, `cacheReadTokens`, and `cacheWriteTokens` to Commet, which calculates cost from the AI model catalog and deducts from the customer's balance.

## How It Works

```
Your app                    Commet                         AI Provider
   |                          |                                |
   |-- tracked(model) ------->|                                |
   |                          |                                |
   |-- generateText() --------|-------- API call ------------->|
   |                          |                                |
   |<-- tokens + response ----|<------- response --------------|
   |                          |                                |
   |                          |-- resolve model price          |
   |                          |-- apply margin                 |
   |                          |-- deduct from balance          |
   |                          |-- record ledger entry          |
   |                          |                                |
   |<-- result (unchanged) ---|                                |
```

## Balance Model Overview

AI billing uses the **balance** consumption model. Customers get a dollar balance (e.g., $10.00/month) that depletes as they use AI features. When the balance reaches zero, behavior depends on configuration:

- `blockOnExhaustion = true`: API returns 402, customer must top up or wait for renewal
- `blockOnExhaustion = false`: Usage continues, overage charged at period end

Balance resets to `includedBalance` at each billing period renewal.

## Cost Formula

All values use **rate scale** (10000 = $1.00) for sub-cent precision:

```
inputCost    = ceil(inputTokens    x inputPricePerMillionTokens    / 1,000,000)
outputCost   = ceil(outputTokens   x outputPricePerMillionTokens   / 1,000,000)
subtotal     = inputCost + outputCost + cacheReadCost + cacheWriteCost
marginAmount = ceil(subtotal x margin / 10000)
total        = subtotal + marginAmount
```

Margin is configured per feature per plan in basis points (2000 = 20% markup). All costs use `Math.ceil()` to prevent underbilling.

## Key Gotchas

| # | Gotcha | Detail |
|---|--------|--------|
| 1 | **Feature must be `pricingMode: "ai_model"`** | Configure this in the Commet dashboard before tracking works |
| 2 | **Model must exist in the catalog** | Commet syncs models from AI Gateway automatically, but verify your model is listed |
| 3 | **Tracking is non-blocking** | If token reporting fails, the AI response still returns. Use `onTrackingError` to catch failures |
| 4 | **Balance deduction is real-time** | Cost is deducted immediately, not at period end |
| 5 | **Rate scale, not cents** | Token prices and costs use rate scale (10000 = $1.00), not settlement scale (100 = $1.00) |
| 6 | **Margin is per feature per plan** | Different plans can have different markups on the same AI feature |

## What Do You Need?

| Task | Reference |
|------|-----------|
| **Set up tracked() middleware** | [tracked-middleware.md](references/tracked-middleware.md) -- installation, streaming, multiple models, error handling |
| **Understand cost calculation** | [cost-calculation.md](references/cost-calculation.md) -- AI model catalog, pricing, margins, multi-currency |
| **Configure balance model** | [balance-model.md](references/balance-model.md) -- how balance works, exhaustion, top-ups, choosing the right model |

## Prerequisites

1. Feature configured with `pricingMode: "ai_model"` in the Commet dashboard
2. Plan using the **balance** consumption model
3. Margin configured on the plan feature (0 basis points = pass-through cost)
4. Customer with an active subscription to that plan

## Common Setup

### API Key

Store in environment variable:

```bash
export COMMET_API_KEY=ck_xxxxxxxxx
```

### Install

```bash
npm install @commet/node @commet/ai-sdk
```

## Error Handling Quick Reference

| Code | Condition | Action |
|------|-----------|--------|
| 402 | Insufficient balance | Customer needs to top up or upgrade plan |
| 403 | Feature not in plan | Check customer's subscription includes the AI feature |
| 404 | Model not in catalog | Verify the model ID matches the catalog (e.g., `claude-sonnet-4-20250514`) |
| 422 | Missing required fields | `inputTokens` is required when `model` is provided |
