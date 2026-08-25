---
name: commet-cli
description: Operate the installed Commet CLI for project setup, local diagnostics, agent rules, organization linking, configuration sync, webhook forwarding, scaffolding, and resource commands. Use the CLI's installed capabilities and version-matched documentation instead of a copied command inventory, and require explicit organization and sandbox or live context before effects.
---

# Commet CLI

Use the installed CLI as the command contract. Do not rely on a command or flag list embedded in this skill.

## Inspect first

1. Resolve the executable the project actually uses and record its version.
2. Run `commet --output agent` for the installed capability manifest and `commet <command> --help` for the exact command being considered.
3. When `@commet/node` or another Node integration is installed, read `node_modules/@commet/node/docs/manifest.json`, its entrypoint, and the installed CLI documentation it indexes.
4. Run `commet doctor --output agent` from the project root and address failed package, documentation, compatibility, API-version, or project-context checks before changing the integration.

If the installed CLI does not expose a command or flag, do not substitute one from this skill, training data, or the latest website.

## Choose the workflow

- For local diagnosis, run doctor and report its structured evidence without printing secret values.
- For agent instructions, use the installed `agents` capability. Setup mutates repository files, so run it only when the user explicitly asks.
- For configuration sync, inspect the installed pull or push capability, preview the exact diff when supported, and preserve project-owned configuration.
- For webhook forwarding, confirm the local destination, requested event scope, and process lifetime before starting it.
- For scaffolding, confirm the destination directory and organization context before creating files or remote resources.
- For resource operations, derive resources, actions, parameters, and output format from the installed capability manifest and help output.

## Guard effects

Before a command that writes local files, state the exact target and require the user's request to authorize that local mutation.

Before a command that links a project, pushes configuration, creates or mutates a remote resource, or forwards remote events:

1. State whether the effect is remote or both local and remote.
2. Require the exact organization and `sandbox` or `live` mode. Use a passing `PROJECT_CONTEXT_VALID` doctor check when available.
3. Show the documented preview or dry run when the installed command supports one.
4. Do not perform a live write unless the user's request explicitly authorizes it.

Authentication commands may open a browser or store credentials. Explain that effect before running them. Never print credentials or secret values, and never invent a non-interactive flag that the installed CLI does not advertise.

## Verify

After the requested operation, use structured output or a documented read command to verify the result. For repository writes, show the resulting diff and preserve unrelated user changes.
