# CLI Setup Workflow

## New Project from Template

The fastest way to start. Creates a project with billing fully configured.

### 1. Install the CLI

```bash
npm install -g commet
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

Your project is ready with billing integration working in sandbox mode.

## Existing Project Setup

Add Commet billing to an existing project.

### 1. Install the CLI and SDK

```bash
npm install -g commet
npm install @commet/node
```

### 2. Authenticate

```bash
commet login
```

Opens the browser for OAuth. Select your environment (Sandbox for development, Production for live).

### 3. Link project to organization

```bash
commet link
```

Creates `.commet/config.json` with your organization settings.

### 4. Pull types for autocomplete

```bash
commet pull
```

Generates `.commet/types.d.ts`. This file provides TypeScript autocomplete for:
- Plan codes (e.g. `"pro"`, `"enterprise"`)
- Feature codes (e.g. `"api_calls"`, `"team_members"`)
- Seat types (e.g. `"editor"`, `"viewer"`)

### 5. Commit the types file

```bash
git add .commet/types.d.ts
git commit -m "chore: add commet types for autocomplete"
```

The entire team gets autocomplete without each person running `commet pull`.

### 6. Configure environment variables

```env
COMMET_API_KEY=ck_xxx             # From Commet dashboard > Settings > API Keys
COMMET_ENVIRONMENT=sandbox        # sandbox | production
COMMET_WEBHOOK_SECRET=whsec_xxx   # Optional, from dashboard > Webhooks
```

### 7. Initialize the SDK

```typescript
import { Commet } from "@commet/node";

const commet = new Commet({
  apiKey: process.env.COMMET_API_KEY!,
  environment: "production",
});
```

## Updating Types After Dashboard Changes

When you add, rename, or remove plans, features, or seat types in the Commet dashboard:

```bash
commet pull
git add .commet/types.d.ts
git commit -m "chore: update commet types"
```

## Switching Environments

Sandbox and Production are isolated. To switch:

```bash
commet logout
commet login          # Select the other environment
commet link           # Link to the org in that environment
commet pull           # Pull types for that environment
```

## Multiple Organizations

If you work with multiple organizations:

```bash
commet switch         # Prompts for organization selection
commet pull           # Re-pull types for the new org
```

## CI/CD Considerations

The CLI is interactive and designed for local development. In CI/CD:
- Use `COMMET_API_KEY` environment variable directly -- no `commet login` needed
- Commit `.commet/types.d.ts` so CI doesn't need `commet pull`
- The SDK reads `COMMET_API_KEY` from the environment automatically
