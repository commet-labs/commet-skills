---
name: commet-webhooks
description: Implement and diagnose Commet webhook endpoints in Node, Python, Go, Java, or PHP, including framework handlers, signature verification, event handling, retries, and idempotency. Use event names, payloads, headers, and helpers from the installed SDK documentation and types rather than a copied event catalog.
---

# Commet webhooks

Use the installed SDK as the webhook contract. This skill defines the handling workflow, not the current event inventory.

## Resolve the contract

1. Detect the language, framework, installed Commet SDK, integration packages, and any explicit webhook API-version pin.
2. Locate the installed SDK's `docs/manifest.json` using its package manager. Read the manifest entrypoint, generated webhook reference, and only the exact event entries needed for the task.
3. Read the generated webhook types and the installed framework package README before choosing a handler helper or payload shape.
4. In Node projects, run `commet doctor --output agent` and resolve failed documentation, compatibility, API-version, or project-context checks.

Do not copy event unions, payload envelopes, headers, retry schedules, or callback names from this skill. If they are absent from the installed docs and types, report the missing contract instead of guessing.

## Implement the endpoint

1. Use the installed framework helper when one exists; otherwise follow the installed SDK's raw-body verification path.
2. Verify the signature against the untouched request body before parsing or acting on the payload.
3. Narrow on the exact generated event type and treat unknown events according to the installed documentation.
4. Make business handling idempotent using the durable event identity exposed by the installed contract.
5. Complete durable work before acknowledging when redelivery is required for failure recovery. Keep intentionally asynchronous work on a durable queue.
6. Query Commet directly for access-control and current subscription decisions. Use webhooks for background consequences such as email, provisioning, analytics, or external synchronization.
7. Preserve the endpoint's explicit webhook version until the user authorizes a version migration.

## Guard effects

Editing and testing the local handler is local work. Registering an endpoint, sending a provider test event, replaying a delivery, or changing webhook configuration is a remote effect.

Before a remote effect, state the exact organization and `sandbox` or `live` mode. Use a passing `PROJECT_CONTEXT_VALID` doctor check in Node projects; otherwise require explicit project or user context. Do not send or replay live events without explicit authorization.

Never log webhook secrets, signatures, authorization headers, or complete payloads containing customer data.

## Verify

Test the public handler boundary with the installed signing helper or a real sandbox delivery. Cover valid signatures, invalid signatures, the requested event, duplicate delivery, and the handler's acknowledgement behavior. Run the repository's formatter, compiler or typecheck, and relevant tests.
