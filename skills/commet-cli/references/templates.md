# CLI Templates

Templates scaffold a complete Next.js project with billing pre-configured. Each template targets a specific billing model and creates the corresponding plans and features in your sandbox organization.

```bash
commet create my-app --template <template-name>
```

## fixed

**Fixed subscriptions with boolean features.**

Best for products with tiered plans where each tier unlocks specific capabilities. No usage tracking needed -- customers pay a flat fee for access to features.

Examples: project management tools, CMS platforms, design tools with plan-gated features.

```
Plan: Starter ($29/mo)
├── Custom Branding: off
├── API Access: off
└── Priority Support: off

Plan: Pro ($99/mo)
├── Custom Branding: on
├── API Access: on
└── Priority Support: off

Plan: Enterprise ($299/mo)
├── Custom Branding: on
├── API Access: on
└── Priority Support: on
```

## seats

**Per-seat billing for team collaboration.**

Best for products where value scales with team size. Seats are charged in advance at period start, with prorated true-up for mid-cycle additions.

Examples: team chat, project management, CRM, collaborative editors.

```
Plan: Team ($15/seat/mo)
├── Seats: editor (min 1)
└── Seats: viewer (free)

Plan: Business ($25/seat/mo)
├── Seats: editor (min 1)
├── Seats: viewer (free)
└── Admin Console: on
```

## metered

**Usage-based billing with included amounts and overage.**

Best for products where customers pay for what they use, with a baseline included in the plan. Overage is billed at period end (true-up).

Examples: API platforms, email services, CDN, data processing.

```
Plan: Starter ($49/mo)
├── API Calls: 10,000 included, $0.005/extra
└── Storage: 5 GB included, $0.50/GB extra

Plan: Growth ($149/mo)
├── API Calls: 100,000 included, $0.003/extra
└── Storage: 50 GB included, $0.30/GB extra
```

## credits

**Credit-based consumption with packs and top-ups.**

Best for products where customers buy credits in advance and consume them over time. When credits are exhausted, access stops until more are purchased.

Examples: image generation, document processing, SMS platforms.

```
Plan: Starter ($29/mo)
├── Credits: 100 included/month
└── Credit Packs: 50 for $10, 200 for $35

Plan: Pro ($79/mo)
├── Credits: 500 included/month
└── Credit Packs: 50 for $10, 200 for $35
```

## balance-ai

**AI product with automatic token cost tracking and margin.**

Best for AI-powered products that need to bill based on LLM token consumption. Customers load a balance, and costs are deducted in real-time based on actual token usage with configurable margins.

Examples: AI chatbots, AI writing assistants, AI code tools, AI image generators.

```
Plan: Developer ($0/mo, pay-as-you-go)
├── AI Generation: balance model
├── Token pricing from AI model catalog
└── Configurable margin (basis points)

Plan: Pro ($49/mo)
├── AI Generation: $20 balance included
├── Top-up: $10, $25, $50, $100
└── Same token pricing with margin
```

## balance-fixed

**Prepaid balance with fixed unit prices.**

Best for products with predictable per-unit costs that aren't tied to AI models. Customers load a balance and each action deducts a fixed amount.

Examples: SMS/messaging, email sends, report generation, data exports.

```
Plan: Starter ($0/mo, pay-as-you-go)
├── Messages: $0.01/message from balance
└── Top-up: $10, $25, $50

Plan: Business ($99/mo)
├── Messages: $50 balance included
├── Lower rate: $0.008/message
└── Top-up: $25, $50, $100
```

## Choosing a Template

| If your product... | Use |
|--------------------|-----|
| Has tiered plans with on/off features | `fixed` |
| Charges per team member | `seats` |
| Charges for API calls, storage, or bandwidth with overage | `metered` |
| Uses a credit system (buy credits, spend credits) | `credits` |
| Bills for AI/LLM token usage | `balance-ai` |
| Bills per action at fixed prices (SMS, email) | `balance-fixed` |
