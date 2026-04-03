# CLI Command Reference

## Authentication

### commet login

Authenticate with Commet. Opens a browser window for OAuth login.

```bash
commet login
```

Prompts for environment selection (Sandbox or Production), then opens the browser. On success, credentials are stored in `~/.commet/auth.json`.

### commet logout

Remove stored credentials.

```bash
commet logout
```

### commet whoami

Show the currently authenticated user and active organization.

```bash
commet whoami
```

## Project Management

### commet link

Link the current project to a Commet organization. Creates a `.commet/config.json` file in the project root.

```bash
commet link
```

If you have multiple organizations, prompts for selection.

### commet unlink

Remove the project link. Deletes `.commet/config.json`.

```bash
commet unlink
```

### commet info

Show project status: authentication, linked organization, and environment.

```bash
commet info
```

## Organization Management

### commet list

List resources for the linked organization.

```bash
commet list features    # List all features
commet list seats       # List all seat types
commet list plans       # List all plans
```

### commet switch

Switch to a different organization. Prompts for selection if you have multiple organizations.

```bash
commet switch
```

## Type Generation

### commet pull

Generate `.commet/types.d.ts` from your dashboard configuration. This file provides TypeScript autocomplete for plan codes, feature codes, and seat types across all `@commet/node` SDK calls.

```bash
commet pull
```

**Output:** Creates or updates `.commet/types.d.ts` in the project root.

**When to re-run:** After adding, renaming, or removing plans, features, or seat types in the Commet dashboard.

**Tip:** Commit `.commet/types.d.ts` to version control so the entire team gets autocomplete.

## Project Scaffolding

### commet create

Scaffold a new Next.js project from a billing template. Creates the project directory, downloads the template, provisions plans and features in your sandbox organization, generates an API key, and links the project.

```bash
commet create [name]
```

**Options:**

| Flag | Description |
|------|-------------|
| `-t, --template <name>` | Template to use (skip selection prompt) |
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

# List available templates
commet create --list
```

**What it does:**
1. Prompts for project name (if not provided)
2. Authenticates (if not already logged in)
3. Selects organization
4. Selects billing template
5. Downloads template from GitHub
6. Creates plans and features in the sandbox organization
7. Creates an API key and writes it to `.env`
8. Links the project to the organization
9. Optionally installs agent skills

**Sandbox only:** `commet create` requires the sandbox environment. Log out and back in to sandbox if needed.

## Configuration Files

| File | Created By | Purpose |
|------|-----------|---------|
| `~/.commet/auth.json` | `commet login` | Global auth credentials |
| `.commet/config.json` | `commet link` | Project organization settings |
| `.commet/types.d.ts` | `commet pull` | Generated TypeScript types |

## Environment Switching

Sandbox and Production are fully isolated environments with separate authentication.

```bash
# Switch from production to sandbox
commet logout
commet login     # Select "Sandbox"
commet link      # Link to sandbox org
commet pull      # Pull sandbox types
```

## Updating

```bash
npm update -g commet
```
