# Commet Skills

Agent Skills for the [Commet](https://commet.co) billing platform. Give your AI agent expert-level billing knowledge — subscriptions, usage tracking, pricing models, and payments.

## Install

```bash
npx skills add commet-labs/skills
```

## Skills

| Skill | Description |
|-------|-------------|
| `commet` | Core SDK integration — @commet/node, @commet/next, @commet/ai-sdk, @commet/better-auth |
| `billing-behaviors` | Business logic rules — proration, plan changes, subscription lifecycle |
| `commet-cli` | CLI commands — login, link, config push/pull, webhook forwarding, scaffold from templates |
| `commet-webhooks` | Webhook setup — event handling, signature verification, framework handlers |
| `ai-billing` | AI token billing — tracked() middleware, balance model, cost calculation |
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
