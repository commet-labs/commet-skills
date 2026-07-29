# Subscriptions and plan changes

## Lifecycle and access

Current subscription statuses are `draft`, `pending_payment`, `trialing`, `active`, `past_due`, and `canceled`. Commet has no public pause/resume lifecycle.

Feature access is granted for `active`, `trialing`, and `past_due`. `pending_payment` does not grant access before the first payment succeeds.

Free subscriptions activate without a paid checkout. Paid and trial flows route through the organization's configured payment provider.

When a trial reaches its first paid invoice, a retryable provider decline enters `past_due` recovery. Missing-payment-method and customer-action-required outcomes remain `pending_payment`.

## Introductory Offers

An active automatic Introductory Offer belongs to a plan price. Subscription creation applies it when the customer is eligible and no explicit override is supplied.

Current eligibility excludes customers with an `active` or `past_due` subscription in the organization. A Promotional `offerId` is an explicit override and has its own eligibility. Plan changes clear the existing subscription discount; credit for the old plan uses the effective price actually paid.

## Plan and interval changes

Normal portal changes require both plans to belong to the same plan group. Classification is not based on comparing prices:

- an interval upgrade is immediate;
- an interval downgrade is scheduled;
- a lower `sortOrder` in the group is a scheduled plan downgrade;
- paid-to-free is scheduled;
- other valid changes are immediate;
- free-to-free is immediate and creates no charge.

Immediate paid changes restart the billing period. Commet credits the unused portion of the old effective plan price, charges the full new plan price, applies available customer credits, clears the prior discount, resets the new plan allocation, and records a new feature snapshot.

Scheduled changes take effect at trial end or current-period end.

## Cancellation and reactivation

Cancellation can be immediate or scheduled. Free, `pending_payment`, and `past_due` subscriptions cancel immediately; a normal paid active subscription can cancel at period end. Canceling a past-due subscription stops dunning and voids unpaid invoices.

Cancellation does not reset or delete the persisted subscription balance.

Reactivation charges first and restores state only after payment succeeds. It does not automatically reset an already initialized balance.
