---
name: migrate-commet-v7-to-v8
description: Migrate a Commet integration from SDK v7 and API 2026-07-11 to SDK v8 and API 2026-07-24 across Node, Python, Go, Java, or PHP. Use the versioned changelog and target SDK's installed documentation as the contract while removing v7 usage without compatibility shims.
---

# Migrate Commet v7 to v8

Use the versioned changelog as the boundary definition:
https://commet.co/changelog/offers-and-pricing

This skill sequences the migration. It does not duplicate the changelog's method, field, route, error, or webhook inventory.

## 1. Confirm the boundary

Inspect dependency manifests, lockfiles, imports, client initialization, exported Commet types, raw REST requests, webhook handlers, CLI use, and explicit API or webhook pins across Node, Python, Go, Java, and PHP project files.

Confirm that the active integration is on the v7 to v8 boundary. If it is older, apply earlier migration guidance first. If it is already newer, do not force this migration onto it.

## 2. Install and read the target contract

Upgrade only the active language SDK to its v8 major using that ecosystem's package manager. Resolve `docs/manifest.json` from the installed target artifact, read its entrypoint, and use its generated reference and types for every replacement.

When Node is present, run `commet doctor --output agent` after installing and resolve failed package, documentation, compatibility, API-version, or project-context checks.

Read the versioned changelog for the complete source-to-target differences. Do not recreate removed v7 methods, response wrappers, routes, or aliases by hand; the versioned server contract owns compatibility for clients that remain pinned.

## 3. Migrate one concern at a time

1. Update imports and client initialization.
2. Replace each request and response using the target installed types and changelog.
3. Update raw API and webhook pins only for consumers included in this migration.
4. Preserve customer identity, selection behavior, logical event identity, idempotency, and authorization semantics.
5. Compile or typecheck after each coherent concern so target-SDK errors drive the remaining work.

Do not adopt unrelated product capabilities merely because the target SDK exposes them.

## 4. Guard remote verification

Repository migration is local. Before exercising a remote request, state the exact organization and `sandbox` or `live` mode. Use a passing `PROJECT_CONTEXT_VALID` doctor check in Node projects; otherwise require explicit project or user context. Verify against sandbox unless the user explicitly authorizes a named live effect.

## 5. Verify

Search for every retired identifier and old version pin identified by the changelog and the original repository audit. Run formatting, compilation or typecheck, build, and relevant tests. Exercise only the Commet journeys the project actually uses, and confirm independent webhook pins remain intentional.

Keep unrelated refactors out of the migration.
