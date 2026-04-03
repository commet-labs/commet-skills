# Plans - Pricing Packages

A plan is a pricing package that groups features with limits and prices. Plans can be **free** (`isFree = true`) or **paid**.

## Free Plans

Free plans have no prices, no billing interval, and activate immediately. `billingInterval` is null on the subscription. The billing engine skips free plan subscriptions entirely.

## Base Price (PlanPrice)

Paid plans have multiple prices (one per interval): monthly, quarterly, yearly. Free plans have no PlanPrice rows.

| Field | Purpose |
|-------|---------|
| `price` | Base price in settlement cents (100 = $1.00) |
| `trialDays` | Trial days for this interval |
| `includedBalance` | Monthly balance amount (always monthly, even on yearly prices) |
| `includedCredits` | Monthly credits amount (always monthly, even on yearly prices) |

## Introductory Offers

Welcome discounts configured per plan price.

| Field | Purpose |
|-------|---------|
| `introOfferEnabled` | Whether active |
| `introOfferDiscountType` | percentage or amount |
| `introOfferDiscountValue` | % (0-10000 basis points) or settlement cents |
| `introOfferDurationCycles` | Billing cycles |

Rules: only for customers with no previous subscriptions, lost on plan change, one per customer lifetime.

## Plan Features (PlanFeature)

- Boolean: `enabled: true/false`
- Metered/Seats: `includedAmount`, `unlimited`, `overageEnabled`, `overageUnitPrice`, `overageModel`
- Credits model: `creditsPerUnit`

## Trial

`trialDays` on plan price defines the template. Subscription calculates `trialEndsAt`.

## Public vs Private

Public = visible on pricing page. Private = operator-only, for enterprise deals.

## Regional Pricing

Per-currency prices in `plan_price_currency`, `plan_feature_currency`, `credit_pack_currency`. Unique constraint `(parentId, currency)`. Per-currency intro offers override base plan's intro offer.

## Block on Exhaustion (Balance Model)

`false` (default) = keep working, charge overage. `true` = block customer, require top-up.
