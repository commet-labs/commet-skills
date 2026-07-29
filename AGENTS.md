# Commet Skills

Distribution repo for Commet agent skills. Install with:

    npx skills add commet-labs/skills

## Skills

- `skills/commet/` — Core SDK integration (@commet/node, @commet/next, @commet/ai-sdk, @commet/better-auth)
- `skills/billing-behaviors/` — Business logic rules for billing, proration, subscription changes
- `skills/commet-cli/` — CLI commands, project setup, template scaffolding
- `skills/commet-webhooks/` — Webhook setup, event handling, signature verification
- `skills/ai-billing/` — AI token billing, balance model, cost tracking with margins
- `skills/migrate-commet-v7-to-v8/` — Repository-aware SDK v7 to v8 migration checklist

## Version policy

- `commet` documents only the current stable SDK and API contract.
- A major-version boundary gets its own `migrate-commet-vN-to-vN+1` skill linked from that release's changelog.
- Keep prior migration skills available for older integrations. Correct factual errors, but do not rewrite them into the next migration.
