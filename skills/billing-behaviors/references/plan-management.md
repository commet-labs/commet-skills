# Plan Management

## Deprecate Plan (Hide)

**Action:** `plan.isPublic = false`

| Effect | Behavior |
|--------|----------|
| Pricing page | Plan doesn't appear |
| Dashboard (assign plan) | Plan doesn't appear |
| Portal (upgrade/downgrade) | Plan doesn't appear as option |
| Existing customers | **Keep their plan and access** |
| Billing | Continues normally |
| If they cancel | Cannot return to that plan |

## Delete Plan

**Action:** `plan.deletedAt = now`

Both options apply at the **next billing period**, not immediately.

### Option A: Cancel Subscriptions
- `canceledAt = now`, `cancelReason = "plan_deleted"`
- Keeps `active` until `currentPeriodEnd`
- No new invoices generated

### Option B: Migrate to Another Plan
- `scheduledPlanId` set for next period
- Customer keeps current plan during current period
- At renewal: changes to destination plan

## Delete Customer

**Action:** Founder deletes from dashboard.

| Effect | Behavior |
|--------|----------|
| Subscription | Automatically canceled |
| Access | Ends **immediately** |
| Pending charges | Not charged |
