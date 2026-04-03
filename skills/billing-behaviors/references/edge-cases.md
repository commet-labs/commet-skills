# Edge Cases

## Trial Ending with Changed Price

Price in effect when trial ends is used. Trial is not a price commitment.

## Reactivating Canceled Subscription

New subscription at current price. No intro offer (had subscription before). Deprecated plan (`isPublic = false`) cannot be re-subscribed.

## Paused Subscription and Changes

On resume: price in effect at time of resuming. Pause does not freeze the price.

## Payment Failure

Status → `past_due`. Access maintained (grace period). 2 retries during that day. If not paid → `canceled`.

## Payment Failure with Credits/Balance

| Aspect | Behavior |
|--------|----------|
| Status | Changes to `past_due` |
| Credits/Balance | **Maintained** during grace period |
| If not paid | Status = `canceled`, plan credits/balance = 0 |
| Purchased credits | **Preserved** even on cancellation |

## Credits: Exhausted Mid-Period

**Immediate block**. Purchase pack from Portal → available immediately. No grace period.

## Credits: Reactivation with Purchased Credits

Plan credits reset to new plan's value. Purchased credits **restored** (never expire, not even with cancellation).

## Balance: Exhausted with blockOnExhaustion=true

**Immediate block**. Top-up from Portal → available immediately.

## Balance: Exhausted without blockOnExhaustion

Keeps working. Excess charged at end of period.

## Upgrade Same Day as Billing (Day 1)

Credit ~100% of old plan. Pays price difference.

## Upgrade Last Day of Period

Minimal credit. Period restarts.

## Multiple Upgrades in Same Period

Each calculated independently. No accumulation.

## Upgrade Then Request Downgrade

Downgrade scheduled for end of period. No refund for upgrade.

## Credits: Upgrade with Only Purchased Credits

```
planCredits=0, purchasedCredits=100
Credit = $0 (plan credits = 0)
Purchased credits intact, don't affect proration.
```

## Balance: Upgrade with Negative Balance

```
currentBalance = -$15 (exceeded)
Credit = $0
Pending overage = $15 charged on upgrade
New balance = reset to includedBalance
```

## Consumption Model Change

Only between different plan groups. Within same group, all plans must have same model. Changes require manual intervention or cancel + new subscription.

## Currency at Checkout

Auto-detected from billing address country. No regional price → fallback USD. `subscription.currency` immutable after payment. Failed retry → currency re-resolved, session reset to pending.

## Non-USD Payment Processing

`grossAmount` = USD from Stripe's `balanceTransaction.amount`. `presentmentAmount` = local currency from `charge.amount`. Fee calculated on USD gross, never on presentment.

## Summary: System Events

| Event | Behavior |
|-------|----------|
| Trial ends | Price in effect at end |
| Intro offer ends | Normal price automatically |
| Reactivate canceled | New subscription, current price, no intro offer |
| Resume paused | Price in effect at resume |
| Payment failure | Grace period, then cancels |
| Credits exhausted | Immediate block, purchase pack |
| Balance exhausted (block=true) | Immediate block, top-up |
| Balance exhausted (block=false) | Keeps working, charges excess |
| Credit pack purchase | Immediate |
| Balance top-up | Immediate |
| Cancel with purchased credits | Preserved for reactivation |
| Currency at checkout | Auto from billing address, fallback USD |
| Non-USD payment | Fees on USD settlement, not presentment |
