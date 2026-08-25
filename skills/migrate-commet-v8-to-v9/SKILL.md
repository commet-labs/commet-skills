---
name: migrate-commet-v8-to-v9
description: Migrate a Commet integration from SDK v8 and API 2026-07-24 to SDK v9 and API 2026-07-31 across Node, Python, Go, Java, or PHP. Use the versioned changelog and target SDK's installed documentation as the contract while preserving Offer and Market selection behavior.
---

# Migrate Commet v8 to v9

Use the versioned changelog as the boundary definition:
https://commet.co/changelog/independent-offers-and-markets

This skill sequences the migration. It does not duplicate the changelog's method, field, route, CLI, or response inventory.

## 1. Confirm the boundary

Inspect dependency manifests, lockfiles, imports, SDK calls, raw REST requests, webhook handlers, CLI use, explicit API or webhook pins, and every Offer or Market selection path across Node, Python, Go, Java, and PHP project files.

Confirm that the active integration is on the v8 to v9 boundary. Classify how each Offer is selected from existing behavior and persisted inputs; do not infer the selection channel from an Offer's phase shape.

## 2. Install and read the target contract

Upgrade only the active language SDK to its v9 major using that ecosystem's package manager. Resolve `docs/manifest.json` from the installed target artifact, read its entrypoint, and use its generated reference and types for every replacement. Upgrade Node integration packages only to releases whose installed peer ranges support the selected `@commet/node` version.

When Node is present, run `commet doctor --output agent` after installing and resolve failed package, documentation, compatibility, API-version, or project-context checks.

Read the versioned changelog for the complete source-to-target differences. Do not preserve removed v8 namespaces, request fields, routes, or response fields through handwritten aliases; the versioned server contract owns compatibility for clients that remain pinned.

## 3. Migrate one concern at a time

1. Update imports, client initialization, and compatible integration packages.
2. Replace each Offer, Market, subscription application, raw request, and CLI call using the target installed contract and changelog.
3. Preserve existing automatic, direct, or promo-code selection behavior explicitly.
4. Update API and webhook pins only for consumers included in this migration.
5. Compile or typecheck after each coherent concern so target-SDK errors drive the remaining work.

Do not change Offer strategy, pricing, or customer eligibility merely because the target contract supports another model.

## 4. Guard remote verification

Repository migration is local. Before exercising a remote request or CLI mutation, state the exact organization and `sandbox` or `live` mode. Use a passing `PROJECT_CONTEXT_VALID` doctor check in Node projects; otherwise require explicit project or user context. Verify against sandbox unless the user explicitly authorizes a named live effect.

## 5. Verify

Search for every retired identifier and old version pin identified by the changelog and the original repository audit. Run formatting, compilation or typecheck, build, and relevant tests. Exercise only the Offer, Market, subscription, webhook, and CLI journeys the project actually uses, and confirm older consumers remain pinned until independently migrated.

Do not delete v8 server compatibility code as part of an application migration.
