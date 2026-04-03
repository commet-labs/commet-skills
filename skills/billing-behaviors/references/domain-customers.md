# Customers - Customer Management

Customers are the billable entities. Each customer represents a company or person that pays.

## Key Fields

- `fullName`: Company or person name
- `billingEmail`: Where invoices are sent
- `timezone`: Display metadata (all billing runs in UTC)
- `externalId`: Your app's user/org ID (for SDK integration)

## External ID

Links your app's users to Commet customers. Used in SDK calls for usage tracking, seat changes, etc.

## Address

Billing address for invoices. Country used for tax calculations and **currency detection** at checkout.

## Customer Credits

Money credits ($) applied to future invoices in FIFO order. Can have expiration dates. Created on plan downgrade (unused portion), manual refund, or promotional. Different from consumption credits in the credits model.

## Business Flow

1. Create Customer (via dashboard or SDK)
2. Assign Plan (from customer detail → creates subscription)
3. Automatic Billing (engine processes subscription)

## Interactions

| Module | Interaction |
|--------|-------------|
| **Subscriptions** | A customer has one active subscription |
| **Billing** | Invoices generated for the customer |
| **Usage** | Usage events associated with the customer |
| **Seats** | Seat events associated with the customer |
| **Balance/Credits** | Consumption tracking via subscription |
