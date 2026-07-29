# Billing Concepts

## Plan-First Model

Plans are pricing templates that group features with limits and prices. Customers subscribe to plans.

```
Plan (pricing template)
├── Base Price ($99/month, $990/year)
└── Features:
    ├── API Calls: metered, 10k included, $0.01/extra
    ├── Team Members: seats, 5 included, $25/extra
    └── Custom Branding: boolean, enabled
```

## Feature Types

| Type | What It Is | How Charged | SDK Method |
|------|-----------|-------------|------------|
| **Boolean** | On/off access | Included in plan base | `featureAccess.get(code)` |
| **Usage** | Measurable consumption | Overage at period end | `usage.track(feature)` |
| **Seats** | Per-user licenses | Advance + prorated true-up | `seats.add/remove/set()` |

### Feature code = SDK identifier

The `feature.code` in the dashboard IS the identifier used in the SDK:
- Dashboard: Feature "API Calls" with code `api_calls`
- SDK: `commet.usage.track({ customerId, featureCode: "api_calls", value: 1 })`

## Charging Model

| What | When Charged |
|------|-------------|
| Plan base price | In advance (period start) |
| Boolean features | Included in plan base |
| Metered overage | True-up (previous period end) |
| Seats | Hybrid: advance + true-up for mid-period adds |
| Addons | Prorated on activation + advance at renewal |
| AI token usage | Real-time balance deduction (balance model) |

## Consumption Models (Mutually Exclusive Per Plan)

Each plan uses ONE model:

| Model | Behavior | Use Case |
|-------|----------|----------|
| **Metered** | Included units free, overage charged at period end | Traditional SaaS |
| **Credits** | X credits/month, blocks when exhausted, can buy packs | AI products |
| **Balance** | $X included, configurable block or overage on exhaustion | Platforms |

## Subscription Lifecycle

```
Create subscription
├── Free plan → Active immediately (no billing)
├── Has trial → Trialing (collects payment method)
└── Paid plan → Pending Payment → checkout → Active

Active subscription
├── Billing cron runs monthly → Generates invoices
├── Higher sortOrder in the same plan group → Immediate + proration
├── Lower sortOrder in the same plan group → Scheduled at renewal
└── Cancel → At period end (or immediate)
```

## Subscription Statuses

| Status | Meaning |
|--------|---------|
| `draft` | Just created, not yet processed |
| `pending_payment` | Awaiting first payment (checkoutUrl available) |
| `trialing` | In trial period |
| `active` | Paying and active |
| `past_due` | Renewal payment failed; dunning is active |
| `canceled` | Ended by the customer, dunning, or an operator |

## Proration on Plan Changes

**Upgrade (immediate):**
- Credit: `(remainingDays / totalDays) * paidPrice` for old plan
- Charge: Full new plan price (period resets)
- Net: `newPrice - credit`

**Downgrade (at renewal):**
- No proration. Customer keeps current plan until period end.
- At renewal: switches to new plan at new price.

## Introductory Offers

Automatic discounts attached to plan prices. Current eligibility excludes customers with an `active` or `past_due` subscription in the organization:
- Percentage or fixed amount discount
- Duration in billing cycles
- Lost when changing plans

## Regional Pricing

Plans define canonical USD prices. Optional local currency overrides for: ARS, BRL, CLP, COP, PEN, UYU, PYG, BOB, MXN, CAD, EUR. Currency auto-detected at checkout from billing address. Subscription currency is immutable after first payment.

## Addons

Purchasable feature extensions with their own pricing. Each addon links to one feature. Consumption model must match the plan's model or be boolean. Prorated on mid-cycle activation, then charged at full price at renewal.

## Promo Codes

Promo codes distribute Promotional Offers at checkout. They are mutually exclusive with an eligible automatic Introductory Offer and with a direct `offerId`. Validation covers the code status, time window, plan and interval eligibility, redemption limits, and one redemption per customer per code.

## AI Token Billing

For AI products using the balance consumption model. AI model catalog provides per-million-token pricing. Usage events track input/output/cache tokens. Costs calculated with configurable margins (basis points) per feature per plan. Use `@commet/ai-sdk` for automatic tracking with the Vercel AI SDK.

## Monetary Values

Always in cents (integers): $99.00 = 9900. Zero-decimal currencies (CLP, PYG) stored as whole units.
