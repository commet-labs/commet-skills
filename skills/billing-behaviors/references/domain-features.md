# Features - Product Capabilities

Features are the capabilities sold in SaaS plans.

## Feature Types

| Type | What It Represents | How It's Charged |
|------|-------------------|------------------|
| **Boolean** | On/off access | Not charged (value in plan base) |
| **Metered** | Measurable consumption | Depends on consumption model |
| **Seats** | Per-user licenses | Advance + true-up |

## Metered Feature in Plans

| Field | Purpose |
|-------|---------|
| `includedAmount` | Units included free |
| `unlimited` | No limit if true |
| `overageEnabled` | If exceeding allowed (metered model) |
| `overageUnitPrice` | Price per unit in rate scale (10000 = $1.00) |
| `creditsPerUnit` | Credits consumed per unit (credits model) |

Regional overage prices stored in `plan_feature_currency` table.

## Seats Feature

Works the same regardless of consumption model. Charged advance at period start + prorated true-up for mid-period additions.

## Feature Code = SDK Identifier

`feature.code` IS the event identifier for the SDK:
```
Feature: "API Calls" → Code: "api_calls"
SDK: commet.usage.track({ feature: "api_calls", value: 1 })
```
