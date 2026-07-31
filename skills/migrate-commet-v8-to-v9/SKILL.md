---
name: migrate-commet-v8-to-v9
description: Migrate Commet SDK v8 and API 2026-07-24 integrations to SDK v9 and API 2026-07-31. Use when upgrading Offer creation, Market routes or SDK calls, subscription Offer Applications, or CLI commands from v8 to v9.
license: MIT
metadata:
  author: commet
  version: "1.0.0"
  homepage: https://commet.co
  source: https://github.com/commet-labs/skills
---

# Migrate Commet v8 to v9

Upgrade the repository to the independent Offers and top-level Markets contract. Inspect the integration before editing and preserve its existing selection behavior.

## 1. Find the v8 surface

Search for:

```bash
rg -n "2026-07-24|purpose|planPriceIds|plan-price-ids|commet\.pricing|market-groups|createMarketGroup|Promotional Offer"
```

Classify each Offer by how it is selected:

- automatic from a plan price;
- direct `offerId`;
- customer-entered Promo Code.

Do not infer the channel from phase shape alone.

## 2. Upgrade versions

- Upgrade every Commet SDK package to major v9.
- Pin raw API requests and webhooks to `2026-07-31`.
- Regenerate generated clients before adding handwritten compatibility code.

## 3. Make Offers independent

Remove `purpose` and `planPriceIds` from Offer create and update inputs:

```typescript
const offer = await commet.offers.create({
  name: "Launch",
  phases: [
    { type: "free_trial", durationDays: 14 },
    { type: "percentage", percentage: 2500, durationCycles: 3 },
  ],
});
```

Preserve selection behavior separately:

- Introductory: attach a compatible Offer to one base price in the Dashboard. It may contain an optional first trial plus at most one finite `percentage` or `amount_off` phase.
- Direct Promotional: pass `offerId`. The Offer may contain a trial and multiple ordered phases.
- Promo Code: keep `offerId` on the code. The Offer must contain exactly one `percentage` or `amount_off` phase.

An explicit `offerId` overrides automatic introductory selection. It cannot be combined with `promoCode`, `customTrialDays`, or `skipTrial: true`.

## 4. Update Markets

Replace the nested v8 surface:

```text
/pricing/market-groups              -> /markets
commet.pricing.createMarketGroup()  -> commet.markets.create()
commet.pricing.listMarketGroups()   -> commet.markets.list()
commet.pricing.getMarketGroup()     -> commet.markets.get()
commet.pricing.updateMarketGroup()  -> commet.markets.update()
commet.pricing.deleteMarketGroup()  -> commet.markets.delete()
```

Keep `marketGroupId` inside plan-price inputs. Only the Market resource path and SDK namespace changed.

Update CLI commands from `commet pricing *-market-group` to `commet markets create|list|get|update|delete`.

## 5. Read Offer Applications

Use `appliesTo` from v9 subscription Offer Applications instead of legacy plan-price-only fields:

```typescript
if (application.appliesTo.type === "plan_price") {
  const planPriceId = application.appliesTo.id;
}
```

The response can represent `plan_price`, `addon`, and `credit_pack`. Current public subscription channels create `plan_price` applications.

## 6. Verify behavior

- Create an independent Offer without `purpose` or `planPriceIds`.
- Apply it directly to a subscription and confirm all accepted phases appear.
- Verify automatic introductory selection still works when `offerId` is omitted.
- Verify a Promo Code accepts one discount phase and rejects trial or multi-phase Offers.
- Create, list, update, and delete a Market through `commet.markets`.
- Confirm existing v8 requests remain pinned to `2026-07-24` until every consumer is migrated.

Do not delete v8 compatibility code from the server. API `2026-07-24` keeps its existing routes and response shapes at the version boundary.
