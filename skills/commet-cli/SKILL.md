---
name: commet-cli
description: Use when working with the Commet CLI -- logging in, linking projects, pulling types for autocomplete, scaffolding new projects from templates (fixed, seats, metered, credits, balance-ai, balance-fixed), or managing organizations.
license: Apache-2.0
metadata:
  author: commet
  version: "1.0.0"
  homepage: https://commet.co
  source: https://github.com/commet-labs/commet-skills
references:
  - references/commands.md
  - references/templates.md
  - references/setup-workflow.md
---

# Commet CLI

Generate TypeScript types from your Commet dashboard for autocomplete, scaffold new projects from billing templates, and manage organizations. Requires Node.js 18+.

## Install

```bash
npm install -g commet
```

## Quick Start

```bash
commet login          # Authenticate in browser
commet link           # Link project to organization
commet pull           # Generate .commet/types.d.ts
```

After `commet pull`, SDK calls get autocomplete for `planCode`, `feature`, and `seatType` parameters:

```typescript
await commet.usage.track({
  externalId: "user_123",
  feature: "api_calls",       // autocomplete from pulled types
});

await commet.subscriptions.create({
  externalId: "user_123",
  planCode: "pro",            // autocomplete from pulled types
});
```

## Commands

| Command | Description |
|---------|-------------|
| `commet login` | Authenticate with Commet (opens browser) |
| `commet logout` | Remove credentials |
| `commet whoami` | Show auth status and current organization |
| `commet link` | Link project to an organization |
| `commet unlink` | Unlink project |
| `commet switch` | Switch to a different organization |
| `commet info` | Show project and auth status |
| `commet pull` | Generate `.commet/types.d.ts` |
| `commet list features` | List features for the linked organization |
| `commet list seats` | List seat types |
| `commet list plans` | List plans |
| `commet create [name]` | Scaffold new project from a billing template |

See [references/commands.md](references/commands.md) for full details.

## Templates

Scaffold a complete Next.js project with billing pre-configured:

```bash
commet create my-app
```

| Template | Billing Model |
|----------|--------------|
| `fixed` | Fixed subscriptions with boolean features |
| `seats` | Per-seat billing for team collaboration |
| `metered` | Usage-based with included amounts and overage |
| `credits` | Credit-based consumption with packs and top-ups |
| `balance-ai` | AI product with automatic token cost tracking |
| `balance-fixed` | Prepaid balance with fixed unit prices |

See [references/templates.md](references/templates.md) for details on each template.

## Key Gotchas

1. **`commet create` is sandbox-only.** Templates create plans and features in your sandbox organization. If you're logged into production, you need to `commet logout` and log back in to sandbox.

2. **Commit `.commet/types.d.ts`.** The generated types file should be committed to your repo so the entire team gets autocomplete without each person running `commet pull`.

3. **Two environments, two logins.** Sandbox (`sandbox.commet.co`) and Production (`commet.co`) are isolated. Switch by logging out and back in.

4. **Run `commet pull` after dashboard changes.** When you add plans, features, or seat types in the dashboard, re-run `commet pull` to update the local types file.

## When to Load References

- **Full command flags and details** -> [references/commands.md](references/commands.md)
- **Template descriptions and billing models** -> [references/templates.md](references/templates.md)
- **Step-by-step project setup** -> [references/setup-workflow.md](references/setup-workflow.md)
