# Billing - Automatic Invoicing

Convert **subscriptions into invoices** automatically.

## Billing Operations

| Operation | When | Description |
|-----------|------|-------------|
| **Billing Cycle** | Periodic cron job | Regular invoicing of active subscriptions |
| **Initial Charge** | New paid subscription | First invoice when customer subscribes |
| **Trial Setup** | New trial subscription | Setup checkout (no charge), collects payment method |
| **Plan Change** | Upgrade/Downgrade | Prorated invoice when changing plans |

## Directory Structure

```
modules/billing/
├── engine/
│   ├── billing-engine.ts            # Main orchestrator
│   ├── billing-period.ts            # Period calculations
│   ├── plan-change-service.ts       # Plan upgrades/downgrades with proration
│   ├── pricing-engine.ts            # Overage calculations
│   ├── invoice-builder.ts           # Invoice line construction
│   ├── trial-handler.ts             # Trial subscription logic
│   └── calculators/
│       ├── calculator-registry.ts   # Calculator selection
│       ├── metered-calculator.ts    # Usage-based billing
│       ├── seats-calculator.ts      # Seat billing (advance + true-up)
│       ├── credits-calculator.ts    # Credit consumption
│       └── balance-calculator.ts    # Balance deduction
├── lib/
│   ├── data/
│   │   ├── billing-queries-interface.ts / billing-queries-drizzle.ts
│   │   └── billing-repository-interface.ts / billing-repository-drizzle.ts
│   ├── billing-factory.ts
│   ├── proration-service.ts
│   └── initial-charge.ts          # processInitialCharge + processTrialSetup
├── types.ts
└── index.ts
```

## Calculator Resolution

- `boolean` → no calculator (no billing)
- `seats` → SeatsCalculator (always)
- `metered` + metered plan → MeteredCalculator
- `metered` + credits plan → CreditsCalculator
- `metered` + balance plan → BalanceCalculator

## Processing Flow

Cron fires monthly for all subscriptions. `isBillingMonth()` determines full invoice vs reset-only.

Free plan subscriptions (`billingInterval = null`) are skipped entirely by the billing engine.

```
processBillingCycle(customer)
    ├── 1. getActiveSubscription()
    ├── 1b. if !billingInterval → skip (free plan)
    ├── 2. TrialHandler.handle() → skip if in trial, activate if expired
    ├── 3. executePendingEvents() → apply scheduled changes
    ├── 4. calculateBillingPeriod()
    ├── 5. createBillingContext() → plan, price, features + currency resolution
    ├── 6. isBillingMonth(subscription, processingDate)
    │   ├── YES (billing month — full cycle):
    │   │   ├── 7. calculateFeatureCharges() — usage period = 1 month
    │   │   ├── 8. buildInvoiceLines() — plan_base + features + discounts + seats
    │   │   ├── 9. saveInvoice()
    │   │   ├── 10. resetBalanceIfNeeded()
    │   │   └── 11. createFeatureSnapshot()
    │   └── NO (non-billing month — reset + overage only):
    │       ├── 7. calculateOverageOnlyCharges() — metered/balance only, skip seats
    │       ├── 8. if overage > $0: buildInvoiceLines(includePlanBase: false) → saveInvoice()
    │       ├── 9. resetBalanceIfNeeded()
    │       └── 10. createFeatureSnapshot()
```

`isBillingMonth` logic: monthly → always true, quarterly → 3+ months since lastBilledAt, yearly → 12+ months.

## Currency Resolution

Step 5 resolves all prices based on `subscription.currency` by querying regional pricing tables. If `subscription.currency = "usd"` or no regional row exists, base USD price is used.

## Billing by Consumption Model

| Model | What Gets Billed |
|-------|------------------|
| **Metered** | Plan base + usage overage + seats + addon base |
| **Credits** | Plan base + seats + addon base (no overage, blocks when exhausted) |
| **Balance** | Plan base + balance overage (if allowed) + seats + addon base |

## Invoice Line Types

| Type | Description |
|------|-------------|
| `plan_base` | Base plan price (advance) |
| `feature_overage` | Exceeded usage of metered features |
| `feature_seats` | Seat charges (advance or true-up) |
| `discount` | Applied discount (intro offer or promo code) |
| `promo_code_discount` | Reserved for future billing engine separation |
| `credit` | Customer credit applied |
| `balance_overage` | Balance model overage when blockOnExhaustion=false |
| `addon_base` | Addon recurring charge |

All line amounts in subscription's currency.

## Monthly Resets (Independent of Billing Interval)

All quotas reset monthly regardless of billing interval. `includedBalance` and `includedCredits` on `plan_price` are always **monthly** values.

| Model | Monthly Reset |
|-------|--------------|
| **Metered** | Usage window = 1 month, overage charged monthly |
| **Credits** | `planCredits` → `includedCredits` (monthly value), `purchasedCredits` remain |
| **Balance** | `currentBalance` → `includedBalance` (monthly value) |

### Non-Billing Month Behavior

| Model | Non-Billing Month |
|-------|------------------|
| **Metered** | Mini-invoice with overage only (no plan_base, no seats) |
| **Credits** | Reset only, no invoice (credits block when exhausted) |
| **Balance (block)** | Reset only, no invoice |
| **Balance (overage)** | Mini-invoice if overage > $0, otherwise reset only |

Seats are billed only on billing months (advance for the full interval).

## Subscription Creation Entry Points

Three entry points create subscriptions. All must follow the same branching logic:

```
if (hasTrial)        → processTrialSetup()
else if (isFree)     → activateFreePlanSubscription()
else                 → processInitialCharge()
```

1. `modules/onboarding/actions/create-subscription-action.ts`
2. `app/api/subscriptions/route.ts` (SDK API)
3. `modules/customer/detail/actions/assign-plan-action.ts`

## Billing Cron — Trial Expiry

The cron has a **separate query** for expired trials (`status = "trialing" AND trialEndsAt <= orgTime`), independent of the normal `billingDayOfMonth` query. Trials can expire any day, not just on billing day.
