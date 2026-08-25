---
name: billing-behaviors
description: Reason about Commet subscription, plan-change, invoicing, dunning, usage, credits, balance, seats, add-on, pricing, Offer, and billing edge cases. Use the installed SDK documentation for exact API contracts and these verified references only for behavior that the generated contract cannot express.
---

# Billing behavior rules

Separate exact API shape from billing behavior:

- Resolve the installed SDK's `docs/manifest.json`, entrypoint, generated reference, and relevant Platform documents before naming a method, field, error, event, or version.
- Use the references in this skill for behavioral policy that generated types cannot express.
- When current product code is available, treat its service path and focused tests as stronger evidence than this skill.

In Node projects, run `commet doctor --output agent` before integration changes and resolve failed documentation, compatibility, API-version, or project-context checks.

## Choose the relevant behavior reference

- [subscriptions-and-plan-changes.md](references/subscriptions-and-plan-changes.md) — lifecycle, access, introductory eligibility, changes, cancellation, and reactivation.
- [billing-and-dunning.md](references/billing-and-dunning.md) — billing periods, invoice composition, discounts, and retry scheduling.
- [usage-balances-and-seats.md](references/usage-balances-and-seats.md) — consumption models, resets, packs, top-ups, quota, and seat true-up.
- [catalog-pricing-and-offers.md](references/catalog-pricing-and-offers.md) — plans, currency pricing, Markets, selectable variants, Offers, promo codes, add-ons, and archive behavior.

Do not derive behavior from a generic fairness slogan. Scheduling, charging, discounts, retries, and resets are explicit per operation. For renewal timing, verify the current discovery predicate; never infer that a subscription is due from a date-only dashboard value, a legacy billing-day column, or the cron schedule.

## Guard effects

Reasoning, code edits, and local tests do not require remote context. Before creating or changing billing resources, invoices, subscriptions, balances, usage, credits, or retries, state the exact organization and `sandbox` or `live` mode. Use a passing `PROJECT_CONTEXT_VALID` doctor check in Node projects; otherwise require explicit project or user context. Do not perform a live billing effect unless the user's request explicitly authorizes it.
