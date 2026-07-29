# Catalog, pricing, Offers, and add-ons

## Plans and prices

Paid plans have one or more public plan-price resources. Free plans have no price row. Hiding a plan controls discovery; archiving it does not automatically cancel or migrate subscriptions.

Currency pricing defines values in a presentment currency and can derive them from an exchange rate. Market pricing maps reusable, non-overlapping country groups to explicit price and currency overrides. Both systems coexist.

A price variant points to one base price through `inheritsFromPriceId` and overrides selected markets. Every unselected market inherits the base price. A caller selects a variant with `priceId`; omitting `priceId` keeps default-price resolution.

A subscription persists the selected price identity. Renewal uses that price's current catalog value, not an immutable amount snapshot. Archiving a price hides it from new selection while existing subscriptions continue using it. A referenced market group cannot be deleted.

## Offers

Introductory and Promotional Offers are first-class resources with phases:

- free trial;
- percentage discount;
- amount off with explicit currency amounts;
- fixed price with explicit currency amounts.

One active Introductory Offer can apply automatically to a plan price. Passing a Promotional `offerId` explicitly overrides the automatic Intro. Commet does not assign experiment variants; the caller chooses them.

Accepted offer terms are snapshotted in an Offer Application for billing and audit. Updating or archiving the catalog Offer does not rewrite an existing application. This immutability applies to the accepted offer, not to the selected plan price.

Promo codes reference a Promotional Offer instead of owning separate discount economics. Checkout resolves one active discount source.

## Add-ons

An add-on is compatible when its consumption model is `boolean` or matches the plan's consumption model. Mid-period activation charges a prorated amount and grants the feature after successful payment. Deactivation marks it inactive without refunding the current period.

Recurring billing includes active paid add-ons on billing-month invoices. Discounts do not apply to add-on lines.
