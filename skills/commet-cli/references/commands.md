# CLI Command Reference

Run `commet` with no arguments for a status screen (auth, linked org, config file) and the full command list. Automation-friendly commands (`pull`, `push`, `orgs`, `link`, and every resource command) accept `--output agent` for structured JSON output without prompts -- and when piped with no arguments, `commet` prints its capabilities as JSON. The config contract in this reference requires Commet CLI 6.0.0+ and `@commet/node` 10.0.0+.

## Authentication

### commet login

Authenticate with Commet. Opens a browser device-code flow -- you confirm in the browser and the CLI stores your token locally.

```bash
commet login
```

On success, credentials are stored in `~/.commet/auth.json`. If `COMMET_API_KEY` is set, login is not needed.

### commet logout

Remove stored credentials.

```bash
commet logout
```

## Project Management

### commet link

Link the current project to a Commet organization. Creates `.commet/config.json` (added to `.gitignore`) and auto-generates an API key for resource commands. Re-run to switch organizations.

```bash
commet link                  # Interactive -- choose from a list
commet link --org acme       # Non-interactive -- match by slug or ID
commet link --org other      # Re-run to switch organization
commet link --clear          # Unlink project (removes .commet/)
```

**Options:**

| Flag | Description |
|------|-------------|
| `--org <slug-or-id>` | Organization slug or ID -- skips interactive selection |
| `--clear` | Unlink project from its organization |

### commet orgs

List all organizations you have access to. Shows name, slug, mode (live/sandbox), and which one is currently linked. The slug shown here is what you pass to `commet link --org <slug>`.

```bash
commet orgs
commet orgs --output agent   # JSON array for agent/CI use
```

## Config as Code

### commet pull

Fetch your billing config from Commet and generate (or update) `commet.config.ts` with features and plans. Shows a diff against your local config and asks to confirm before overwriting.

```bash
commet pull                  # Interactive -- shows diff, asks to confirm
commet pull --dry-run        # Preview changes without applying
commet pull --yes            # Apply without confirmation
commet pull --output agent --yes   # Agent/CI -- structured JSON, no prompts
```

**Output:** Creates or updates `commet.config.ts` in the project root (`.js` and `.mjs` config files are also recognized).

**When to re-run:** After adding, renaming, or removing plans or features in the Commet dashboard.

### commet push

Push your local `commet.config.ts` to Commet. Creates or updates features and plans to match your config file.

```bash
commet push                  # Interactive -- shows diff, asks to confirm
commet push --dry-run        # Preview what would change on remote
commet push --yes            # Push without confirmation
COMMET_API_KEY=ck_... commet push --yes   # CI pipeline
```

**Blocked:** Feature type changes (e.g. `boolean` -> `usage`) must be done in the dashboard; `commet push` refuses them.

The config contract is versioned and uses one base-price representation:

```typescript
import { defineConfig } from "@commet/node";

export default defineConfig({
  schemaVersion: 1,
  features: {},
  plans: {
    pro: {
      name: "Pro",
      defaultInterval: "monthly",
      prices: [{ interval: "monthly", amountInCents: 499 }],
    },
  },
});
```

`amountInCents` is non-negative integer USD cents (`499` = `$4.99`). Config overage `unitPrice` is positive integer rate scale (`10_000` = `$1.00` per unit). Resource monetary flags use integer currency minor units except rate fields; percentage and margin values use integer basis points. Counts, credits, and trial days use safe whole numbers.

To migrate an older config with `amount`:

1. Commit or back up `commet.config.ts`.
2. Add `schemaVersion: 1`.
3. Replace each generated integer directly (`amount: 499` becomes `amountInCents: 499`). Convert hand-written decimal USD to exact cents (`amount: 4.99` becomes `amountInCents: 499`).
4. Run `commet push --dry-run` and review the diff before applying it.

Do not add a compatibility field. The CLI validates before the request, the server validates again, and one push applies all its feature and plan changes in one transaction. Omitted resources are not deleted. Every failure exits non-zero. Config validation and push-rejection responses in `--output agent` include stable `code`, `path`, `expected`, and `received` fields; network and authentication failures may include only `code` and `message`.

## Development

### commet listen

Forward webhook events from Commet to your local server in real time. Opens a persistent connection and replays every event as an HTTP POST to your URL. Prints the signing secret to verify signatures locally.

```bash
commet listen 3000                          # Forward to http://localhost:3000/
commet listen localhost:3000/webhooks        # Forward to a specific path
commet listen 3000 --events payment.received # Only forward successful payments
```

**Options:**

| Flag | Description |
|------|-------------|
| `--events <types>` | Only forward these event types (comma-separated) |

## Resource Commands

Every SDK resource is available as a CLI command: `commet <resource> <action> [flags]`. Actions are kebab-case versions of the SDK methods, and flags map to the SDK parameters.

