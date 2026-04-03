# Promo Codes - Discount Codes

Promo codes provide discounts at checkout. They are distinct from intro offers and mutually exclusive with them.

## Schema

### promo_code Table

| Field | Type | Purpose |
|-------|------|---------|
| `code` | text | Uppercase code (e.g., "SUMMER25") |
| `discountType` | enum | `percentage` or `amount` |
| `discountValue` | integer | Basis points (%) or settlement cents ($) |
| `durationCycles` | integer | null = forever, 1 = first cycle, N = N cycles |
| `maxRedemptions` | integer | Global usage cap (null = unlimited) |
| `expiresAt` | timestamp | Expiration date (null = never) |
| `active` | boolean | Manual on/off toggle |
| `redemptionCount` | integer | Tracks actual redemptions |

Unique on `(organizationId, code)`.

### promo_code_plan Table

Optional plan restrictions. If no rows exist for a code, it applies to ALL plans. If rows exist, only those plans are eligible.

### promo_code_redemption Table

Audit log of every redemption:

| Field | Type | Purpose |
|-------|------|---------|
| `promoCodeId` | FK | Which code |
| `customerId` | FK | Who redeemed |
| `subscriptionId` | FK | Which subscription |
| `checkoutSessionId` | FK | Which checkout |
| `discountType` | enum | Snapshot at redemption time |
| `discountValue` | integer | Snapshot at redemption time |
| `discountAmount` | integer | Calculated discount in cents |
| `currency` | text | Invoice currency |
| `redeemedAt` | timestamp | When redeemed |

## Discount Types

| Type | Storage | Calculation |
|------|---------|-------------|
| `percentage` | Basis points (2500 = 25%) | `amount × (value / 10000)` |
| `amount` | Settlement cents (1000 = $10) | `min(value, amount)` |

For fixed-amount codes in non-USD currencies: `effectiveValue = discountValue × (localPrice / usdPrice)`.

## Duration

| `durationCycles` | Meaning |
|-------------------|---------|
| `null` | Applies every billing cycle forever |
| `1` | First billing cycle only |
| `N` | Applied to N consecutive cycles |

## Validation Rules

Checked in order, fail on first match:

1. **Code lookup** — Normalized to uppercase, org-scoped → `not_found`
2. **Active flag** — Must be true → `inactive`
3. **Expiration** — `expiresAt` must be in future → `expired`
4. **Redemption cap** — `redemptionCount < maxRedemptions` → `max_redemptions_reached`
5. **Customer reuse** — No prior redemption by this customer → `already_redeemed`
6. **Plan eligibility** — Plan must be in `promo_code_plan` set (if restricted) → `plan_not_eligible`
7. **Intro offer conflict** — If plan has active intro offer AND customer is eligible for it → `intro_offer_active`

## Promo Code vs Intro Offer

| Aspect | Promo Code | Intro Offer |
|--------|-----------|-------------|
| How applied | Customer enters code at checkout | Auto-applied if eligible |
| Eligibility | No prior redemption of this code | No prior subscriptions |
| Duration | 1, N, or forever | Fixed N cycles per plan_price |
| Mutual exclusivity | Blocked if intro offer applies | Blocked if promo code applied |

**Only one discount type applies per checkout.** Priority: intro offer > existing subscription discount > promo code.

## Checkout Flow

1. Customer enters code at checkout
2. `validatePromoCode()` runs all validation rules
3. If valid, `promoCodeId` stored on `checkout_session`
4. `resolveCheckoutPricing()` calculates discount preview
5. Check total doesn't drop below Stripe minimum ($0.50)
6. On payment success:
   - Pessimistic lock on `promo_code` (FOR UPDATE)
   - Verify redemption cap not exceeded (race condition protection)
   - Insert `promo_code_redemption` record with snapshot of discount details
   - Increment `promo_code.redemptionCount`
   - Set subscription discount fields: `discountType`, `discountValue`, `discountName`, `discountEndsAt`

## Subscription Discount Fields

After redemption, the subscription stores:
- `discountType` = promo code discount type
- `discountValue` = promo code discount value
- `discountName` = promo code string
- `discountEndsAt` = calculated from `durationCycles` × billing interval (null if forever)

## Invoice Lines

Creates invoice line with `lineType = "discount"`:
- `discountType`, `discountValue`, `discountName` fields set
- Amount is negative (discount applied to subtotal)

Note: `promo_code_discount` line type exists in the enum but is reserved for future billing engine separation. Currently both intro offers and promo codes use the `discount` line type.

## Business Rules

1. One redemption per customer per code (lifetime)
2. Global redemption cap enforced with pessimistic locking
3. Promo codes and intro offers are mutually exclusive
4. Code is normalized to uppercase, restricted to `[A-Z0-9-]`
5. Percentage capped at 10000 basis points (100%)
6. Discount applied to plan base price, not to feature overages
