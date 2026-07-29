---
name: billing-behaviors
description: Verified Commet behavior rules for subscriptions, plan changes, invoicing, dunning, usage, credits, balances, seats, add-ons, market pricing, Offers, and billing edge cases.
license: MIT
metadata:
  author: commet
  version: "1.0.0"
  homepage: https://commet.co
  source: https://github.com/commet-labs/skills
---

# Billing Behavior Rules

This skill contains verified behavior rules for the current Commet product. Load only the reference relevant to the task.

## Verification principle

Do not derive behavior from a generic fairness slogan. Scheduling, billing, discounts, and resets are explicit per operation.

## References

- [subscriptions-and-plan-changes.md](references/subscriptions-and-plan-changes.md) — lifecycle, access, intro eligibility, changes, cancellation, and reactivation.
- [billing-and-dunning.md](references/billing-and-dunning.md) — billing periods, invoice composition, discounts, and retry schedule.
- [usage-balances-and-seats.md](references/usage-balances-and-seats.md) — consumption models, resets, packs, top-ups, quota, and seat true-up.
- [catalog-pricing-and-offers.md](references/catalog-pricing-and-offers.md) — plans, currency pricing, Markets, selectable variants, Offers, promo codes, add-ons, and archive behavior.

When a live API or SDK detail matters, consult https://commet.co/docs and the generated SDK types. Do not recreate removed v7 methods or response wrappers.
