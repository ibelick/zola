# AI Ad Placements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a streaming Native Text ad placement and a post-answer Small Card placement without interrupting the existing chat flow.

**Architecture:** A client-side advertising hook owns one WebSocket session per generated assistant response and stores validated anchor/card data by assistant message ID. Small Card requests use a same-origin Next.js route that validates and proxies the real ad service; Native Text connects directly to the verified WebSocket endpoint. Focused protocol, DOM, and tracking utilities keep network and rendering behavior independently testable.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, AI SDK `useChat`, Tailwind CSS, Node test runner, JSDOM.

## Global Constraints

- Native Text placement: ID `8`, key `cmrloph8700031xywuz5ijj94`, endpoint `ws://10.1.51.76:8080/api/v1/ad/stream-match`.
- Small Card placement: ID `7`, key `cmrlha7j000011xywcsjy39x1`, endpoint `http://10.1.51.76:8080/api/v1/ad/query`.
- Small Card must use the Next.js server proxy because the real endpoint does not support browser CORS preflight.
- Small Card proxy sends `X-Placement-Key`, `X-Publisher-Key`, and `X-Ad-Slot-ID`.
- Native Text failures and Small Card failures silently degrade and never interrupt AI output.
- Ads are runtime-only and are not written into message content, Supabase, or IndexedDB.
- Impression requires at least 50% visibility continuously for one second and is reported once per session key.
- Preserve all pre-existing uncommitted workspace changes.

---

### Task 1: Test runner and protocol contracts

**Files:**
- Modify: `package.json`
- Create: `lib/ads/types.ts`
- Create: `lib/ads/native-text.ts`
- Create: `lib/ads/native-text.test.ts`

**Interfaces:**
- Produces: `NativeTextInstruction`, `SmallCardAd`, `buildNativeTextUrl(requestId)`, `getTextDelta(previous, current)`, `createTextChunkFrame(chunkId, text, timestamp)`, and `parseNativeTextInstruction(value)`.

- [ ] **Step 1: Add a test command and write failing protocol tests**

Add `"test": "node --test --experimental-strip-types lib/**/*.test.ts"` to `scripts`. Tests must assert the exact verified URL parameters, append-only delta behavior, reset behavior when text is replaced, exact `text_chunk` frame shape, valid instruction parsing, and rejection of unsafe/missing URLs or fields.

```ts
test("buildNativeTextUrl uses the verified placement query parameters", () => {
  const url = new URL(buildNativeTextUrl("req-1"))
  assert.equal(url.searchParams.get("placement_key"), NATIVE_TEXT_PLACEMENT_KEY)
  assert.equal(url.searchParams.get("slot_id"), "8")
  assert.equal(url.searchParams.get("request_id"), "req-1")
})

test("getTextDelta only returns newly appended text", () => {
  assert.equal(getTextDelta("hello", "hello world"), " world")
  assert.equal(getTextDelta("old", "replacement"), "replacement")
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- lib/ads/native-text.test.ts`

Expected: FAIL because `lib/ads/native-text.ts` does not exist.

- [ ] **Step 3: Implement the minimal protocol module**

Use centralized exported constants and URL validation restricted to `http:`/`https:` tracking URLs. `getTextDelta` returns the suffix only when `current.startsWith(previous)`; otherwise it returns `current` so regenerated/replaced content is not dropped.

```ts
export function createTextChunkFrame(chunkId: number, text: string, timestamp: number) {
  return { event: "text_chunk" as const, data: { chunk_id: chunkId, text, timestamp } }
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- lib/ads/native-text.test.ts`

Expected: all Native Text protocol tests PASS.

- [ ] **Step 5: Commit the protocol slice**

```bash
git add package.json lib/ads/types.ts lib/ads/native-text.ts lib/ads/native-text.test.ts
git commit -m "feat: add ad protocol contracts"
```

### Task 2: Small Card server proxy

**Files:**
- Create: `lib/ads/small-card.ts`
- Create: `lib/ads/small-card.test.ts`
- Create: `app/api/ads/small-card/route.ts`

**Interfaces:**
- Consumes: `SmallCardAd` from Task 1.
- Produces: `buildSmallCardUpstreamRequest(input, requestId)`, `parseSmallCardResponse(value)`, and `POST(request)` returning `{ ad: SmallCardAd | null }`.

- [ ] **Step 1: Write failing Small Card mapping and parsing tests**

Tests must assert the real endpoint, all three authentication headers, slot ID `7` in the body, empty `context.keywords`, user query/language mapping, first-ad selection, unsafe URL rejection, and empty result for non-success/empty-ad responses.

```ts
test("buildSmallCardUpstreamRequest maps the approved placement", () => {
  const request = buildSmallCardUpstreamRequest({ query: "budget", language: "zh-CN" }, "req-1")
  assert.equal(request.url, "http://10.1.51.76:8080/api/v1/ad/query")
  assert.equal(request.headers["X-Placement-Key"], SMALL_CARD_PLACEMENT_KEY)
  assert.equal(request.headers["X-Publisher-Key"], SMALL_CARD_PLACEMENT_KEY)
  assert.equal(request.headers["X-Ad-Slot-ID"], "7")
  assert.deepEqual(request.body.context.keywords, [])
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- lib/ads/small-card.test.ts`

