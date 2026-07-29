# Billing cycles and dunning

## Billing cycle

Commet applies due subscription events, resolves the billing period and current catalog price, calculates lines, persists the invoice, resets model-owned allocations when applicable, and records the period feature snapshot.

Quarterly and yearly subscriptions still process monthly boundaries. The plan base is charged only on a billing month; applicable overage can be invoiced at intermediate monthly boundaries.

Free plans have no plan-base invoice, but their monthly period and configured allocations still rotate.

## Invoice composition

Recurring invoices contain, in order:

1. the plan base when applicable;
2. active add-on base lines on billing months;
3. feature, usage, or seat lines;
4. one negative discount line when active.

An active offer or promo discount applies to the plan base only. It does not discount add-ons, seats, or feature overage.

## Dunning

The original renewal decline is day 0. Automatic retries are anchored to that instant at days 1, 3, 5, and 7. The fourth declined retry exhausts dunning, cancels the subscription, marks the invoice uncollectible, and emits the failure and cancellation events.

A successful recovery settles the existing invoice and subscription relationship. It is not a new subscription sale.

Use typed webhook events for background communication, and query subscription state directly for access decisions.
