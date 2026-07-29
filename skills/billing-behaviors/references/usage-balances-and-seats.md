# Usage, balances, and seats

## Consumption models

A plan uses one consumption model for usage features:

- `metered` aggregates usage and invoices allowed overage;
- `credits` consumes plan credits and then purchased credits;
- `balance` deducts rate-scale value and either blocks or permits negative overage according to `blockOnExhaustion`.

Feature types are `boolean`, `usage`, `seats`, and `quota`. `metered` is a consumption model, not a persisted feature type.

Use `featureAccess.get()` for current feature state. Use `usage.check()` before a prospective consumption, then `usage.track()` to record it. Usage inputs use `featureCode`; the logical body identity is `eventId`.

## Resets and purchases

- Credits reset `planCredits` and preserve `purchasedCredits`.
- Balance renewal resets `currentBalance`; top-ups are part of the amount replaced by that reset.
- Credit-pack fulfillment increments `purchasedCredits`.
- Balance top-up increments `currentBalance`.
- Cancellation has no special balance mutation.
- Plan-change fulfillment resets the model-owned allocation to the new plan.

## Quota

Quota is a durable held-count feature, not per-period usage. `quota.add`, `set`, and `remove` mutate the held count; `quota.get` and `getAll` read allowances.

## Seats

Seats use advance plus true-up. Incremental additions above the paid or included high-water mark are prorated from the increase time to period end.

Decreases are recorded but do not refund the current period. Re-increasing below the already paid high-water mark does not charge twice.
