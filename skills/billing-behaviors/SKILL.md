---
name: billing-behaviors
description: Commet behavior rules and business logic. Use when implementing billing features, subscription changes, plan changes, proration, pricing, credits, balance, intro offers, or any billing edge case. Contains detailed rules for how changes affect customers.
license: Apache-2.0
metadata:
  author: commet
  version: "1.0.0"
  homepage: https://commet.co
  source: https://github.com/commet-labs/commet-skills
references:
  - references/subscription-changes.md
  - references/pricing-changes.md
  - references/feature-changes.md
  - references/plan-management.md
  - references/intro-offer.md
  - references/consumption-models.md
  - references/edge-cases.md
  - references/domain-billing-engine.md
  - references/domain-subscriptions.md
  - references/domain-plans.md
  - references/domain-features.md
  - references/domain-usage.md
  - references/domain-seats.md
  - references/domain-customers.md
  - references/domain-plan-groups.md
  - references/domain-addons.md
  - references/domain-ai-costs.md
  - references/domain-promo-codes.md
---

# Billing Behavior Rules

This skill contains the detailed business behavior rules for Commet. Load the specific files you need based on the task.

## Core Principle

Commet does what's fair by default:

| Change Type | When Applied |
|-------------|--------------|
| Benefits customer | Immediately |
| Hurts customer | At renewal |

**Benefits customer:** More limits (API calls, storage), adding features, more included seats.
**Hurts customer:** Price increase, reduced limits, removing features, fewer included seats.

## Actors

| Actor | Where They Act | Examples |
|-------|----------------|----------|
| Founder | Dashboard | Change prices, edit features, deprecate plans |
| Customer | Customer Portal | Upgrade, downgrade, change billing interval |
| System | Automatic | Trial end, payment failure, billing |

## Decision Tree

```
Who makes the change?
│
├─ FOUNDER (Dashboard)
│   ├─ Benefits customer? → IMMEDIATE
│   └─ Hurts customer? → AT RENEWAL
│   └─ Delete plan/customer? → See references/plan-management.md
│
└─ CUSTOMER (Portal)
    ├─ Upgrade (more expensive)? → IMMEDIATE + proration
    └─ Downgrade (cheaper)? → AT RENEWAL
```

## Detailed Rules

Each file covers a specific aspect of billing behavior:

- [references/subscription-changes.md](references/subscription-changes.md) - Upgrades, downgrades, interval changes, proration by consumption model
- [references/pricing-changes.md](references/pricing-changes.md) - Base price, overage, and seat price changes
- [references/feature-changes.md](references/feature-changes.md) - Limit increases/decreases, boolean features, included seats
- [references/plan-management.md](references/plan-management.md) - Deprecating and deleting plans, deleting customers
- [references/intro-offer.md](references/intro-offer.md) - Introductory offer eligibility, components, plan change behavior
- [references/consumption-models.md](references/consumption-models.md) - Credits and balance proration, plan changes, cancellation, purchases
- [references/edge-cases.md](references/edge-cases.md) - Trial pricing, reactivations, payment failures, exhaustion, currency at checkout

## Domain Reference

Module-specific knowledge for understanding the codebase:

- [references/domain-billing-engine.md](references/domain-billing-engine.md) - Billing engine orchestration, calculator resolution, processing flow, invoice line types, monthly resets
- [references/domain-subscriptions.md](references/domain-subscriptions.md) - Subscription states, creation flow, billing period, currency, trials, pause, cancellation
- [references/domain-plans.md](references/domain-plans.md) - Plan structure, free vs paid, PlanPrice, PlanFeature, introductory offers, regional pricing
- [references/domain-features.md](references/domain-features.md) - Feature types (boolean, metered, seats), feature codes as SDK identifiers
- [references/domain-usage.md](references/domain-usage.md) - Consumption models (metered, credits, balance), usage events, AI token tracking, subscription balance
- [references/domain-seats.md](references/domain-seats.md) - Seat billing (advance + true-up), proration, seat types, SDK integration
- [references/domain-customers.md](references/domain-customers.md) - Customer fields, external ID, address, customer credits, business flow
- [references/domain-plan-groups.md](references/domain-plan-groups.md) - Plan grouping for upgrades/downgrades, business rules
- [references/domain-addons.md](references/domain-addons.md) - Addon system, activation/deactivation, billing, consumption model compatibility
- [references/domain-ai-costs.md](references/domain-ai-costs.md) - AI model catalog, token cost tracking, margin pricing, balance deductions
- [references/domain-promo-codes.md](references/domain-promo-codes.md) - Promo code system, validation rules, checkout flow, mutual exclusivity with intro offers