Expected: FAIL because the Small Card module does not exist.

- [ ] **Step 3: Implement the request builder, strict response parser, and route**

The route accepts `{ query: string, language?: string }`, caps query length at the existing message maximum, generates `crypto.randomUUID()`, calls upstream with an `AbortSignal.timeout(5000)`, and always returns `{ ad: null }` for upstream/network/schema failures. The route must not log placement keys or complete tracking URLs.

```ts
export async function POST(request: Request) {
  try {
    const input = await request.json()
    const upstream = buildSmallCardUpstreamRequest(input, `req_sc_${crypto.randomUUID()}`)
    const response = await fetch(upstream.url, {
      method: "POST",
      headers: upstream.headers,
      body: JSON.stringify(upstream.body),
      signal: AbortSignal.timeout(5000),
    })
    return Response.json({ ad: response.ok ? parseSmallCardResponse(await response.json()) : null })
  } catch {
    return Response.json({ ad: null })
  }
}
```

- [ ] **Step 4: Run the focused tests and type-check**

Run: `npm test -- lib/ads/small-card.test.ts && npm run type-check`

Expected: tests PASS and TypeScript exits 0.

- [ ] **Step 5: Commit the proxy slice**

```bash
git add lib/ads/small-card.ts lib/ads/small-card.test.ts app/api/ads/small-card/route.ts
git commit -m "feat: proxy small card ads"
```

### Task 3: Native Text DOM injection and impression tracking

**Files:**
- Create: `lib/ads/dom.ts`
- Create: `lib/ads/dom.test.ts`
- Create: `lib/ads/impression.ts`
- Create: `lib/ads/impression.test.ts`

**Interfaces:**
- Consumes: `NativeTextInstruction`.
- Produces: `injectNativeTextAnchor(container, instruction)`, `observeAdImpression(element, options)`, and `reportTrackingUrl(url)`.

- [ ] **Step 1: Write failing JSDOM injection tests**

Tests create a JSDOM message container and assert replacement of only the first valid text-node occurrence, preservation of matches inside `a`, `code`, and `pre`, idempotency by `anchor_dom_id`, tracking URL as `href`, and `rel="noopener noreferrer sponsored"`.

```ts
test("injectNativeTextAnchor skips code and injects the first prose match", () => {
  const dom = new JSDOM(`<div><code>YNAB</code><p>Try YNAB today.</p></div>`)
  const container = dom.window.document.querySelector("div")!
  assert.equal(injectNativeTextAnchor(container, instruction), true)
  assert.equal(container.querySelector("code a"), null)
  assert.equal(container.querySelector("p a")?.textContent, "YNAB")
})
```

- [ ] **Step 2: Run the DOM test and verify RED**

Run: `npm test -- lib/ads/dom.test.ts`

Expected: FAIL because the DOM module does not exist.

- [ ] **Step 3: Implement the minimal TreeWalker injector**

Use the container's `ownerDocument`, reject skipped ancestors, split a single text node into before/anchor/after nodes, set the server-supplied DOM ID, and return `false` when no eligible match exists.

- [ ] **Step 4: Run the DOM tests and verify GREEN**

Run: `npm test -- lib/ads/dom.test.ts`

Expected: all DOM injection tests PASS.

- [ ] **Step 5: Write failing fake-observer tests for impression timing**

Tests inject fake `IntersectionObserver`, clock, report function, and session `Set`. Assert no report below 0.5, cancellation before one second, one report after one continuous second, observer disconnect after report, and no second report for the same dedupe key.

- [ ] **Step 6: Run the impression test and verify RED**

Run: `npm test -- lib/ads/impression.test.ts`

Expected: FAIL because the impression module does not exist.

- [ ] **Step 7: Implement impression observation and tracking**

`observeAdImpression` returns cleanup, uses `threshold: [0.5]`, clears its timer whenever visibility drops, adds the dedupe key immediately before reporting, and disconnects after success. `reportTrackingUrl` uses `fetch(url, { method: "GET", mode: "no-cors", keepalive: true })` without awaiting it.

- [ ] **Step 8: Run both focused suites and verify GREEN**

Run: `npm test -- lib/ads/dom.test.ts lib/ads/impression.test.ts`

Expected: all DOM and impression tests PASS.

- [ ] **Step 9: Commit rendering utilities**

```bash
git add lib/ads/dom.ts lib/ads/dom.test.ts lib/ads/impression.ts lib/ads/impression.test.ts
git commit -m "feat: add native ad rendering utilities"
```

### Task 4: Chat advertising lifecycle

**Files:**
- Create: `app/components/ads/use-chat-advertising.ts`
- Create: `app/components/ads/use-native-text-anchors.ts`
- Modify: `app/components/chat/chat.tsx`
- Modify: `app/components/chat/conversation.tsx`
- Modify: `app/components/chat/message.tsx`
- Modify: `app/components/chat/message-assistant.tsx`

