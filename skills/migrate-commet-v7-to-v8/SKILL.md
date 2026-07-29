---
name: migrate-commet-v7-to-v8
description: Migrate a Commet integration from SDK v7 and API 2026-07-11 to SDK v8 and API 2026-07-24. Use when upgrading @commet/node, commet-sdk for Python, commet-go, commet-java, or commet-php; removing legacy response envelopes; replacing featureAccess.canUse or usage.trackEvent; adopting featureCode, Offers, priceId, market pricing, or typed webhook payloads.
license: MIT
metadata:
  author: commet
  version: "1.0.0"
  homepage: https://commet.co
  source: https://github.com/commet-labs/skills
---

# Migrate Commet SDK v7 to v8

Use the v8 changelog as the detailed source of truth:
https://commet.co/changelog/api-2026-07-24-and-sdks-v8

## 1. Detect the integration

Before editing, find:

- installed Commet packages and versions;
- every import, client initialization, SDK call, exported Commet type, direct REST request, and webhook handler;
- any explicit `commet-version`, API version pin, or webhook endpoint pin;
- the project's typecheck, build, and test commands.

Do not assume the project only uses Node. Check `package.json`, Python project files, `go.mod`, Gradle or Maven files, and `composer.json`.

## 2. Upgrade one major boundary

- Node: `@commet/node` v8.
- Python: `commet-sdk` v8.
- Go: change the module and imports to `github.com/commet-labs/commet-go/v8`.
- Java: `co.commet:commet-java:8.x`.
- PHP: `commet/commet-php` v8.

If the project is older than v7, apply earlier migration guides first and verify after each major version.

Preserve behavior while upgrading the contract. Do not adopt Offers, Markets, or selectable prices unless the integration already needs those capabilities.

## 3. Apply the v8 contract

- Singular methods return the resource directly. Remove legacy `success`, `data`, and `error` response-envelope reads.
- List methods return `{ object, data, hasMore, nextCursor }`. Keep list pagination reads.
- Replace `featureAccess.canUse(...)` with `usage.check({ customerId, featureCode, quantity? })`.
- Replace `usage.trackEvent(...)` with `usage.track(...)`.
- Rename usage input `feature` to `featureCode`.
- Use body `eventId` for the caller-owned logical usage-event identity. Transport idempotency remains an SDK request option/header.
- Treat `featureAccess.get(...)` as current state. Treat `usage.check(...)` as a prospective consumption decision.
- Replace inline introductory-offer mutations with `offers` resources. Use `offerId` to select a Promotional Offer.
- Use `priceId` when the caller must select one concrete base price or market variant. Omitting it keeps default price resolution.
- Update add-on creation to the exact shape for its `consumptionModel`.
- Update payout verification and webhook feature state to their discriminated variants.
- For direct REST calls, use API version `2026-07-24`, canonical resource paths, PATCH for partial updates, and the standard list envelope.
- Subscription creation identifies a plan with exactly one of `planId` or `planCode`.
- Quota mutations identify a customer with exactly one of `customerId` or `externalId`.
- Portal sessions identify a customer with exactly one of `email` or `customerId`.
- Test Clock updates use exactly one of `advanceDays` or `frozenTime`.

Do not hand-create compatibility aliases that preserve removed v7 SDK methods. The versioned Platform API already preserves v7 behavior for clients pinned to v7.

## 4. Verify

1. Search again for `featureAccess.canUse`, `usage.trackEvent`, legacy usage `feature`, Go `/v7`, and singular response-envelope access.
2. Run formatting, typecheck, build, and the relevant tests.
3. Exercise customer creation, subscription creation, feature access, usage tracking, portal creation, and webhook verification if the project uses them.
4. Confirm explicit API and webhook pins are intentional. Upgrading an SDK does not rewrite an independently pinned webhook endpoint.

Only change Commet integration code during the migration. Do not mix unrelated refactors into the upgrade.
