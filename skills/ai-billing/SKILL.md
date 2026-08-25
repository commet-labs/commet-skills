---
name: ai-billing
description: Implement and diagnose billing for AI usage with Commet, including the installed @commet/ai-sdk integration or direct usage reporting from Node, Python, Go, Java, and PHP. Use the installed SDK documentation for middleware options, token fields, pricing, errors, and balance behavior instead of copied formulas or API inventories.
---

# AI billing

Treat AI billing as a measured billing workflow. Exact middleware options, token fields, pricing inputs, errors, and SDK calls come from the installed documentation and generated types.

## Resolve installed context

1. Detect the installed Commet SDK, AI provider or gateway, model wrapper, and the code path that receives authoritative usage totals.
2. Locate the SDK's installed `docs/manifest.json`, read its entrypoint, and follow the indexed AI token billing, usage, balance, and error documentation.
3. For `@commet/ai-sdk`, also read its installed README and peer dependency versions.
4. In Node projects, run `commet doctor --output agent` and resolve failed package, documentation, compatibility, API-version, or project-context checks.

Do not use token field names, cost formulas, model identifiers, middleware options, or error codes from this skill. They change with the installed contract and provider integration.

## Implement

1. Confirm which customer and billable feature own the usage.
2. Confirm the product's configured consumption model and price source before writing tracking code. Do not silently convert between metered, credits, or balance behavior.
3. Record usage only from the provider's final authoritative usage result. Preserve streaming behavior and the original model response.
4. Use a caller-owned logical event identity and the installed contract's idempotency mechanism so retries cannot double charge.
5. Define the expected application behavior when tracking fails. Do not silently claim billing succeeded when reporting failed.
6. Keep pricing and margin policy in Commet configuration when the installed product documentation assigns ownership there; do not duplicate it in application code.

## Guard effects

Code edits and local provider mocks are local. Creating or changing plans, features, prices, model mappings, balances, subscriptions, or usage events is a remote billing effect.

Before a remote effect, name the exact organization and `sandbox` or `live` mode. Use a passing `PROJECT_CONTEXT_VALID` doctor check in Node projects; otherwise require explicit project or user context. Verify billing changes in sandbox unless the user explicitly authorizes the named live effect.

Never print API keys, provider keys, prompts, completions, or full customer payloads while diagnosing token billing.

## Verify

Run the application's formatter, compiler or typecheck, and tests. Exercise successful usage reporting, retry with the same logical event identity, the chosen tracking-failure behavior, and the configured exhaustion behavior against sandbox when remote verification is authorized.
