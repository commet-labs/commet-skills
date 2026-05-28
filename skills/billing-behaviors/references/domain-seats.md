# Seats - Per-User Licenses

Seats are features with `type="seats"` in the feature table. There is no separate seat type table -- each seat variant (e.g. "editor", "viewer") is a feature where `feature.code` identifies it. The SDK `featureCode` parameter maps to `feature.code`.

## Billing Model: Advance + True-up

### Advance
At period start, charge for current seats: `7 seats x $25 = $175`

### True-up
If seats added mid-period, charge prorated difference:
```
Day 1: 5 seats (already paid)
Day 15: +2 seats
True-up: 2 x $25 x (15/30) = $25
```

### No refunds for seat reductions.

## Proration

Daily proration. Both additions and removals prorated.

## Seat Variants (Features with type="seats")

Define license tiers as features with `type="seats"`: Admin ($50/mo), Editor ($25/mo), Viewer (free). Each tracked independently via its `featureCode` (which is `feature.code`).

## Seat Events

Every change recorded: who, how many, when, why. Enables precise billing.

## SDK Integration

The SDK `featureCode` parameter maps to `feature.code`:

```
SDK: seats.add({
  customerId: "...",
  featureCode: "editor",   // feature.code
  count: 2,
})
```
