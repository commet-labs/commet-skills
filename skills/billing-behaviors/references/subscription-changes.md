# Subscription Changes

Rules for when the **customer** changes plans or billing interval from the Customer Portal. Only applies within the same Plan Group.

## Upgrade (More Expensive Plan)

| Aspect | Behavior |
|--------|----------|
| When applied | **Immediately** |
| Period | Restarts from change date |
| Allocations | Reset to new plan (credits, balance, usage) |

### Proration: Credit Calculation

Credit is always **time-based**, regardless of consumption model. This is the simplest and fairest approach: you paid for N days, used M, we refund the rest proportionally.

| Formula | `(remainingDays / totalDays) × effectivePrice` |
|---------|------------------------------------------------|

`effectivePrice` accounts for intro offers (credit based on what was actually paid, not list price). Seats proration uses the same formula on the seats charge.

### Proration: New Plan Charge

Upgrades reset billing period to full new cycle. New plan **always charged at full price**.

### Example - Metered

```
Current plan: Starter $29/mo (paid January 1)
New plan: Pro $99/mo
Change date: January 15 (15 days remaining of 30)

Credit: $29 × (15/30) = $14.50
Charge: $99 (full, period resets to Jan 15 - Feb 15)
Charged: $84.50
```

### Example - Credits

```
Current plan: Starter $20/mo, 500 credits (paid Jan 1)
Customer: planCredits = 0, purchasedCredits = 30
Change date: January 15 (15 days remaining of 30)
Upgrade to: Pro $40/mo, 1000 credits

Credit: $20 × (15/30) = $10 (time-based, regardless of credits consumed)
Charge: $40 (full, period resets)
Charged: $30

Result:
├── planCredits: 1000 (reset)
└── purchasedCredits: 30 (intact)
```

### Example - Metered with Pending Overage

```
Current plan: Starter $29/mo, 10K calls, $0.02/extra
Customer used: 15K calls (5K overage)
Upgrade to: Pro $99/mo, 100K calls, $0.01/extra

Plan credit: $29 × (15/30) = $14.50
Pending overage: 5K × $0.02 = $100 (old price)
New charge: $99 (full, period resets)
Charged: $99 - $14.50 + $100 = $184.50
```

### Complete Example - Credits + Seats + Boolean

```
Starter plan $29/mo (Credits model, paid Jan 1):
├── 50 included credits
├── 5 included seats, $25/extra
└── SSO: ❌

Customer state (day 15, 15 days remaining of 30):
├── planCredits = 10 (used 40)
├── purchasedCredits = 20
├── seats = 8 (3 extras = $75/mo)

Upgrade to Pro plan $99/mo:
├── 200 included credits
├── 10 included seats, $20/extra
└── SSO: ✅

CALCULATION:
├── Plan credit: (15/30) × $29 = $14.50 (time-based)
├── Extra seats credit: (15/30) × $75 = $37.50
├── New plan charge: $99 (full, period resets)
└── Charged: $99 - $14.50 - $37.50 = $47.00
```

## Downgrade (Cheaper Plan)

| Aspect | Behavior |
|--------|----------|
| When applied | **At end of current period** |
| During current period | Customer keeps current plan and features |
| Credit | None (already paid, enjoys until end) |
| At renewal | Changes to new plan with new price |

## Billing Interval Change (Same Plan)

| Change | Behavior |
|--------|----------|
| Monthly → Yearly | **Immediate** (commitment upgrade, better price) |
| Yearly → Monthly | **At end of period** (commitment downgrade) |

## Downgrade with Seats Exceeding New Limit

Allow with clear warning. Customer sees: X active seats, new plan includes Y, extra seats cost Z.

## Downgrade with Usage Exceeding New Limit

Allow with warning showing estimated overage costs at new plan pricing.

## Upgrade + Interval Change Simultaneously

Treated as normal upgrade (more expensive = immediate).

## Downgrade + Interval Change Simultaneously

Treated as downgrade (cheaper = at renewal). Customer enjoys full period.
