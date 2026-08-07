# CLI Setup Workflow

## New Project from Template

The fastest way to start. Creates a project with billing fully configured.

### 1. Install the CLI

```bash
npm install -g commet@^6
```

### 2. Scaffold a project

```bash
commet create my-saas
```

This will:
- Prompt you to authenticate (if needed)
- Select your sandbox organization
- Choose a billing template (fixed, seats, metered, credits, balance-ai, balance-fixed)
- Download the Next.js template
- Create plans and features in your sandbox org
- Generate an API key and save it to `.env`
- Link the project to your organization

### 3. Install dependencies and run

```bash
cd my-saas
npm install
npm run dev
```

Your project is ready with billing integration working against your sandbox organization.

## Existing Project Setup

Add Commet billing to an existing project.

### 1. Install the CLI and SDK

```bash
npm install -g commet@^6
npm install @commet/node@^10
```

### 2. Authenticate

```bash
commet login
```

Opens the browser for a device-code flow. One login covers everything -- sandbox vs live is decided by the organization you link, not by how you log in.

### 3. Link project to organization

```bash
commet link
```

Creates `.commet/config.json` with your organization settings and auto-generates an API key for resource commands. Link a sandbox organization for development.

### 4. Pull your billing config

```bash
commet pull
```

Generates `commet.config.ts` in the project root -- your features and plans as code:

```typescript
import { defineConfig } from "@commet/node";

export default defineConfig({
  schemaVersion: 1,
  features: {
    api_calls: { name: "API Calls", type: "usage", unitName: "call" },
  },
  plans: {
    pro: {
      name: "Pro",
      consumptionModel: "metered",
      defaultInterval: "monthly",
      prices: [{ interval: "monthly", amountInCents: 499 }],
      features: { api_calls: { included: 10_000 } },
    },
  },
});
```

### 5. Commit the config file

```bash
git add commet.config.ts
git commit -m "chore: add commet billing config"
```

Your billing config is versioned and reviewable like any other code. (`.commet/` stays gitignored -- it holds the project API key.)

### 6. Configure environment variables

```env
COMMET_API_KEY=ck_xxx             # From Commet dashboard > Settings > API Keys
COMMET_WEBHOOK_SECRET=whsec_xxx   # Optional, from dashboard > Webhooks
```

The key's organization decides sandbox vs live -- a sandbox organization's key only touches sandbox data.

### 7. Initialize the SDK

```typescript
import { Commet } from "@commet/node";

const commet = new Commet({
  apiKey: process.env.COMMET_API_KEY!,
});
```

## Keeping Config in Sync

Sync works in both directions:

**Dashboard changed?** Pull the remote state into your config file:

```bash
commet pull
git add commet.config.ts
git commit -m "chore: sync commet billing config"
```

**Config file changed?** Push your local edits to Commet:

```bash
commet push --dry-run     # Preview the diff
commet push               # Apply
```

## Switching Between Sandbox and Live

There is one base URL and one login. Sandbox and live are organization modes -- switch by linking a different organization:

```bash
commet orgs                        # List your orgs and their modes
commet link --org acme-sandbox     # Link the sandbox org
commet link --org acme             # Link the live org
commet pull                        # Re-sync commet.config.ts for that org
```

## Multiple Organizations

If you work with multiple organizations:

```bash
commet orgs                   # See what you have access to
commet link --org <slug>      # Switch the project link
commet pull                   # Re-pull the config for the new org
```

## CI/CD Considerations

In CI/CD, skip `commet login` and `commet link` entirely:
- Set the `COMMET_API_KEY` environment variable -- it takes precedence over any project config
- Use `--yes` to skip prompts and `--output agent` for structured JSON
- `COMMET_API_KEY=ck_... commet push --yes` applies `commet.config.ts` in a pipeline
- The SDK reads `COMMET_API_KEY` from the environment automatically
