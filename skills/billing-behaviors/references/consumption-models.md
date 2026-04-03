# Rules: Credits and Balance

## Credits: Proration on Upgrade

| Concept | Formula |
|---------|---------|
| Credit | `(remainingDays / totalDays) × effectivePrice` (time-based) |
| Charge | **Full price** of new plan |

## Credits: Plan Changes

| Change | Plan Credits | Purchased Credits |
|--------|--------------|-------------------|
| Upgrade | **Reset** to new `includedCredits` | Intact |
| Downgrade | At renewal, reset to new value | Intact |
| Renewal | **Reset** (no rollover) | Intact |

**Purchased credits are never lost.**

## Credits: Cancellation and Reactivation

| Situation | Plan Credits | Purchased Credits |
|-----------|--------------|-------------------|
| Cancel | = 0 | **Preserved** |
| Reactivate | = `includedCredits` | **Restored** |

## Credits: Pack Purchase

Applied **immediately** to `purchasedCredits`.

## Credits: Pack Price Change

| Change | Behavior |
|--------|----------|
| Increase/Decrease price | Immediate for new purchases |
| Existing purchased | Not affected |

## Credits: Change in `creditsPerUnit`

| Change | New Customers | Existing Customers |
|--------|---------------|---------------------|
| Increase (hurts) | Immediate | **At renewal** |
| Decrease (benefits) | Immediate | **Immediate** |

---

## Balance: Proration on Upgrade

| Concept | Formula |
|---------|---------|
| Credit | `(remainingDays / totalDays) × effectivePrice` (time-based) |
| Charge | **Full price** of new plan |

## Balance: Plan Changes

| Change | Balance |
|--------|---------|
| Upgrade | **Reset** to new `includedBalance` |
| Downgrade | At renewal, reset to new value |

Top-ups not preserved (part of current balance).

## Balance: Cancellation and Reactivation

Cancel = lost. Reactivate = reset to `includedBalance`.

## Balance: Top-up

Applied **immediately**. At renewal, balance resets (top-up not preserved).

## Balance: Change in `includedBalance`

| Change | New Customers | Existing Customers |
|--------|---------------|---------------------|
| Increase | Immediate | **Immediate** (benefits) |
| Decrease | Immediate | **At renewal** |

## Balance: Unit Price Change

Increase/Decrease `overageUnitPrice` → **At renewal**.

---

## Trial / Intro Offer / Pause

- Trial ends: credits/balance reset
- Intro offer: applies to **base price** only, not credits/balance
- Pause: plan credits/balance lost. Purchased credits **preserved**. On resume: reset.
