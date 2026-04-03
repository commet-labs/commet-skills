# Balance Model

The balance consumption model gives customers a dollar amount to spend on AI usage each billing period. It is the recommended model for AI token-based billing.

## How Balance Works

1. Customer subscribes to a plan with the balance consumption model
2. Plan defines an `includedBalance` (e.g., $10.00 in rate scale = 100000)
3. Each AI usage event deducts the calculated cost (including margin) from `currentBalance`
4. Balance depletes toward zero as the customer uses AI features
5. At period renewal, balance resets to `includedBalance`

```
Period start: currentBalance = 100000 ($10.00)
    |
    |-- AI call: -126 rate units ($0.0126)
    |   currentBalance = 99874
    |
    |-- AI call: -84 rate units ($0.0084)
    |   currentBalance = 99790
    |
    |-- ... more usage throughout the period ...
    |
    |-- AI call: -200 rate units ($0.02)
    |   currentBalance = 1500
    |
Period end: invoice for any overage
Period start: currentBalance = 100000 (reset)
```

## Exhaustion Behavior

When `currentBalance` reaches zero, behavior depends on the `blockOnExhaustion` setting:

### blockOnExhaustion = true (strict)

The API returns **402 Insufficient Balance** when balance is exhausted. The customer must top up or wait for the next billing period.

Use this when you want hard spending limits. The customer cannot exceed their included balance without explicitly purchasing more.

**Important nuance with `tracked()`:** Because `tracked()` is non-blocking middleware, the AI call itself still executes (the model already ran before the balance check). The 402 is reported via `onTrackingError`. To truly block AI calls when balance is exhausted, check balance before calling the AI model:

```typescript
// Check balance before making the AI call
const balance = await commet.subscriptions.getBalance(customerId, "ai_generation");

if (balance.currentBalance <= 0) {
  return new Response("Insufficient balance. Please top up.", { status: 402 });
}

// Safe to proceed
const result = await generateText({
  model: tracked(anthropic("claude-sonnet-4-20250514"), {
    commet,
    feature: "ai_generation",
    customerId,
  }),
  prompt: userMessage,
});
```

### blockOnExhaustion = false (lenient)

Usage continues even when balance is negative. Overage is charged at period end via the billing engine's backward attribution algorithm. The `feature_overage` invoice line covers the negative balance.

Use this when you want a soft limit -- the included balance acts as a budget indicator, not a hard cap. Good for enterprise customers where you do not want to interrupt service.

## Top-Ups

Customers can purchase additional balance at any time. Top-ups are applied **immediately** to `currentBalance`.

Key behavior:
- Top-up amount adds to the current balance
- At renewal, balance resets to `includedBalance` (top-up is not preserved)
- Top-ups are one-time purchases, not recurring

If a customer tops up $5.00 and their `includedBalance` is $10.00:

```
Before top-up: currentBalance = 2000 ($0.20 remaining)
After top-up:  currentBalance = 52000 ($5.20)
At renewal:    currentBalance = 100000 ($10.00, reset to includedBalance)
```

## Plan Changes

| Change | Balance Behavior |
|--------|-----------------|
| **Upgrade** | Reset to new plan's `includedBalance` immediately |
| **Downgrade** | Reset to new plan's `includedBalance` at renewal |
| **Cancellation** | Balance is lost |
| **Reactivation** | Reset to `includedBalance` |
| **Pause** | Balance is lost; on resume, reset to `includedBalance` |

Top-ups are part of the current balance and follow the same rules. They are not tracked separately like purchased credits in the credits model.

## Balance vs. Credits vs. Metered for AI

Plans use ONE consumption model. Here is when to use each for AI billing:

### Balance (recommended for AI)

```
Customer pays $99/month, gets $10.00 of AI usage included.
Each AI call costs based on actual token pricing + margin.
If they exceed $10.00, either blocked or charged overage.
```

**Why it fits AI:** Token costs vary by model and request size. A dollar balance naturally maps to variable-cost usage. The customer thinks in dollars spent, not abstract units.

**Best for:** Products where AI is a core feature with variable per-request cost.

### Credits

```
Customer pays $99/month, gets 1000 credits.
Each AI call costs N credits (fixed per-call or based on creditsPerUnit).
When credits run out, customer buys a credit pack or waits for renewal.
```

**Why it sometimes fits:** Simpler mental model for customers ("you have 100 AI generations left"). But requires mapping variable token costs to fixed credit amounts, which either underbills or overbills depending on actual token usage per request.

**Best for:** Products where AI calls are roughly uniform in cost and you want a simpler "N generations remaining" UX.

### Metered

```
Customer pays $99/month base.
AI usage tracked throughout the period.
Total usage charged at period end (true-up).
```

**Why it's less ideal for AI:** No real-time balance feedback. Customer has no visibility into accumulating costs until the invoice arrives. This can lead to bill shock.

**Best for:** B2B products where usage is predictable and customers accept post-period billing (similar to cloud infrastructure billing).

## Ledger

Every balance deduction creates a ledger entry:

| Field | Value |
|-------|-------|
| `type` | `consumption` |
| `balanceType` | `money_balance` |
| `amount` | Negative (cost deducted) |
| `description` | Includes feature code, model name, token counts |
| `currency` | Subscription currency |

The ledger provides a complete audit trail of all balance changes: initial allocation, consumption, top-ups, and resets.

## includedBalance Changes

| Change | New Customers | Existing Customers |
|--------|---------------|---------------------|
| Increase (benefits customer) | Immediate | Immediate |
| Decrease (hurts customer) | Immediate | At renewal |

Increases apply immediately to protect customers from mid-cycle downgrades. Decreases only take effect at renewal to avoid reducing a balance the customer has already been promised.

## Pricing Configuration

A typical AI billing plan configuration:

```
Plan: "Pro"
  Base price: $99/month
  Consumption model: balance
  includedBalance: 100000 (= $10.00 in rate scale)

  Feature: "ai_generation"
    pricingMode: ai_model
    margin: 2000 (= 20%)
```

The customer pays $99/month and gets $10.00 of AI usage (at cost + 20% margin). If they use $12.00 worth of AI in a period, the $2.00 overage is handled based on `blockOnExhaustion`.
