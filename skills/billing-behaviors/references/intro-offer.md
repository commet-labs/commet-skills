# Introductory Offer

The welcome offer that comes with the plan. Activates automatically for new customers (without previous subscriptions).

## Components

Trial and discount are **optional and independent**. Can be used together or separately.

## Eligibility

| Customer Type | Can Use Offer? |
|---------------|----------------|
| New customer (no previous subscriptions) | Always |
| Customer who had subscription before | Does not apply |
| Active customer (upgrade/downgrade) | Does not apply |
| Customer who had trial and didn't convert | Does not apply |

**Simple rule:** If ANY previous subscription exists (active, canceled, expired, or abandoned trial), not eligible.

## Schema

### Plan Price (Default Configuration)

| Field | Type | Description |
|-------|------|-------------|
| `introOfferEnabled` | boolean | Toggle on/off |
| `introOfferDiscountType` | enum | `percentage` or `amount` |
| `introOfferDiscountValue` | integer | % (0-10000 basis points) or settlement cents |
| `introOfferDurationCycles` | integer | Duration in billing cycles |

### Per-Currency Override (plan_price_currency)

Same fields per currency. At checkout, per-currency intro offer overrides base plan's if it exists.

### Subscription (Tracking)

`introOfferEndsAt`, `introOfferDiscountType`, `introOfferDiscountValue` - resolved from plan or currency override.

## Toggle Behavior

`plan.introOfferEnabled` only affects **new subscriptions**. Existing subscriptions keep their discount until `introOfferEndsAt`.

## Intro Offer + Plan Change

| Aspect | Behavior |
|--------|----------|
| Intro offer | **Lost** when changing plans |
| Credit | Based on what **was paid**, not base price |
| New plan | Normal price (no intro offer) |

## Billing Engine

Discount applied in `buildInvoiceLines()`:
1. Calculate subtotal (plan base + features)
2. If `introOfferEndsAt > now()`: Apply discount as "Introductory Offer Discount" line

```typescript
private isIntroOfferActive(subscription: Subscription): boolean {
  if (!subscription.introOfferEndsAt) return false;
  return new Date() < subscription.introOfferEndsAt;
}
```
