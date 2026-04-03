# Feature Changes

Rules for when the founder modifies plan features.

**Principle:** More = benefits → immediate. Less = hurts → at renewal.

## Limits (API Calls, Storage, etc.)

| Change | New Customers | Existing Customers |
|--------|---------------|---------------------|
| Increase limits | Immediate | **Immediate** |
| Decrease limits | Immediate | At renewal |

## Boolean Features

| Change | New Customers | Existing Customers |
|--------|---------------|---------------------|
| Add feature | Immediate | **Immediate** |
| Remove feature | Immediate | At renewal |

## Included Seats in Plan

| Change | New Customers | Existing Customers |
|--------|---------------|---------------------|
| More included seats | Immediate | **Immediate** |
| Fewer included seats | Immediate | At renewal |

### Example - Increase Seats
```
Pro plan: 10 included → 15 included
Customer has: 12 seats (10 included + 2 extras = $50/mo)
Result: Customer no longer pays extras (immediate)
```

### Example - Decrease Seats
```
Pro plan: 15 included → 10 included
Customer has: 12 seats (all currently included)
Current period: All 12 remain included
Next period: 10 included + 2 extras ($50/mo)
```
