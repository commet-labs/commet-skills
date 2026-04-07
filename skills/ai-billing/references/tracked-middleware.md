# tracked() Middleware

Middleware for the Vercel AI SDK that automatically tracks token usage for billing. Wraps any language model to report input/output/cache tokens to Commet.

## Installation

```bash
npm install @commet/node @commet/ai-sdk ai
```

`@commet/ai-sdk` is a peer of both `@commet/node` (for the Commet client) and `ai` (Vercel AI SDK). Install all three.

## Basic Usage

```typescript
import { Commet } from "@commet/node";
import { tracked } from "@commet/ai-sdk";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

const commet = new Commet({
  apiKey: process.env.COMMET_API_KEY!,
  environment: "production",
});

const result = await generateText({
  model: tracked(anthropic("claude-sonnet-4-20250514"), {
    commet,
    feature: "ai_generation",
    customerId: "user_123",
  }),
  prompt: "Explain quantum computing",
});
```

`tracked()` returns a wrapped model that behaves identically to the original. The AI response is never modified -- tracking happens as a side effect after the model completes.

## Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `commet` | `Commet` | Yes | Commet SDK instance |
| `feature` | `string` | Yes | Feature code configured in the dashboard |
| `customerId` | `string` | Yes | Your user/org ID or Commet `cus_xxx` ID |
| `idempotencyKey` | `string` | No | Prevents duplicate tracking on retries |
| `onTrackingError` | `(error: Error) => void` | No | Custom error handler (defaults to `console.warn`) |

## Streaming

Works with both `generateText()` and `streamText()`. For streaming, tokens are reported after the stream finishes (on the `finish` chunk), not during streaming.

```typescript
import { streamText } from "ai";

const result = await streamText({
  model: tracked(anthropic("claude-sonnet-4-20250514"), {
    commet,
    feature: "ai_generation",
    customerId: "user_123",
  }),
  prompt: "Write a story about a robot",
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
// Tokens reported automatically after stream completes
```

The stream itself is unaffected. Token reporting happens on the finish event, so the user sees zero latency impact during streaming.

## Multiple Models

Track different AI models under the same feature or different features. The model is resolved automatically from the provider metadata.

```typescript
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

const cheapModel = tracked(openai("gpt-4o-mini"), {
  commet,
  feature: "ai_generation",
  customerId: "user_123",
});

const powerModel = tracked(anthropic("claude-sonnet-4-20250514"), {
  commet,
  feature: "ai_generation",
  customerId: "user_123",
});

// Both track to the same feature, but costs differ based on model pricing
const summary = await generateText({ model: cheapModel, prompt: "Summarize this" });
const analysis = await generateText({ model: powerModel, prompt: "Analyze this deeply" });
```

Each model has its own per-token pricing in the AI model catalog. The same feature can serve multiple models -- Commet resolves the price from the catalog based on the model identifier.

## Different Features for Different Use Cases

You can separate billing for different AI capabilities:

```typescript
// Chat feature -- higher volume, lower margin
const chatModel = tracked(anthropic("claude-sonnet-4-20250514"), {
  commet,
  feature: "ai_chat",
  customerId: "user_123",
});

// Code generation feature -- lower volume, higher margin
const codeModel = tracked(anthropic("claude-sonnet-4-20250514"), {
  commet,
  feature: "ai_code_generation",
  customerId: "user_123",
});
```

Each feature can have a different margin configured per plan, so you can charge differently for chat vs. code generation even when using the same underlying model.

## Customer Identification

Accepts both Commet customer IDs and external IDs:

```typescript
// Using your app's user ID (recommended)
tracked(model, { commet, feature: "ai", customerId: "user_123" });

// Using Commet's internal customer ID
tracked(model, { commet, feature: "ai", customerId: "cus_abc123" });
```

IDs starting with `cus_` are treated as Commet customer IDs, all others as your app's user IDs. Using your app's user ID is recommended because it avoids a lookup step.

## Feature Slug Configuration

The `feature` string must match a feature code configured in the Commet dashboard:

1. Create a feature in the dashboard with `pricingMode: "ai_model"`
2. Add the feature to a plan (balance consumption model)
3. Set the margin (basis points) for that feature on the plan
4. Use the feature code as the `feature` option in `tracked()`

After running `commet pull`, feature codes get autocomplete support in your editor.

## Token Counting

`tracked()` reports four token types from the model response:

| Token Type | Description |
|------------|-------------|
| `inputTokens` | Tokens in the prompt (system + user messages) |
| `outputTokens` | Tokens generated by the model |
| `cacheReadTokens` | Tokens served from provider cache (lower cost) |
| `cacheWriteTokens` | Tokens written to provider cache |

Token counts come directly from the AI provider's response. Commet does not estimate or recount tokens -- it uses the exact values reported by the model.

Cache tokens are optional. If the provider does not support prompt caching or the request does not use it, `cacheReadTokens` and `cacheWriteTokens` are 0.

## Idempotency

Use `idempotencyKey` to prevent double-billing on retries:

```typescript
const result = await generateText({
  model: tracked(anthropic("claude-sonnet-4-20250514"), {
    commet,
    feature: "ai_generation",
    customerId: "user_123",
    idempotencyKey: `chat-${messageId}`,
  }),
  prompt: userMessage,
});
```

If the same idempotency key is sent twice, the second tracking call is ignored. Use a stable identifier tied to the user action (message ID, request ID) -- not a random value.

## Error Handling

Token tracking is **non-blocking**. If reporting fails, the AI response is always returned.

```typescript
const model = tracked(anthropic("claude-sonnet-4-20250514"), {
  commet,
  feature: "ai_generation",
  customerId: "user_123",
  onTrackingError: (error) => {
    // Log to your error tracking service
    Sentry.captureException(error);
  },
});
```

Default behavior (no `onTrackingError`): a warning is logged to console. The model response is never affected by tracking failures.

Tracking can fail for these reasons:

| Reason | What Happens |
|--------|--------------|
| Network error to Commet API | Warning logged, response returned |
| Feature not in customer's plan | 403 passed to `onTrackingError` |
| Insufficient balance (`blockOnExhaustion = true`) | 402 passed to `onTrackingError` |
| Model not in catalog | 404 passed to `onTrackingError` |

**Important:** When `blockOnExhaustion = true` and the customer has insufficient balance, the AI call still executes (the model already ran), but the tracking reports the 402. To block AI calls _before_ they execute when balance is exhausted, check balance first with the Commet API.

## Next.js Example

```typescript
// app/api/chat/route.ts
import { Commet } from "@commet/node";
import { tracked } from "@commet/ai-sdk";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

const commet = new Commet({ apiKey: process.env.COMMET_API_KEY! });

export async function POST(request: Request) {
  const { messages, userId } = await request.json();

  const result = streamText({
    model: tracked(anthropic("claude-sonnet-4-20250514"), {
      commet,
      feature: "ai_chat",
      customerId: userId,
    }),
    messages,
  });

  return result.toDataStreamResponse();
}
```
