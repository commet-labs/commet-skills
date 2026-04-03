# Subscription - Customer-Plan Contract

One active subscription per customer. States that block new subscription: draft, pending_payment, trialing, active, paused, past_due. States that allow: canceled, expired.

## States

```
draft → pending_payment → trialing → active → canceled
                                       ↓
                                     paused → past_due → expired
```

## Creation Flow

- **Free plan**: starts in `active` immediately, no billing interval, no invoice
- **With trial**: starts in `pending_payment` → customer provides payment method via setup checkout → `trialing` with `trialEndsAt` → billing cron activates to `active` when trial expires
- **Without trial (paid)**: starts in `pending_payment`, invoice + Stripe payment link generated

## Billing Period

Subscription stores: `billingInterval` (nullable — null for free plans), `billingDayOfMonth`, `currentPeriodStart`, `currentPeriodEnd`, `lastBilledAt`, `currency`.

## Currency

Auto-detected at checkout from billing address country. Immutable after first payment. Billing engine queries regional pricing tables based on `subscription.currency`.

## Introductory Offers

Plan price defines template, subscription stores instance (`introOfferEndsAt`, type, value). Only new customers, lost on plan change, one per lifetime.

## Trial

Plan price `trialDays` → subscription `trialEndsAt` (set when customer completes setup checkout, normalized to midnight UTC). During trial: full access, no charge, usage accumulates. Requires payment method upfront via setup checkout (no charge during trial). Billing cron has a separate query for expired trials (`trialEndsAt <= orgTime`).

## Pause

`pausedAt`, `pausedReason`, `status = paused`. Billing skipped, no access, no usage accumulated. Resume resets.

## Cancellation

Immediate (access ends now, unused credited) or end-of-period (access until period ends).
