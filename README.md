# Commet Skills

Agent Skills for the [Commet](https://commet.co) billing platform. They give an agent repeatable billing workflows while exact APIs, errors, webhooks, and CLI capabilities come from the Commet packages installed in the user's project.

## Install

```bash
npx skills add commet-labs/skills
```

## Skills

| Skill | Description |
|-------|-------------|
| `commet` | Version-matched SDK integration across Node, Python, Go, Java, and PHP |
| `billing-behaviors` | Business behavior — proration, plan changes, subscription lifecycle |
| `commet-cli` | CLI workflows — diagnostics, setup, sync, forwarding, and resources |
| `commet-webhooks` | Webhook workflow — contract discovery, verification, idempotency, and handling |
| `ai-billing` | AI usage billing — measurement, configuration, idempotency, and verification |
| `migrate-commet-v7-to-v8` | Repository-aware migration from SDK v7 to the direct-response v8 contract |
| `migrate-commet-v8-to-v9` | Repository-aware migration to independent Offers and top-level Markets |

## Install a single skill

```bash
npx skills add commet-labs/skills --skill commet
npx skills add commet-labs/skills --skill ai-billing
npx skills add commet-labs/skills --skill migrate-commet-v7-to-v8
npx skills add commet-labs/skills --skill migrate-commet-v8-to-v9
```

`commet` follows the current stable contract. Versioned migration skills remain scoped to one major boundary and are linked from the matching API changelog.

## Installed context

Every Commet SDK ships documentation that matches its installed contract. The skills locate that documentation through the project's package manager and read its machine-readable manifest before changing an integration. Node projects also use the local, read-only `commet doctor --output agent` report.

The skills intentionally do not copy current method, event, error, payload, or command inventories. Updating a Commet SDK updates its code, types, and documentation together without requiring a matching skill release.

Remote effects require the exact organization and `sandbox` or `live` mode. Installing or loading a skill never contacts Commet or changes billing resources.

## Prerequisites

- A [Commet](https://commet.co) account (free to start)
- An API key from the [Commet dashboard](https://commet.co)

## Links

- [Documentation](https://commet.co/docs)
- [MCP Server](https://commet.co/commet-mcp)
- [Agent Skills](https://commet.co/agent-skills)
- [GitHub](https://github.com/commet-labs/commet)

## License

MIT