| Resource | Example actions |
|----------|-----------------|
| `customers` | `create`, `create-batch`, `get`, `update`, `list` |
| `subscriptions` | `create`, `get-active`, `cancel`, `uncancel`, `reactivate`, `create-recovery-link`, `update-payment-method`, `change-plan`, `preview-change`, `list`, `activate-addon`, `deactivate-addon`, `adjust-balance`, `topup-balance`, `purchase-credits` |
| `plans` | `list`, `get`, `create`, `update`, `delete`, `set-visibility`, `add-feature`, `update-feature`, `remove-feature`, `add-price`, `update-price`, `delete-price`, `set-default-price`, `set-regional-prices`, `delete-regional-prices` |
| `features` | `list`, `get`, `create`, `update`, `delete` |
| `feature-access` | `list`, `get` |
| `seats` | `add`, `remove`, `set`, `set-all`, `get-balance`, `get-all-balances` |
| `usage` | `track`, `check` |
| `portal` | `get-url` |
| `addons` | `list`, `list-active`, `get`, `create`, `update`, `delete` |
| `credit-packs` | `list`, `create`, `update`, `delete` |
| `webhooks` | `list`, `create`, `get`, `update`, `delete`, `test` |
| `api-keys` | `list`, `create`, `delete` |
| `invoices` | `list`, `get`, `create-adjustment`, `get-download-url`, `send`, `update-status` |
| `transactions` | `list`, `get`, `refund`, `retry` |
| `offers` | `list`, `get`, `create`, `update`, `delete` |
| `promo-codes` | `list`, `get`, `create`, `update` |
| `markets` | `list`, `get`, `create`, `update`, `delete` |
| `plan-groups` | `list`, `get`, `create`, `update`, `delete`, `add-plan`, `remove-plan`, `reorder-plans` |
| `payments` | `create`, `charge`, `get`, `list`, `cancel` |
| `payouts` | `request`, `add-bank-account`, `complete-verification` |
| `test-clock` | `get`, `advance`, `process-billing` (sandbox only) |
| `quota` | `add`, `set`, `remove`, `get`, `get-all` |

**Examples:**

```bash
commet customers create --email jane@acme.com --id user_123
commet subscriptions get-active --customer-id user_123
commet usage track --feature-code api_calls --customer-id user_123 --value 5 --event-id request_123
commet usage check --feature-code api_calls --customer-id user_123 --quantity 1
commet offers create --name "Launch" --phases '[{"type":"percentage","percentage":2500,"durationCycles":3}]'
commet promo-codes create --code LAUNCH25 --offer-id ofr_launch
commet markets create --name "Southern Cone" --country-codes '["AR","BO","PY","UY"]'
commet plans list --output agent
```

Run `commet <resource> <action> --help` for the full flag list of any action.

**Authentication:** Resource commands resolve an API key in this order: `COMMET_API_KEY` env var -> project key in `.commet/config.json` (auto-generated by `commet link`) -> error. They do not use your `commet login` session.

## Project Scaffolding

### commet create

Scaffold a new Next.js project from a billing template. Creates the project directory, downloads the template, provisions plans and features in a sandbox organization, generates an API key, and links the project.

```bash
commet create [name]
```

**Options:**

| Flag | Description |
|------|-------------|
| `-t, --template <name>` | Template to use (skip selection prompt) |
| `--org <slug>` | Organization slug or ID (skips selection) |
| `--skills` / `--no-skills` | Install or skip agent skills |
| `-y, --yes` | Accept defaults for optional prompts |
| `--ref <ref>` | Git ref to fetch templates from (default: `main`) |
| `--list` | List available templates |

**Examples:**

```bash
# Interactive -- prompts for name, org, template
commet create

# Specify name
commet create my-saas

# Specify name and template
commet create my-saas --template metered

# Non-interactive
commet create my-saas -t metered --org acme-sandbox -y

# List available templates
commet create --list
```

**What it does:**
1. Prompts for project name (if not provided)
2. Authenticates (if not already logged in)
3. Selects a sandbox organization
4. Selects billing template
5. Downloads template from GitHub
6. Creates plans and features in the sandbox organization
7. Creates an API key and writes it to `.env`
8. Links the project to the organization
9. Optionally installs agent skills

**Sandbox only:** Templates provision plans and features, so `commet create` only offers sandbox organizations. No separate login is required.

## Configuration Files

| File | Created By | Purpose |
|------|-----------|---------|
| `~/.commet/auth.json` | `commet login` | Global auth credentials |
| `.commet/config.json` | `commet link` | Linked org + auto-generated API key (gitignored) |
| `commet.config.ts` | `commet pull` | Billing config as code (features and plans) |

## Environments

There is one base URL (`https://commet.co`) and one login. Sandbox and live are organization modes, not separate endpoints: each organization is either sandbox or live, and its API keys only touch that organization's data. To move between them, link a different organization:

```bash
commet orgs                        # See your orgs and their modes
commet link --org acme-sandbox     # Work against sandbox data
commet link --org acme             # Work against live data
commet pull                        # Re-sync commet.config.ts for the new org
```

## Agents and CI

```bash
commet                                   # JSON capabilities when piped (no args)
commet pull --output agent --yes         # Structured output, no prompts
commet push --output agent --dry-run     # Preview as JSON
COMMET_API_KEY=ck_... commet push --yes  # CI pipeline -- no login or link needed
```

## Updating

```bash
npm update -g commet
```
