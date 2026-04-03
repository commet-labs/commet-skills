# Addons - Purchasable Feature Extensions

Addons let customers add features to their subscription beyond what the plan includes. Each addon links to one feature and has its own pricing.

## Schema

### addon Table

| Field | Type | Purpose |
|-------|------|---------|
| `name` | text | Display name |
| `slug` | text | URL-friendly identifier (auto-generated) |
| `description` | text | Optional description |
| `basePrice` | bigint | Settlement cents (100 = $1.00) |
| `consumptionModel` | enum | `boolean`, `metered`, `credits`, `balance` |
| `featureId` | FK | One feature per addon (unique per org) |
| `includedUnits` | bigint | Units included (metered only) |
| `overageRate` | bigint | Per-unit overage price (metered/balance) |
| `creditCost` | integer | Credits per unit (credits model) |
| `deletedAt` | timestamp | Soft delete |

Unique constraints: `(organizationId, slug)` and `(organizationId, featureId)` where not deleted.

### subscription_addon Table

| Field | Type | Purpose |
|-------|------|---------|
| `subscriptionId` | FK | Subscription reference |
| `addonId` | FK | Addon reference |
| `status` | enum | `active` or `inactive` |
| `activatedAt` | timestamp | When activated |
| `deactivatedAt` | timestamp | When deactivated |
| `availableUntil` | timestamp | End of current billing period |

Unique on `(subscriptionId, addonId)`.

## Consumption Model Compatibility

Addon model must match plan model OR be `boolean`.

| Addon Model | Allowed on Plan Model |
|-------------|----------------------|
| `boolean` | Any plan |
| `metered` | Metered plans only |
| `credits` | Credits plans only |
| `balance` | Balance plans only |

## Activation Flow

1. Validate consumption model compatibility
2. Resolve price to subscription currency (via plan exchange rate)
3. Calculate prorated charge: `fullPrice × (daysRemaining / totalDays)`
4. If charge > $0: charge customer via Stripe with tax
5. Create/update `subscription_addon` record (status = active)
6. Create feature history snapshot (snapshotReason = "activation")

Prorated charge creates an invoice with `invoiceType = "addon_activation"`.

## Deactivation

Sets `status = "inactive"` and `deactivatedAt = now`. No refund. Feature history updated on next billing cycle.

## Billing Engine Integration

### Recurring Invoices

At billing month renewal, `buildAddonLines()` fetches all active addons:
- Each addon with price > 0 creates an invoice line with `lineType = "addon_base"`
- Lines added after `plan_base` but before feature overages
- Discounts apply to entire invoice including addon lines

### Feature History

When activated or during billing renewal, a `subscription_feature_history` snapshot is created from addon fields:
- `enabled = true`
- `includedAmount` = addon.includedUnits
- `unlimited` = true if metered with no includedUnits and no overageRate
- `overageEnabled` = true if metered with overageRate
- `overageUnitPrice` = addon.overageRate
- `creditsPerUnit` = addon.creditCost

## Pricing & Currency

- `basePrice` stored in USD settlement cents
- At activation, resolved to subscription currency via `plan_currency_exchange_rate`
- Formula: `Math.round((basePriceUsd × exchangeRateCents) / 100)`

## Customer Portal

Customers can activate/deactivate addons from the portal:
- `getPortalAddons()` returns active and available addons
- Available = non-deleted, not already active, not already in plan, compatible model
- `getPortalAddonProratedPrice()` previews prorated cost before activation
- Prices displayed in subscription currency

## API

**GET `/api/(private)/addons/active`** — Returns active addons for a customer's subscription.

Response: `[{ slug, name, basePrice, featureCode, featureName, featureType, consumptionModel, activatedAt }]`

## Business Rules

1. One feature per addon per organization
2. Addon model must match plan model or be boolean
3. Cannot activate same addon twice on one subscription
4. Cannot archive addon with active subscriptions
5. Mid-cycle activation charges prorated amount immediately
6. Soft deletion only (deletedAt)
