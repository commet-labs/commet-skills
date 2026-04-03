# Commet Skills

Agent Skills for the [Commet](https://commet.co) billing platform. Give your AI agent expert-level billing knowledge — subscriptions, usage tracking, pricing models, and payments.

## Install

```bash
npx skills add commet-labs/commet-skills
```

## Skills

| Skill | Description |
|-------|-------------|
| `commet` | Core SDK integration — @commet/node, @commet/next, @commet/ai-sdk, @commet/better-auth |
| `billing-behaviors` | Business logic rules — proration, plan changes, subscription lifecycle |
| `commet-cli` | CLI commands — login, link, pull types, scaffold from templates |
| `commet-webhooks` | Webhook setup — event handling, signature verification, framework handlers |
| `ai-billing` | AI token billing — tracked() middleware, balance model, cost calculation |

## Install a single skill

```bash
npx skills add commet-labs/commet-skills --skill commet
npx skills add commet-labs/commet-skills --skill ai-billing
```

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
