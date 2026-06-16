# Webhook Events

All webhook payloads share this envelope:

```typescript
interface WebhookPayload {
  event: string;
  timestamp: string;       // ISO 8601
  organizationId: string;
  mode: "live" | "sandbox";
  apiVersion: string;      // e.g. "2026-06-10"
  data: { /* event-specific */ };
}
```

The `customerId` field returns your `externalId` if you provided one when creating the customer, otherwise the Commet public ID.

## Contents

- [Subscription Events](#subscription-events) — `subscription.created`, `subscription.activated`, `subscription.canceled`, `subscription.updated`, `subscription.plan_changed`, `subscription.cancellation_scheduled`, `subscription.cancellation_revoked`, `subscription.plan_change_scheduled`, `subscription.plan_change_revoked`, `subscription.past_due`
- [Trial Events](#trial-events) — `trial.started`, `trial.converted`, `trial.expired`, `trial.will_end`, `trial.checkout_ready`
- [Checkout Events](#checkout-events) — `checkout.ready`
- [Payment Events](#payment-events) — `payment.received`, `payment.failed`, `payment.recovered`, `payment.refunded`, `payment.disputed`, `payment.dispute_resolved`
- [Invoice Events](#invoice-events) — `invoice.created`, `invoice.upcoming`, `invoice.overdue`, `invoice.voided`
- [Payment Method Events](#payment-method-events) — `payment_method.attached`, `payment_method.updated`
- [Customer Events](#customer-events) — `customer.created`, `customer.updated`, `customer.state_changed`
- [Credits & Balance Events](#credits--balance-events) — `credits.granted`, `credits.purchased`, `credits.low`, `credits.depleted`, `credits.expired`, `balance.topped_up`, `balance.low`, `balance.depleted`
- [Quota & Usage Events](#quota--usage-events) — `quota.threshold_reached`, `quota.exceeded`, `usage.recorded`
- [Seat Events](#seat-events) — `seats.updated`, `seats.limit_reached`
- [Add-on Events](#add-on-events) — `addon.activated`, `addon.deactivated`
- [Payout Events](#payout-events) — `payout.available`, `payout.created`, `payout.paid`, `payout.failed`

## Subscription Events

### subscription.created

Fired when a subscription record is created with status `pending_payment`. The first charge has not been confirmed yet — do NOT grant access here. Wait for `subscription.activated`.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `planId` | `string` | The plan ID |
| `planName` | `string` | The plan name |
| `status` | `string` | Current status. One of: draft, pending_payment, trialing, active, past_due, canceled, expired. Grant access only when trialing or active |
| `startDate` | `string \| null` | ISO 8601 datetime when the subscription starts |
| `name` | `string \| null` | Optional custom name for the subscription |

```json
{
  "event": "subscription.created",
  "timestamp": "2026-03-25T14:30:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "planId": "plan_pro_monthly",
    "planName": "Pro",
    "status": "pending_payment",
    "startDate": "2026-03-25T14:30:00.000Z",
    "name": "Acme Corp"
  }
}
```

### subscription.activated

Fired when the first charge succeeds and status becomes `active` (or `trialing` if a trial is configured). This is where you grant access.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `status` | `string` | Current status. One of: draft, pending_payment, trialing, active, past_due, canceled, expired. Grant access only when trialing or active |
| `currentPeriodStart` | `string \| null` | ISO 8601 start of the current billing period |
| `currentPeriodEnd` | `string \| null` | ISO 8601 end of the current billing period |
| `name` | `string \| null` | Optional custom name for the subscription |
| `invoiceId` | `string` | The invoice ID for this payment |
| `invoiceNumber` | `string` | The human-readable invoice number |
| `invoiceTotal` | `number` | Invoice total in cents (100 = $1.00) |
| `invoiceCurrency` | `string` | The invoice currency code |

```json
{
  "event": "subscription.activated",
  "timestamp": "2026-03-25T14:32:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "status": "active",
    "currentPeriodStart": "2026-03-25T00:00:00.000Z",
    "currentPeriodEnd": "2026-04-25T00:00:00.000Z",
    "name": "Acme Corp",
    "invoiceId": "inv_k1l2m3",
    "invoiceNumber": "INV-0042",
    "invoiceTotal": 9900,
    "invoiceCurrency": "usd"
  }
}
```

### subscription.canceled

Fired when a subscription is actually terminated at the end of the billing period. The status is now `canceled` and access should be revoked. This event is NOT fired when cancellation is scheduled — that triggers `subscription.updated` instead. See the cancellation lifecycle below.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `status` | `string` | Always "canceled" for this event. Revoke access when you receive this |
| `canceledAt` | `string` | ISO 8601 datetime when the customer originally requested cancellation |
| `cancelReason` | `string \| null` | The reason for cancellation, if provided |
| `endDate` | `string` | ISO 8601 datetime when the subscription ended (matches the billing period end) |

```json
{
  "event": "subscription.canceled",
  "timestamp": "2026-04-25T00:00:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "status": "canceled",
    "canceledAt": "2026-04-20T10:15:00.000Z",
    "cancelReason": "Too expensive",
    "endDate": "2026-04-25T00:00:00.000Z"
  }
}
```

### subscription.updated

Fired when subscription details change. The most common trigger is scheduling a cancellation — when a customer cancels, the status stays "active" until the billing period ends, but `canceledAt` and `endDate` are set immediately. Use this event to show "your subscription will end on {endDate}" in your UI. Access should NOT be revoked here — wait for `subscription.canceled`.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `status` | `string` | Current status. When cancellation is scheduled, this is still "active" — the subscription remains usable until endDate |
| `canceledAt` | `string \| null` | ISO 8601 datetime when cancellation was requested. Present when cancellation is scheduled, null otherwise |
| `cancelReason` | `string \| null` | The reason for cancellation, if provided |
| `endDate` | `string \| null` | ISO 8601 datetime when the subscription will end. Present when cancellation is scheduled — this is the date access should be revoked (via subscription.canceled) |

```json
{
  "event": "subscription.updated",
  "timestamp": "2026-04-20T10:15:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "status": "active",
    "canceledAt": "2026-04-20T10:15:00.000Z",
    "cancelReason": "Too expensive",
    "endDate": "2026-04-25T00:00:00.000Z"
  }
}
```

### subscription.plan_changed

Fired when a subscription changes from one plan to another, including upgrades, downgrades, and billing interval changes. Access does not change on this event — the subscription stays active.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `previousPlan` | `object` | The previous plan (`{ id, name }`) |
| `currentPlan` | `object` | The new plan (`{ id, name }`) |
| `billingInterval` | `string \| null` | The billing interval (monthly, yearly) |
| `credit` | `number \| null` | Prorated credit in cents from the previous plan |
| `charge` | `number \| null` | Prorated charge in cents for the new plan |
| `totalCharged` | `number \| null` | Total amount charged in cents |

```json
{
  "event": "subscription.plan_changed",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "previousPlan": { "id": "plan_starter", "name": "Starter" },
    "currentPlan": { "id": "plan_pro", "name": "Pro" },
    "billingInterval": "monthly",
    "credit": 1500,
    "charge": 4900,
    "totalCharged": 3400
  }
}
```

### subscription.cancellation_scheduled

Fired when a cancellation is scheduled for the end of the billing period. The subscription stays active until `effectiveAt` — do NOT revoke access here. `subscription.updated` also fires for backward compatibility.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `status` | `string` | Still "active" — the subscription remains usable until effectiveAt |
| `canceledAt` | `string` | ISO 8601 datetime when the cancellation was requested |
| `cancelReason` | `string \| null` | The reason for cancellation, if provided |
| `effectiveAt` | `string` | ISO 8601 datetime when the cancellation will execute (the billing period end). subscription.canceled fires at this moment |

```json
{
  "event": "subscription.cancellation_scheduled",
  "timestamp": "2026-04-20T10:15:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "status": "active",
    "canceledAt": "2026-04-20T10:15:00.000Z",
    "cancelReason": "Too expensive",
    "effectiveAt": "2026-04-25T00:00:00.000Z"
  }
}
```

### subscription.cancellation_revoked

Fired when a scheduled cancellation is reverted before it executes. The subscription continues on its current plan and billing period as if it had never been canceled.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `status` | `string` | Current status — typically "active". The scheduled cancellation no longer applies |
| `currentPeriodEnd` | `string \| null` | ISO 8601 end of the current billing period, which continues normally |

```json
{
  "event": "subscription.cancellation_revoked",
  "timestamp": "2026-04-22T09:00:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "status": "active",
    "currentPeriodEnd": "2026-04-25T00:00:00.000Z"
  }
}
```

### subscription.plan_change_scheduled

Fired when a plan change (downgrade or shorter interval) is scheduled for the end of the billing period. The subscription stays on the current plan until `effectiveAt`, when `subscription.plan_changed` fires.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `status` | `string` | Current status — the subscription stays usable |
| `currentPlan` | `object` | The plan currently in effect (`{ id, name }`) |
| `scheduledPlan` | `object` | The plan that takes effect at effectiveAt (`{ id, name }`) |
| `billingInterval` | `string \| null` | The current billing interval |
| `scheduledBillingInterval` | `string \| null` | The new billing interval, if the change includes one. Null when only the plan changes |
| `effectiveAt` | `string` | ISO 8601 datetime when the change executes (the billing period end) |

```json
{
  "event": "subscription.plan_change_scheduled",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "status": "active",
    "currentPlan": { "id": "plan_pro", "name": "Pro" },
    "scheduledPlan": { "id": "plan_starter", "name": "Starter" },
    "billingInterval": "monthly",
    "scheduledBillingInterval": null,
    "effectiveAt": "2026-04-25T00:00:00.000Z"
  }
}
```

### subscription.plan_change_revoked

Fired when a scheduled plan change is replaced by a different one before it executes. The replacement also fires `subscription.plan_change_scheduled` with the new target plan.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `status` | `string` | Current status — the subscription stays usable |
| `currentPlan` | `object` | The plan currently in effect (`{ id, name }`) |
| `revokedPlan` | `object` | The previously scheduled plan that will no longer take effect (`{ id, name }`) |
| `billingInterval` | `string \| null` | The current billing interval |
| `revokedBillingInterval` | `string \| null` | The previously scheduled billing interval, if the revoked change included one |

```json
{
  "event": "subscription.plan_change_revoked",
  "timestamp": "2026-04-18T16:30:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "status": "active",
    "currentPlan": { "id": "plan_pro", "name": "Pro" },
    "revokedPlan": { "id": "plan_starter", "name": "Starter" },
    "billingInterval": "monthly",
    "revokedBillingInterval": null
  }
}
```

### subscription.past_due

Fired when a recurring payment fails on a previously paid subscription and its status becomes `past_due`. Access is cut immediately for past_due subscriptions — use this to notify the customer and recover the payment.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `status` | `string` | Always "past_due" for this event |
| `invoiceId` | `string` | The invoice whose payment failure triggered the status |
| `invoiceNumber` | `string` | The human-readable invoice number |

```json
{
  "event": "subscription.past_due",
  "timestamp": "2026-04-25T00:05:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "status": "past_due",
    "invoiceId": "inv_n4o5p6",
    "invoiceNumber": "INV-0043"
  }
}
```

## Trial Events

### trial.started

Fired when a subscription enters its trial period after checkout. Grant access here — trialing subscriptions have full access until `trialEndsAt`.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `status` | `string` | Always "trialing" for this event |
| `planId` | `string` | The plan ID |
| `planName` | `string` | The plan name |
| `trialEndsAt` | `string` | ISO 8601 datetime when the trial ends |

```json
{
  "event": "trial.started",
  "timestamp": "2026-03-25T14:32:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "status": "trialing",
    "planId": "plan_pro_monthly",
    "planName": "Pro",
    "trialEndsAt": "2026-04-08T00:00:00.000Z"
  }
}
```

### trial.converted

Fired when a trialing customer converts to a paid subscription before the trial ends — today this happens when they change plan during the trial, which charges the full new plan price immediately. Trials that simply run out fire `trial.expired` instead.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `status` | `string` | Always "active" for this event |
| `planId` | `string` | The plan ID the customer converted to |
| `planName` | `string` | The plan name |

```json
{
  "event": "trial.converted",
  "timestamp": "2026-04-01T10:00:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "status": "active",
    "planId": "plan_pro_monthly",
    "planName": "Pro"
  }
}
```

### trial.expired

Fired when a trial period runs out and the billing cycle activates the subscription. The first regular invoice is generated right after — this is the natural trial-to-paid transition.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `status` | `string` | Current status — "active" once the billing cycle has activated the subscription |
| `planId` | `string` | The plan ID |
| `planName` | `string` | The plan name |
| `trialEndsAt` | `string` | ISO 8601 datetime when the trial ended |

```json
{
  "event": "trial.expired",
  "timestamp": "2026-04-08T01:00:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "status": "active",
    "planId": "plan_pro_monthly",
    "planName": "Pro",
    "trialEndsAt": "2026-04-08T00:00:00.000Z"
  }
}
```

### trial.will_end

Predictive event fired once, 3 days before a trial ends. Use it to remind the customer that billing starts soon. Emitted by a daily scan with a deterministic idempotency key, so it never fires twice for the same trial end date.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `status` | `string` | Always "trialing" for this event |
| `planId` | `string` | The plan ID |
| `planName` | `string` | The plan name |
| `trialEndsAt` | `string` | ISO 8601 datetime when the trial will end |

```json
{
  "event": "trial.will_end",
  "timestamp": "2026-04-05T06:00:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "status": "trialing",
    "planId": "plan_pro_monthly",
    "planName": "Pro",
    "trialEndsAt": "2026-04-08T00:00:00.000Z"
  }
}
```

### trial.checkout_ready

Fired when a trial checkout link is ready to share with the customer. Completing this checkout saves a payment method and starts the trial (`trial.started`) — the customer is not charged until the trial ends.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `planName` | `string` | The plan name |
| `trialDays` | `number` | The length of the trial in days |
| `checkoutUrl` | `string` | The hosted checkout URL to share with the customer |

```json
{
  "event": "trial.checkout_ready",
  "timestamp": "2026-03-25T14:30:05.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "planName": "Pro",
    "trialDays": 14,
    "checkoutUrl": "https://pay.commet.co/checkout/tok_9f8e7d6c"
  }
}
```

## Checkout Events

### checkout.ready

Fired when a checkout link for a subscription's first invoice is ready to share with the customer. Commet also emails the link — use this event to deliver it through your own channels.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `invoiceId` | `string` | The invoice this checkout collects |
| `invoiceNumber` | `string` | The human-readable invoice number |
| `invoiceTotal` | `number` | Invoice total in cents (100 = $1.00) |
| `invoiceCurrency` | `string` | The invoice currency code |
| `checkoutUrl` | `string` | The hosted checkout URL to share with the customer |

```json
{
  "event": "checkout.ready",
  "timestamp": "2026-03-25T14:30:05.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "invoiceId": "inv_k1l2m3",
    "invoiceNumber": "INV-0042",
    "invoiceTotal": 9900,
    "invoiceCurrency": "usd",
    "checkoutUrl": "https://pay.commet.co/checkout/tok_9f8e7d6c"
  }
}
```

## Payment Events

### payment.received

Fired when a recurring payment is successfully processed. This event is for recurring charges only — the first checkout payment triggers `subscription.activated` instead.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `invoiceId` | `string` | The invoice ID |
| `invoiceNumber` | `string` | The human-readable invoice number |
| `invoiceTotal` | `number` | Invoice total in cents (100 = $1.00) |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `subscriptionId` | `string` | The subscription ID |
| `paymentTransactionId` | `string` | The payment transaction ID |
| `grossAmount` | `number` | Gross amount in cents before fees |
| `currency` | `string` | The payment currency code |
| `orgNetAmount` | `number` | Net amount after fees in cents |
| `customerEmail` | `string \| null` | The customer email used for this payment |
| `paidAt` | `string \| null` | ISO 8601 datetime when the payment was received |

```json
{
  "event": "payment.received",
  "timestamp": "2026-04-25T00:05:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "invoiceId": "inv_n4o5p6",
    "invoiceNumber": "INV-0043",
    "invoiceTotal": 9900,
    "customerId": "user_123",
    "subscriptionId": "sub_1a2b3c4d",
    "paymentTransactionId": "ptx_q7r8s9",
    "grossAmount": 9900,
    "currency": "usd",
    "orgNetAmount": 9200,
    "customerEmail": "billing@acme.com",
    "paidAt": "2026-04-25T00:05:00.000Z"
  }
}
```

### payment.failed

Fired when a recurring charge fails. This event is for recurring charge failures only — card declines during initial checkout do not trigger this event.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `invoiceId` | `string \| null` | The invoice ID, if available |
| `invoiceNumber` | `string \| null` | The human-readable invoice number, if available |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `subscriptionId` | `string \| null` | The subscription ID, if the invoice is linked to a subscription |
| `failureCode` | `string \| null` | The failure code from the payment processor |
| `failureMessage` | `string \| null` | A human-readable failure message |

```json
{
  "event": "payment.failed",
  "timestamp": "2026-04-25T00:05:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "invoiceId": "inv_n4o5p6",
    "invoiceNumber": "INV-0043",
    "customerId": "user_123",
    "subscriptionId": "sub_1a2b3c4d",
    "failureCode": "card_declined",
    "failureMessage": "Your card was declined."
  }
}
```

### payment.recovered

Fired when an outstanding invoice that previously failed is successfully paid — automatically on retry or by the customer through the portal. The subscription returns to active at the same time; use this event to close the dunning flow you opened on `payment.failed`.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `invoiceId` | `string` | The recovered invoice ID |
| `invoiceNumber` | `string` | The human-readable invoice number |
| `invoiceTotal` | `number` | Invoice total in cents (100 = $1.00) |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `subscriptionId` | `string \| null` | The subscription ID, if the invoice is linked to a subscription |

```json
{
  "event": "payment.recovered",
  "timestamp": "2026-04-27T10:15:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "invoiceId": "inv_n4o5p6",
    "invoiceNumber": "INV-0043",
    "invoiceTotal": 9900,
    "customerId": "user_123",
    "subscriptionId": "sub_1a2b3c4d"
  }
}
```

### payment.refunded

Fired when a payment is refunded, fully or partially. A full refund of a subscription invoice also cancels the subscription immediately (`subscription.canceled` fires with reason refund); partial refunds leave the subscription untouched.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `paymentTransactionId` | `string` | The refunded payment transaction ID |
| `invoiceId` | `string \| null` | The invoice the payment collected, or null for payments without an invoice |
| `invoiceNumber` | `string \| null` | The human-readable invoice number, if available |
| `customerId` | `string \| null` | The customer ID, when the payment is linked to an invoice. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `subscriptionId` | `string \| null` | The subscription ID, if the invoice is linked to a subscription |
| `refundAmount` | `number` | The refunded amount in cents (100 = $1.00) |
| `currency` | `string` | The refund currency code |

```json
{
  "event": "payment.refunded",
  "timestamp": "2026-04-28T16:40:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "paymentTransactionId": "ptx_q7r8s9",
    "invoiceId": "inv_n4o5p6",
    "invoiceNumber": "INV-0043",
    "customerId": "user_123",
    "subscriptionId": "sub_1a2b3c4d",
    "refundAmount": 9900,
    "currency": "usd"
  }
}
```

### payment.disputed

Fired when a cardholder opens a dispute (chargeback) against a payment. The disputed amount is frozen from your payout balance while the dispute is open; Commet, as the Merchant of Record, handles the resolution process. `payment.dispute_resolved` fires with the outcome.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `paymentTransactionId` | `string` | The disputed payment transaction ID |
| `invoiceId` | `string \| null` | The invoice the payment collected, or null for payments without an invoice |
| `invoiceNumber` | `string \| null` | The human-readable invoice number, if available |
| `customerId` | `string \| null` | The customer ID, when the payment is linked to an invoice. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `subscriptionId` | `string \| null` | The subscription ID, if the invoice is linked to a subscription |
| `disputeAmount` | `number` | The contested amount in cents (100 = $1.00) |
| `currency` | `string` | The dispute currency code |
| `disputeReason` | `string \| null` | The provider's reason code (e.g. fraudulent, product_not_received), or null when none is given |

```json
{
  "event": "payment.disputed",
  "timestamp": "2026-05-02T09:00:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "paymentTransactionId": "ptx_q7r8s9",
    "invoiceId": "inv_n4o5p6",
    "invoiceNumber": "INV-0043",
    "customerId": "user_123",
    "subscriptionId": "sub_1a2b3c4d",
    "disputeAmount": 9900,
    "currency": "usd",
    "disputeReason": "fraudulent"
  }
}
```

### payment.dispute_resolved

Fired when a dispute is closed. Carries the same identifiers as `payment.disputed` plus the outcome: `won` restores the frozen amount to your balance, `lost` keeps the chargeback deducted.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `paymentTransactionId` | `string` | The disputed payment transaction ID |
| `invoiceId` | `string \| null` | The invoice the payment collected, or null for payments without an invoice |
| `invoiceNumber` | `string \| null` | The human-readable invoice number, if available |
| `customerId` | `string \| null` | The customer ID, when the payment is linked to an invoice. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `subscriptionId` | `string \| null` | The subscription ID, if the invoice is linked to a subscription |
| `disputeAmount` | `number` | The contested amount in cents (100 = $1.00) |
| `currency` | `string` | The dispute currency code |
| `disputeReason` | `string \| null` | The provider's reason code, or null when none is given |
| `outcome` | `string` | The resolution: "won" or "lost" |

```json
{
  "event": "payment.dispute_resolved",
  "timestamp": "2026-05-20T13:30:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "paymentTransactionId": "ptx_q7r8s9",
    "invoiceId": "inv_n4o5p6",
    "invoiceNumber": "INV-0043",
    "customerId": "user_123",
    "subscriptionId": "sub_1a2b3c4d",
    "disputeAmount": 9900,
    "currency": "usd",
    "disputeReason": "fraudulent",
    "outcome": "won"
  }
}
```

## Invoice Events

### invoice.created

Fired when a new invoice is generated for a subscription, typically at the start of a billing period.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `invoiceId` | `string` | The invoice ID |
| `invoiceNumber` | `string` | The human-readable invoice number |
| `invoiceStatus` | `string` | The invoice status (e.g. pending, paid) |
| `periodStart` | `string \| null` | ISO 8601 start of the billing period |
| `periodEnd` | `string \| null` | ISO 8601 end of the billing period |
| `issueDate` | `string \| null` | ISO 8601 date the invoice was issued |
| `dueDate` | `string \| null` | ISO 8601 date the invoice is due |
| `currency` | `string` | The invoice currency code |
| `subtotal` | `number` | Subtotal in cents (100 = $1.00) |
| `total` | `number` | Total in cents (100 = $1.00) |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `subscriptionId` | `string \| null` | The subscription ID, if the invoice is linked to a subscription |

```json
{
  "event": "invoice.created",
  "timestamp": "2026-04-25T00:00:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "invoiceId": "inv_n4o5p6",
    "invoiceNumber": "INV-0043",
    "invoiceStatus": "pending",
    "periodStart": "2026-04-25T00:00:00.000Z",
    "periodEnd": "2026-05-25T00:00:00.000Z",
    "issueDate": "2026-04-25T00:00:00.000Z",
    "dueDate": "2026-04-25T00:00:00.000Z",
    "currency": "usd",
    "subtotal": 9900,
    "total": 9900,
    "customerId": "user_123",
    "subscriptionId": "sub_1a2b3c4d"
  }
}
```

### invoice.upcoming

Predictive event fired once, 3 days before an active subscription renews. Use it to notify the customer before they are charged. Carries no amount — usage-based charges are only final at renewal, when `invoice.created` delivers the actual invoice.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `status` | `string` | Always "active" for this event |
| `planId` | `string` | The plan ID |
| `planName` | `string` | The plan name |
| `billingInterval` | `string \| null` | The billing interval (monthly, yearly) |
| `currentPeriodEnd` | `string` | ISO 8601 datetime when the current period ends and the renewal invoice is issued |

```json
{
  "event": "invoice.upcoming",
  "timestamp": "2026-04-22T06:00:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "status": "active",
    "planId": "plan_pro_monthly",
    "planName": "Pro",
    "billingInterval": "monthly",
    "currentPeriodEnd": "2026-04-25T00:00:00.000Z"
  }
}
```

### invoice.overdue

Fired once when an outstanding invoice passes its due date without payment. The invoice keeps its outstanding status — overdue is a fact about the due date, not a new status. Use it to start your own dunning flow.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `invoiceId` | `string` | The invoice ID |
| `invoiceNumber` | `string` | The human-readable invoice number |
| `invoiceStatus` | `string` | Always "outstanding" for this event |
| `periodStart` | `string \| null` | ISO 8601 start of the billing period |
| `periodEnd` | `string \| null` | ISO 8601 end of the billing period |
| `issueDate` | `string \| null` | ISO 8601 date the invoice was issued |
| `dueDate` | `string` | ISO 8601 date the invoice was due — now in the past |
| `currency` | `string` | The invoice currency code |
| `subtotal` | `number` | Subtotal in cents (100 = $1.00) |
| `total` | `number` | Total in cents (100 = $1.00) |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `subscriptionId` | `string \| null` | The subscription ID, if the invoice is linked to a subscription |

```json
{
  "event": "invoice.overdue",
  "timestamp": "2026-05-02T06:00:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "invoiceId": "inv_n4o5p6",
    "invoiceNumber": "INV-0043",
    "invoiceStatus": "outstanding",
    "periodStart": "2026-04-25T00:00:00.000Z",
    "periodEnd": "2026-05-25T00:00:00.000Z",
    "issueDate": "2026-04-25T00:00:00.000Z",
    "dueDate": "2026-04-25T00:00:00.000Z",
    "currency": "usd",
    "subtotal": 9900,
    "total": 9900,
    "customerId": "user_123",
    "subscriptionId": "sub_1a2b3c4d"
  }
}
```

### invoice.voided

Fired when an invoice is voided — nullified before collection, either manually or automatically when its subscription is canceled. Voiding is terminal: a void invoice is never retried or collected.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `invoiceId` | `string` | The invoice ID |
| `invoiceNumber` | `string` | The human-readable invoice number |
| `invoiceStatus` | `string` | Always "void" for this event |
| `periodStart` | `string \| null` | ISO 8601 start of the billing period |
| `periodEnd` | `string \| null` | ISO 8601 end of the billing period |
| `issueDate` | `string \| null` | ISO 8601 date the invoice was issued |
| `dueDate` | `string \| null` | ISO 8601 date the invoice was due |
| `currency` | `string` | The invoice currency code |
| `subtotal` | `number` | Subtotal in cents (100 = $1.00) |
| `total` | `number` | Total in cents (100 = $1.00) |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `subscriptionId` | `string \| null` | The subscription ID, if the invoice is linked to a subscription |

```json
{
  "event": "invoice.voided",
  "timestamp": "2026-04-26T10:00:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "invoiceId": "inv_n4o5p6",
    "invoiceNumber": "INV-0043",
    "invoiceStatus": "void",
    "periodStart": "2026-04-25T00:00:00.000Z",
    "periodEnd": "2026-05-25T00:00:00.000Z",
    "issueDate": "2026-04-25T00:00:00.000Z",
    "dueDate": "2026-04-25T00:00:00.000Z",
    "currency": "usd",
    "subtotal": 9900,
    "total": 9900,
    "customerId": "user_123",
    "subscriptionId": "sub_1a2b3c4d"
  }
}
```

## Payment Method Events

### payment_method.attached

Fired when Commet records a payment method for a subscription: after a paid checkout, when a trial starts with a card on file, or when a zero-total checkout completes. The `card` object carries display metadata only — full numbers never leave the payment provider.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription the payment method was saved for |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `card` | `object \| null` | Card display metadata: brand, last4, expMonth, expYear. Null when the method is not a card or its details cannot be retrieved |

```json
{
  "event": "payment_method.attached",
  "timestamp": "2026-03-25T14:32:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "card": { "brand": "visa", "last4": "4242", "expMonth": 12, "expYear": 2030 }
  }
}
```

### payment_method.updated

Fired when a customer replaces their default payment method through the customer portal. The new method applies to all of the customer's subscriptions. A payment method update is also a strong recovery signal for past-due subscriptions.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `card` | `object \| null` | Card display metadata for the new method: brand, last4, expMonth, expYear. Null when the method is not a card or its details cannot be retrieved |

```json
{
  "event": "payment_method.updated",
  "timestamp": "2026-04-26T09:00:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "customerId": "user_123",
    "card": { "brand": "mastercard", "last4": "5100", "expMonth": 8, "expYear": 2031 }
  }
}
```

## Customer Events

### customer.created

Fired when a customer is created, via the API (including batch create), SDK, or dashboard. The payload is the customer resource exactly as `GET /customers` returns it.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | The Commet customer ID (cus_...) |
| `externalId` | `string \| null` | Your own identifier for this customer, if you provided one |
| `fullName` | `string \| null` | The customer's full name |
| `email` | `string` | The customer's email |
| `timezone` | `string \| null` | The customer's timezone |
| `metadata` | `object \| null` | Custom key-value metadata you attached to the customer |
| `createdAt` | `string` | ISO 8601 datetime when the customer was created |
| `updatedAt` | `string` | ISO 8601 datetime of the last update |

```json
{
  "event": "customer.created",
  "timestamp": "2026-03-25T14:29:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "id": "cus_1a2b3c4d",
    "externalId": "user_123",
    "fullName": "Ada Lovelace",
    "email": "ada@acme.com",
    "timezone": "UTC",
    "metadata": { "plan_intent": "pro" },
    "createdAt": "2026-03-25T14:29:00.000Z",
    "updatedAt": "2026-03-25T14:29:00.000Z"
  }
}
```

### customer.updated

Fired when a customer's details change (email, name, timezone, externalId, or metadata). Carries the same customer resource shape as `customer.created` with the current values.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | The Commet customer ID (cus_...) |
| `externalId` | `string \| null` | Your own identifier for this customer, if you provided one |
| `fullName` | `string \| null` | The customer's full name |
| `email` | `string` | The customer's email |
| `timezone` | `string \| null` | The customer's timezone |
| `metadata` | `object \| null` | Custom key-value metadata you attached to the customer |
| `createdAt` | `string` | ISO 8601 datetime when the customer was created |
| `updatedAt` | `string` | ISO 8601 datetime of this update |

```json
{
  "event": "customer.updated",
  "timestamp": "2026-04-02T09:10:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "id": "cus_1a2b3c4d",
    "externalId": "user_123",
    "fullName": "Ada Lovelace",
    "email": "ada.lovelace@acme.com",
    "timezone": "Europe/London",
    "metadata": { "plan_intent": "pro" },
    "createdAt": "2026-03-25T14:29:00.000Z",
    "updatedAt": "2026-04-02T09:10:00.000Z"
  }
}
```

### customer.state_changed

Aggregate entitlement event answering one question: what can this customer access right now? Fired on every entitlement transition (subscription lifecycle, plan changes, trials, past due, scheduled cancellations) with the customer's CURRENT subscription, plan, features, seats, and credits or balance. Handle this single event to keep access in sync instead of wiring every lifecycle event.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `trigger` | `string` | What caused the transition. One of: subscription_created, subscription_activated, subscription_canceled, plan_change, past_due, trial_started, trial_converted, trial_expired, cancellation_scheduled, cancellation_revoked, seats_updated, addon_activated, addon_deactivated, credits_depleted, balance_depleted, quota_exceeded |
| `status` | `string` | The customer's current subscription status, or "none" when no live subscription exists. Grant access only when trialing or active |
| `subscriptionId` | `string \| null` | The live subscription ID, or null when status is none |
| `plan` | `object \| null` | The current plan (`{ id, name }`), or null when status is none |
| `billingInterval` | `string \| null` | The current billing interval |
| `consumptionModel` | `string \| null` | The plan's consumption model: metered, credits, or balance |
| `features` | `array` | Current feature access, one entry per plan feature: code, name, type, allowed, enabled, current, included, remaining, overageQuantity, overageUnitPrice, unlimited, overageEnabled, billedQuantity. Fields that do not apply to a feature type are null |
| `seats` | `array` | Summary of seats-type features: code, current, included, remaining, unlimited |
| `credits` | `object \| null` | For credits plans: planCredits, purchasedCredits, totalCredits. Null otherwise |
| `balance` | `object \| null` | For balance plans: currentBalance in rate scale (10000 = $1.00). Null otherwise |

```json
{
  "event": "customer.state_changed",
  "timestamp": "2026-03-25T14:32:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-05-25",
  "data": {
    "customerId": "user_123",
    "trigger": "subscription_activated",
    "status": "active",
    "subscriptionId": "sub_1a2b3c4d",
    "plan": { "id": "plan_pro_monthly", "name": "Pro" },
    "billingInterval": "monthly",
    "consumptionModel": "metered",
    "features": [
      {
        "code": "api_calls",
        "name": "API Calls",
        "type": "usage",
        "allowed": true,
        "enabled": null,
        "current": 120,
        "included": 1000,
        "remaining": 880,
        "overageQuantity": 0,
        "overageUnitPrice": 50,
        "unlimited": false,
        "overageEnabled": true,
        "billedQuantity": null
      },
      {
        "code": "editors",
        "name": "Editors",
        "type": "seats",
        "allowed": true,
        "enabled": null,
        "current": 3,
        "included": 5,
        "remaining": 2,
        "overageQuantity": 0,
        "overageUnitPrice": null,
        "unlimited": false,
        "overageEnabled": false,
        "billedQuantity": null
      }
    ],
    "seats": [
      { "code": "editors", "current": 3, "included": 5, "remaining": 2, "unlimited": false }
    ],
    "credits": null,
    "balance": null
  }
}
```

## Credits & Balance Events

### credits.granted

Fired when non-purchase credits are granted to a subscription: plan-included credits at the start of each billing period, or a manual adjustment from the dashboard. Credit pack purchases fire `credits.purchased` instead.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `credits` | `number` | The number of credits granted |
| `reason` | `string` | Why the credits were granted: period_reset or manual_adjustment |

```json
{
  "event": "credits.granted",
  "timestamp": "2026-06-01T00:00:05.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "credits": 500,
    "reason": "period_reset"
  }
}
```

### credits.purchased

Fired when a customer buys a credit pack through the customer portal and the payment succeeds. Purchased credits never expire — unlike plan credits, they survive period resets. Plan-included credit grants fire `credits.granted` instead.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `invoiceId` | `string` | The invoice issued for the purchase |
| `invoiceNumber` | `string` | The human-readable invoice number |
| `creditPackName` | `string` | The purchased credit pack's name |
| `credits` | `number` | The number of credits purchased |

```json
{
  "event": "credits.purchased",
  "timestamp": "2026-06-15T11:20:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "invoiceId": "inv_t1u2v3",
    "invoiceNumber": "INV-0051",
    "creditPackName": "Booster 500",
    "credits": 500
  }
}
```

### credits.low

Fired when a subscription's remaining credits cross below 10% of the credits granted for the current period. Emitted once per billing period, when the crossing happens.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `remainingCredits` | `number` | Total credits remaining (plan plus purchased) |
| `thresholdCredits` | `number` | The low-credit threshold that was crossed: 10% of the period's granted plan credits |
| `periodCredits` | `number` | The plan credits granted at the last period reset |

```json
{
  "event": "credits.low",
  "timestamp": "2026-06-18T09:12:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "remainingCredits": 42,
    "thresholdCredits": 50,
    "periodCredits": 500
  }
}
```

### credits.depleted

Fired when a subscription's credits hit zero. Usage requests that need more credits than remain are rejected from this point. Also fires `customer.state_changed` with trigger credits_depleted.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `remainingCredits` | `number` | Credits remaining after depletion. Always 0 |

```json
{
  "event": "credits.depleted",
  "timestamp": "2026-06-22T17:45:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "remainingCredits": 0
  }
}
```

### credits.expired

Fired at the period reset when unused plan credits from the previous period are discarded. Plan credits expire at period end; purchased credits never expire and are not affected.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `expiredCredits` | `number` | The unused plan credits that were discarded |

```json
{
  "event": "credits.expired",
  "timestamp": "2026-06-01T00:00:05.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "expiredCredits": 120
  }
}
```

### balance.topped_up

Fired when a customer on a balance plan tops up their prepaid balance through the customer portal and the payment succeeds.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `invoiceId` | `string` | The invoice issued for the top-up |
| `invoiceNumber` | `string` | The human-readable invoice number |
| `amount` | `number` | The topped-up value in rate scale (10000 = $1.00 of the subscription currency) |
| `currency` | `string` | The subscription currency |

```json
{
  "event": "balance.topped_up",
  "timestamp": "2026-06-15T11:20:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "invoiceId": "inv_t1u2v3",
    "invoiceNumber": "INV-0051",
    "amount": 500000,
    "currency": "usd"
  }
}
```

### balance.low

Fired when a subscription's prepaid balance crosses below 10% of its last refill (period reset, top-up, or manual adjustment). Emitted once per crossing.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `currentBalance` | `number` | The remaining balance in rate scale (10000 = $1.00 of the subscription currency) |
| `thresholdBalance` | `number` | The low-balance threshold that was crossed: 10% of the last refill, in rate scale |
| `currency` | `string` | The subscription currency |

```json
{
  "event": "balance.low",
  "timestamp": "2026-06-18T09:12:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "currentBalance": 90000,
    "thresholdBalance": 100000,
    "currency": "usd"
  }
}
```

### balance.depleted

Fired when a subscription's prepaid balance crosses to zero or below. With block-on-exhaustion plans further usage is rejected; otherwise the balance can go negative. Also fires `customer.state_changed` with trigger balance_depleted.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `currentBalance` | `number` | The balance after depletion in rate scale. Zero, or negative when overage is allowed |
| `currency` | `string` | The subscription currency |

```json
{
  "event": "balance.depleted",
  "timestamp": "2026-06-22T17:45:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "currentBalance": 0,
    "currency": "usd"
  }
}
```

## Quota & Usage Events

### quota.threshold_reached

Fired when a metered feature's usage crosses 80% of its included quantity for the current period. Emitted once per feature per billing period, when the crossing happens.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `featureCode` | `string` | The metered feature code |
| `currentUsage` | `number` | Total usage in the current period after the crossing |
| `includedAmount` | `number` | The included quantity for the period |
| `periodStart` | `string` | ISO 8601 start of the usage period |

```json
{
  "event": "quota.threshold_reached",
  "timestamp": "2026-06-18T09:12:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "featureCode": "api_calls",
    "currentUsage": 850,
    "includedAmount": 1000,
    "periodStart": "2026-06-01T00:00:00.000Z"
  }
}
```

### quota.exceeded

Fired when a metered feature passes its included quantity. With overage enabled it means overage billing began; with overage disabled it means the hard limit was hit and further usage is rejected (this case also fires `customer.state_changed` with trigger quota_exceeded). Emitted once per feature per billing period.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `featureCode` | `string` | The metered feature code |
| `currentUsage` | `number` | Total usage in the current period |
| `includedAmount` | `number` | The included quantity for the period |
| `overageEnabled` | `boolean` | True when overage billing began; false when the hard limit was hit and usage is now blocked |
| `periodStart` | `string` | ISO 8601 start of the usage period |

```json
{
  "event": "quota.exceeded",
  "timestamp": "2026-06-22T17:45:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "featureCode": "api_calls",
    "currentUsage": 1080,
    "includedAmount": 1000,
    "overageEnabled": true,
    "periodStart": "2026-06-01T00:00:00.000Z"
  }
}
```

### usage.recorded

Fired for every processed usage event. **HIGH VOLUME:** this fires once per tracked event, so it is excluded from family select-all in the dashboard — subscribe to it explicitly and make sure your endpoint can absorb your own ingest rate.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `usageEventId` | `string` | The usage event ID |
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `featureCode` | `string` | The feature code the usage was tracked against |
| `value` | `number` | The recorded quantity. For AI model events this is the total token count |
| `ts` | `string` | ISO 8601 timestamp of the usage event |

```json
{
  "event": "usage.recorded",
  "timestamp": "2026-06-18T09:12:03.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "usageEventId": "evt_9f8e7d6c",
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "featureCode": "api_calls",
    "value": 25,
    "ts": "2026-06-18T09:12:00.000Z"
  }
}
```

## Seat Events

### seats.updated

Fired when a customer's seat count changes for a seats-type feature — via the SDK seats endpoints or the dashboard. Also fires `customer.state_changed` with trigger seats_updated.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `subscriptionId` | `string \| null` | The live subscription ID, or null when the customer has no live subscription |
| `featureCode` | `string` | The seats feature code |
| `previousSeats` | `number` | The seat count before the change |
| `currentSeats` | `number` | The seat count after the change |

```json
{
  "event": "seats.updated",
  "timestamp": "2026-06-18T09:12:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "customerId": "user_123",
    "subscriptionId": "sub_1a2b3c4d",
    "featureCode": "editors",
    "previousSeats": 3,
    "currentSeats": 5
  }
}
```

### seats.limit_reached

Fired when a seat change reaches or passes the included seat limit of the customer's plan. Emitted once per crossing — only when the count moves from below the limit to at or above it.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `subscriptionId` | `string` | The subscription ID |
| `featureCode` | `string` | The seats feature code |
| `currentSeats` | `number` | The seat count after the change |
| `includedSeats` | `number` | The included seat limit of the plan |

```json
{
  "event": "seats.limit_reached",
  "timestamp": "2026-06-18T09:12:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "customerId": "user_123",
    "subscriptionId": "sub_1a2b3c4d",
    "featureCode": "editors",
    "currentSeats": 5,
    "includedSeats": 5
  }
}
```

## Add-on Events

### addon.activated

Fired when an add-on is activated on a subscription — via the API or a customer portal purchase. The prorated activation charge, if any, has already succeeded. Also fires `customer.state_changed` with trigger addon_activated.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `addon` | `object` | The add-on (`{ id, name }`) |
| `featureCode` | `string` | The feature the add-on unlocks or extends |
| `proratedPrice` | `number` | The prorated amount charged at activation in rate scale (10000 = $1.00). Zero when nothing was charged |
| `currency` | `string` | The subscription currency |

```json
{
  "event": "addon.activated",
  "timestamp": "2026-06-18T09:12:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "addon": { "id": "addon_5e6f7g8h", "name": "Extra Storage" },
    "featureCode": "storage",
    "proratedPrice": 25000,
    "currency": "usd"
  }
}
```

### addon.deactivated

Fired when an active add-on is deactivated from a subscription. Also fires `customer.state_changed` with trigger addon_deactivated.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID. Returns your externalId if you provided one when creating the customer, otherwise returns the Commet publicId |
| `addon` | `object` | The add-on (`{ id, name }`) |
| `featureCode` | `string` | The feature the add-on unlocked or extended |

```json
{
  "event": "addon.deactivated",
  "timestamp": "2026-06-18T09:12:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "user_123",
    "addon": { "id": "addon_5e6f7g8h", "name": "Extra Storage" },
    "featureCode": "storage"
  }
}
```

## Payout Events

### payout.available

Organization-level event about YOUR money as the merchant. Fired when payment funds the provider was holding become available to pay out to your bank.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `availableAmount` | `number` | Your full available payout balance in cents (100 = $1.00) at the time of the event — not just the newly released funds |
| `currency` | `string` | The payout balance currency. Always "usd" |

```json
{
  "event": "payout.available",
  "timestamp": "2026-06-12T06:00:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "availableAmount": 125000,
    "currency": "usd"
  }
}
```

### payout.created

Fired when a payout of your available balance is requested and the transfer toward your bank is initiated. The lifecycle continues with `payout.paid` or `payout.failed`.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `payoutId` | `string` | The payout ID |
| `amount` | `number` | Gross payout amount in cents (100 = $1.00) |
| `fee` | `number` | Provider transfer fee in cents |
| `netAmount` | `number` | What reaches your bank in cents (amount minus fee) |
| `currency` | `string` | The payout currency. Always "usd" |
| `status` | `string` | The payout status. "pending" at creation |
| `destinationBank` | `object \| null` | Destination bank display metadata: bankName and last4. Full account numbers never appear in webhook payloads |
| `createdAt` | `string` | ISO 8601 datetime when the payout was created |

```json
{
  "event": "payout.created",
  "timestamp": "2026-06-12T10:00:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "payoutId": "8b6f2a1c-4d3e-4f5a-9b8c-7d6e5f4a3b2c",
    "amount": 20000,
    "fee": 0,
    "netAmount": 20000,
    "currency": "usd",
    "status": "pending",
    "destinationBank": { "bankName": "CHASE", "last4": "6789" },
    "createdAt": "2026-06-12T10:00:00.000Z"
  }
}
```

### payout.paid

Fired when the bank settlement of a payout completes — the moment the money actually reaches your bank account, confirmed by the payment provider. Fires exactly once per payout.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `payoutId` | `string` | The payout ID |
| `amount` | `number` | Gross payout amount in cents (100 = $1.00) |
| `fee` | `number` | Provider transfer fee in cents |
| `netAmount` | `number` | What reached your bank in cents (amount minus fee) |
| `currency` | `string` | The payout currency. Always "usd" |
| `status` | `string` | Always "paid" for this event |
| `destinationBank` | `object \| null` | Destination bank display metadata: bankName and last4 |
| `paidAt` | `string \| null` | ISO 8601 datetime when the provider confirmed the deposit arrived |

```json
{
  "event": "payout.paid",
  "timestamp": "2026-06-14T09:00:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "payoutId": "8b6f2a1c-4d3e-4f5a-9b8c-7d6e5f4a3b2c",
    "amount": 20000,
    "fee": 0,
    "netAmount": 20000,
    "currency": "usd",
    "status": "paid",
    "destinationBank": { "bankName": "CHASE", "last4": "6789" },
    "paidAt": "2026-06-14T09:00:00.000Z"
  }
}
```

### payout.failed

Fired when the provider reports a payout could not be completed — most commonly a bank rejection (closed account, invalid details). The funds return to your available balance.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `payoutId` | `string` | The payout ID |
| `amount` | `number` | Gross payout amount in cents (100 = $1.00) |
| `fee` | `number` | Provider transfer fee in cents |
| `netAmount` | `number` | What would have reached your bank in cents |
| `currency` | `string` | The payout currency. Always "usd" |
| `status` | `string` | Always "failed" for this event |
| `destinationBank` | `object \| null` | Destination bank display metadata: bankName and last4 |
| `failedAt` | `string \| null` | ISO 8601 datetime when the failure was recorded |
| `failureCode` | `string \| null` | The provider's failure code, when available |
| `failureMessage` | `string \| null` | A human-readable failure message, when available |

```json
{
  "event": "payout.failed",
  "timestamp": "2026-06-14T09:00:00.000Z",
  "organizationId": "org_abc123",
  "mode": "live",
  "apiVersion": "2026-06-10",
  "data": {
    "payoutId": "8b6f2a1c-4d3e-4f5a-9b8c-7d6e5f4a3b2c",
    "amount": 20000,
    "fee": 0,
    "netAmount": 20000,
    "currency": "usd",
    "status": "failed",
    "destinationBank": { "bankName": "CHASE", "last4": "6789" },
    "failedAt": "2026-06-14T09:00:00.000Z",
    "failureCode": "account_closed",
    "failureMessage": "The bank account has been closed"
  }
}
```