**Interfaces:**
- Consumes: `messages`, chat `status`, `chatId`, protocol helpers, DOM injector, and impression observer.
- Produces: `nativeTextByMessageId: Record<string, NativeTextInstruction[]>` and `smallCardByMessageId: Record<string, SmallCardAd>` passed through the existing chat component tree.

- [ ] **Step 1: Add a failing lifecycle reducer test to `lib/ads/native-text.test.ts`**

Extract and test a pure `resolveActiveAssistant(messages)` helper and lifecycle transition helper so a new session opens only for a new submitted answer, deltas bind to the newest assistant message, ready completion identifies the matching prior user query, and chat changes reset runtime ad state.

- [ ] **Step 2: Run the lifecycle-focused test and verify RED**

Run: `npm test -- lib/ads/native-text.test.ts`

Expected: FAIL because the lifecycle helpers do not exist.

- [ ] **Step 3: Implement `useChatAdvertising`**

The hook opens one browser `WebSocket` at `submitted`, queues chunks until `OPEN`, parses incoming instructions, maps them to the current assistant message, closes on `ready`/`error`/cleanup, and fetches `/api/ads/small-card` once after a successful new answer. It stores runtime maps only and resets them when `chatId` changes.

- [ ] **Step 4: Wire ad state through the chat component tree**

Call the hook in `Chat`; add optional `nativeTextAds` and `smallCardAd` props through `Conversation` and `Message`; pass them only to assistant messages. Keep all existing props and memo dependencies intact.

- [ ] **Step 5: Implement post-render Native Text reinjection**

`useNativeTextAnchors` runs after message content/instruction changes, calls `injectNativeTextAnchor` for each instruction against the existing `messageRef`, and attaches impression observers to successfully present anchors. Cleanup observers on rerender/unmount without clearing the session dedupe set.

- [ ] **Step 6: Run tests and type-check**

Run: `npm test && npm run type-check`

Expected: all tests PASS and TypeScript exits 0.

- [ ] **Step 7: Commit the lifecycle integration**

```bash
git add app/components/ads/use-chat-advertising.ts app/components/ads/use-native-text-anchors.ts app/components/chat/chat.tsx app/components/chat/conversation.tsx app/components/chat/message.tsx app/components/chat/message-assistant.tsx lib/ads/native-text.ts lib/ads/native-text.test.ts
git commit -m "feat: connect ads to chat lifecycle"
```

### Task 5: Small Card UI and final validation

**Files:**
- Create: `app/components/ads/small-card-ad.tsx`
- Modify: `app/components/chat/message-assistant.tsx`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `SmallCardAd`, impression observer, and the assistant message's optional `smallCardAd` prop.
- Produces: accessible, theme-aware, full-width Small Card rendered after sources and before message actions.

- [ ] **Step 1: Implement the focused Small Card component**

Render an external anchor using `click_tracking_url`, `target="_blank"`, and `rel="noopener noreferrer sponsored"`. Use a square `size-14` icon area, single-line title, two-line description, visible `badge_text`, neutral image fallback, theme tokens, and `aria-label` containing the title and badge.

- [ ] **Step 2: Attach impression tracking and place the card**

Observe the card root with dedupe key `small-card:${ad_id}`. Render it in `MessageAssistant` after `SourcesList` and before `MessageActions`; never render while the ad is null.

- [ ] **Step 3: Document override environment variables**

Append these optional variables without removing existing entries:

```dotenv
AD_SERVER_BASE_URL=http://10.1.51.76:8080
SMALL_CARD_PLACEMENT_ID=7
SMALL_CARD_PLACEMENT_KEY=cmrlha7j000011xywcsjy39x1
NEXT_PUBLIC_NATIVE_TEXT_WS_URL=ws://10.1.51.76:8080/api/v1/ad/stream-match
NEXT_PUBLIC_NATIVE_TEXT_PLACEMENT_ID=8
NEXT_PUBLIC_NATIVE_TEXT_PLACEMENT_KEY=cmrloph8700031xywuz5ijj94
```

- [ ] **Step 4: Run complete automated verification**

Run: `npm test && npm run type-check && npm run build`

Expected: all tests PASS, type-check exits 0, and Next.js production build exits 0.

- [ ] **Step 5: Start the app and perform browser acceptance checks**

Run: `npm run dev` and verify in the browser that an AI response streams normally, WebSocket connects with slot `8`, a returned `inject_anchor` becomes an in-text link, the Small Card request occurs only after completion, a returned card appears at the answer end, and no-match/network failures leave no placeholder.

- [ ] **Step 6: Inspect the final diff for scope and user-change preservation**

Run: `git diff --check && git status --short && git diff --stat`

Expected: no whitespace errors; only ad integration files plus the intentional existing user-modified files are present; no unrelated source change is introduced.

- [ ] **Step 7: Commit the UI and documentation slice**

```bash
git add app/components/ads/small-card-ad.tsx app/components/chat/message-assistant.tsx .env.example
git commit -m "feat: render small card ads"
```
