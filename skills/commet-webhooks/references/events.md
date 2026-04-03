# Webhook Events

All webhook payloads share this envelope:

```typescript
interface WebhookPayload {
  event: string;
  timestamp: string;       // ISO 8601
  organizationId: string;
  data: { /* event-specific */ };
}
```

## Subscription Events

### subscription.created

Fired when a new subscription is created, before payment is processed. Use for logging or analytics, not for granting access.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `publicId` | `string` | The public-facing subscription ID |
| `customerId` | `string` | The customer ID |
| `externalId` | `string \| null` | Your external ID for this customer |
| `planId` | `string` | The plan ID |
| `planName` | `string` | The plan name |
| `status` | `string` | The subscription status |
| `startDate` | `string \| null` | ISO 8601 datetime when the subscription starts |
| `name` | `string \| null` | The customer display name |

```json
{
  "event": "subscription.created",
  "timestamp": "2026-03-25T14:30:00.000Z",
  "organizationId": "org_abc123",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "publicId": "sub_pub_5e6f7g",
    "customerId": "cus_8h9i0j",
    "externalId": "user_123",
    "planId": "plan_pro_monthly",
    "planName": "Pro",
    "status": "pending",
    "startDate": "2026-03-25T14:30:00.000Z",
    "name": "Acme Corp"
  }
}
```

### subscription.activated

Fired when payment succeeds and the subscription becomes active. This is when you should grant access to your product.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `publicId` | `string` | The public-facing subscription ID |
| `customerId` | `string` | The customer ID |
| `externalId` | `string \| null` | Your external ID for this customer |
| `status` | `string` | The subscription status |
| `currentPeriodStart` | `string \| null` | ISO 8601 start of the current billing period |
| `currentPeriodEnd` | `string \| null` | ISO 8601 end of the current billing period |
| `name` | `string \| null` | The customer display name |
| `invoiceId` | `string` | The invoice ID for this payment |
| `invoiceNumber` | `string` | The human-readable invoice number |
| `invoiceTotal` | `number` | Invoice total in cents (100 = $1.00) |
| `invoiceCurrency` | `string` | The invoice currency code |

```json
{
  "event": "subscription.activated",
  "timestamp": "2026-03-25T14:32:00.000Z",
  "organizationId": "org_abc123",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "publicId": "sub_pub_5e6f7g",
    "customerId": "cus_8h9i0j",
    "externalId": "user_123",
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

Fired when a subscription is canceled, either by the customer or administratively.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID |
| `externalId` | `string \| null` | Your external ID for this customer |
| `status` | `string` | The subscription status |
| `canceledAt` | `string \| null` | ISO 8601 datetime when the subscription was canceled |
| `cancelReason` | `string \| null` | The reason for cancellation, if provided |
| `endDate` | `string \| null` | ISO 8601 datetime when the subscription ends |

```json
{
  "event": "subscription.canceled",
  "timestamp": "2026-04-20T10:15:00.000Z",
  "organizationId": "org_abc123",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "cus_8h9i0j",
    "externalId": "user_123",
    "status": "canceled",
    "canceledAt": "2026-04-20T10:15:00.000Z",
    "cancelReason": "Too expensive",
    "endDate": "2026-04-25T00:00:00.000Z"
  }
}
```

### subscription.updated

Fired when subscription details change, such as status transitions or metadata updates.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID |
| `externalId` | `string \| null` | Your external ID for this customer |
| `status` | `string` | The subscription status |
| `canceledAt` | `string \| null` | ISO 8601 datetime when the subscription was canceled |
| `cancelReason` | `string \| null` | The reason for cancellation, if provided |
| `endDate` | `string \| null` | ISO 8601 datetime when the subscription ends |

```json
{
  "event": "subscription.updated",
  "timestamp": "2026-04-10T08:00:00.000Z",
  "organizationId": "org_abc123",
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "cus_8h9i0j",
    "externalId": "user_123",
    "status": "active",
    "canceledAt": null,
    "cancelReason": null,
    "endDate": null
  }
}
```

### subscription.plan_changed

Fired when a subscription changes from one plan to another, including upgrades, downgrades, and billing interval changes.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | `string` | The subscription ID |
| `customerId` | `string` | The customer ID |
| `externalId` | `string \| null` | Your external ID for this customer |
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
  "data": {
    "subscriptionId": "sub_1a2b3c4d",
    "customerId": "cus_8h9i0j",
    "externalId": "user_123",
    "previousPlan": { "id": "plan_starter", "name": "Starter" },
    "currentPlan": { "id": "plan_pro", "name": "Pro" },
    "billingInterval": "monthly",
    "credit": 1500,
    "charge": 4900,
    "totalCharged": 3400
  }
}
```

## Payment Events

### payment.received

Fired when a recurring payment is successfully processed. The first checkout payment triggers `subscription.activated` instead -- this event is for subsequent renewals only.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `invoiceId` | `string` | The invoice ID |
| `invoiceNumber` | `string` | The human-readable invoice number |
| `invoiceTotal` | `number` | Invoice total in cents (100 = $1.00) |
| `customerId` | `string` | The customer ID |
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
  "data": {
    "invoiceId": "inv_n4o5p6",
    "invoiceNumber": "INV-0043",
    "invoiceTotal": 9900,
    "customerId": "cus_8h9i0j",
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

Fired when a recurring charge fails. Card declines during initial checkout do not trigger this event.

**Payload fields (`data`):**

| Field | Type | Description |
|-------|------|-------------|
| `invoiceId` | `string \| null` | The invoice ID, if available |
| `invoiceNumber` | `string \| null` | The human-readable invoice number, if available |
| `customerId` | `string` | The customer ID |
| `subscriptionId` | `string` | The subscription ID |
| `failureCode` | `string \| null` | The failure code from the payment processor |
| `failureMessage` | `string \| null` | A human-readable failure message |

```json
{
  "event": "payment.failed",
  "timestamp": "2026-04-25T00:05:00.000Z",
  "organizationId": "org_abc123",
  "data": {
    "invoiceId": "inv_n4o5p6",
    "invoiceNumber": "INV-0043",
    "customerId": "cus_8h9i0j",
    "subscriptionId": "sub_1a2b3c4d",
    "failureCode": "card_declined",
    "failureMessage": "Your card was declined."
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
| `customerId` | `string` | The customer ID |
| `subscriptionId` | `string` | The subscription ID |

```json
{
  "event": "invoice.created",
  "timestamp": "2026-04-25T00:00:00.000Z",
  "organizationId": "org_abc123",
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
    "customerId": "cus_8h9i0j",
    "subscriptionId": "sub_1a2b3c4d"
  }
}
```
