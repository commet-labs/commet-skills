# Seats - Per-User Licenses

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

## Seat Types

Define license types: Admin ($50/mo), Editor ($25/mo), Viewer (free). Each tracked independently.

## Seat Events

Every change recorded: who, how many, when, why. Enables precise billing.

## SDK Integration

```
SDK: seats.add({
  customerId: "...",
  seatTypeCode: "editor",
  quantity: 2,
  reason: "new_hires"
})
```
