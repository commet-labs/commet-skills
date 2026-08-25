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
- `skills/migrate-commet-v8-to-v9/` — Repository-aware independent Offers and Markets migration checklist

## Version policy

- `commet` documents only the current stable SDK and API contract.
- A major-version boundary gets its own `migrate-commet-vN-to-vN+1` skill linked from that release's changelog.
- Keep prior migration skills available for older integrations. Correct factual errors, but do not rewrite them into the next migration.

## Sources of truth

- Skills own workflows, safety boundaries, and behavioral knowledge that generated contracts cannot express.
- Exact SDK methods, types, errors, webhooks, examples, CLI capabilities, package versions, and API versions come from the documentation and manifests installed with each SDK.
- A skill must inspect the installed artifact before naming contract details. Node workflows also consume `commet doctor --output agent` when available.
- Do not add copied API, event, payload, error, command, or package-version inventories to this repository.
- Any workflow with remote effects must require the exact organization and `sandbox` or `live` mode before execution.
- Run `node scripts/check-skills.mjs` after changing a skill or its references.
