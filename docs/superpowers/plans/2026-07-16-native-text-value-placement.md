# Native Text Value Placement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dynamically place each Native Text link at the highest-value eligible occurrence, limit movement during streaming, finalize placement after the answer, and publish one authoritative advertising integration guide.

**Architecture:** Extend the DOM utility to collect and score every eligible keyword occurrence using deterministic structure, intent, position, sentence, and penalty signals. Keep the current anchor during streaming unless a new candidate leads by 15 points; when the answer becomes final, choose the highest score without the threshold. Wire the final-state signal through the existing assistant-message hook and document the external ad platform as the only ad-data source.

**Tech Stack:** TypeScript, React 19, JSDOM, Node.js test runner, Next.js 16, Markdown

## Global Constraints

- Preserve case-insensitive English matching and the AI response's original casing.
- Use `landing_url` for navigation and `click_tracking_url` for background click reporting.
- Skip existing links, `code`, `pre`, `script`, and `style` content.
- Prefer `h1`–`h3`, then `strong`/`b`, then `h4`–`h6`, then ordinary paragraphs.
- Require a 15-point lead to move during streaming; perform threshold-free final calibration.
- Keep exposure reporting deduplicated by `anchor_dom_id`.
- Add no dependencies and do not modify unrelated user changes.

---

### Task 1: Score and Move Native Text Anchors

**Files:**
- Modify: `lib/ads/dom.ts`
- Test: `lib/ads/dom.test.ts`

**Interfaces:**
- Produces: `placeNativeTextAnchor(container, instruction, options): NativeTextPlacementResult`.
- Produces: `shouldMoveNativeTextAnchor(currentScore, nextScore, finalized, threshold?): boolean`.
- Preserves: `injectNativeTextAnchor(container, instruction, reportClick?): boolean` as a compatibility wrapper.

- [ ] **Step 1: Add failing structure-priority tests**

Add tests proving headings and bold text beat ordinary paragraphs:

```ts
test("placeNativeTextAnchor prefers headings over ordinary paragraphs", () => {
  const dom = new JSDOM(`<div><p>YNAB is available.</p><h2>Choose YNAB</h2></div>`)
  const container = dom.window.document.querySelector("div")!

  const result = placeNativeTextAnchor(container, instruction, {
    finalized: true,
  })

  assert.equal(result.placed, true)
  assert.equal(container.querySelector("h2 a")?.textContent, "YNAB")
  assert.equal(container.querySelector("p a"), null)
})

test("placeNativeTextAnchor prefers bold text over ordinary paragraphs", () => {
  const dom = new JSDOM(`<div><p>YNAB is available.</p><p><strong>Try YNAB today</strong></p></div>`)
  const container = dom.window.document.querySelector("div")!

  placeNativeTextAnchor(container, instruction, { finalized: true })

  assert.equal(container.querySelector("strong a")?.textContent, "YNAB")
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test --experimental-strip-types lib/ads/dom.test.ts
```

Expected: FAIL because `placeNativeTextAnchor` does not exist and current insertion always uses the first match.

- [ ] **Step 3: Implement candidate collection and deterministic scoring**

Add these public types and scoring rules in `lib/ads/dom.ts`:

```ts
export type NativeTextPlacementOptions = {
  finalized?: boolean
  moveThreshold?: number
  reportClick?: (url: string) => void
}

export type NativeTextPlacementResult = {
  placed: boolean
  moved: boolean
  score: number | null
  anchor: HTMLAnchorElement | null
}

const PURCHASE_INTENT = ["购买", "下单", "价格", "优惠", "buy", "purchase", "price", "deal"]
const RECOMMEND_INTENT = ["推荐", "值得", "首选", "recommend", "worth", "best"]
const BENEFIT_INTENT = ["适合", "帮助", "效果", "suitable", "help", "benefit"]
const NEGATIVE_INTENT = ["不推荐", "不适合", "避免", "风险", "注意", "not recommend", "avoid", "risk", "caution"]
```

For every eligible occurrence, compute the structural maximum (`h1`–`h3`: 40, `strong`/`b`: 30, `h4`–`h6`: 25, `p`: 10), add one score per matching intent category, add 15 when its text offset is between 20% and 45% of the container text, add 10 when its surrounding sentence contains a trailing sentence terminator, and subtract 30 for negative intent plus 15 inside `blockquote` or `li`.

Allow the current anchor's own text node as a candidate, but continue excluding all other links. Store the selected score in `anchor.dataset.adPlacementScore`.

- [ ] **Step 4: Add failing movement-policy tests**

Add tests for the threshold and final override:

```ts
test("shouldMoveNativeTextAnchor requires a 15 point lead while streaming", () => {
  assert.equal(shouldMoveNativeTextAnchor(30, 44, false), false)
  assert.equal(shouldMoveNativeTextAnchor(30, 45, false), true)
})

test("shouldMoveNativeTextAnchor finalizes to any higher score", () => {
  assert.equal(shouldMoveNativeTextAnchor(30, 31, true), true)
  assert.equal(shouldMoveNativeTextAnchor(30, 30, true), false)
})
```

Run the focused test and confirm these fail before implementing the helper.

- [ ] **Step 5: Implement anchor movement**

Implement:

```ts
export function shouldMoveNativeTextAnchor(
  currentScore: number,
  nextScore: number,
  finalized: boolean,
  threshold = 15
): boolean {
  return nextScore > currentScore && (finalized || nextScore - currentScore >= threshold)
}
```

If the best candidate is the current anchor, retain it. If movement is allowed, replace the old anchor with its text node, create a new anchor at the chosen candidate with the same `anchor_dom_id`, preserve the matched original text, use `landing_url` as `href`, and bind `reportClick(click_tracking_url)`. Keep `injectNativeTextAnchor` as a wrapper using streaming defaults.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run:

```bash
node --test --experimental-strip-types lib/ads/dom.test.ts
```

Expected: all DOM tests pass, including existing skip, idempotence, casing, landing URL, and click-reporting coverage.

- [ ] **Step 7: Commit Task 1**

```bash
git add lib/ads/dom.ts lib/ads/dom.test.ts
git commit -m "feat: rank native text ad placements"
```

---

### Task 2: Wire Streaming and Final Placement States

**Files:**
- Modify: `lib/ads/native-text.ts`
- Test: `lib/ads/native-text.test.ts`
- Modify: `app/components/ads/use-native-text-anchors.ts`
- Modify: `app/components/chat/message-assistant.tsx`

**Interfaces:**
- Produces: `isNativeTextPlacementFinal(status, isLast): boolean`.
- Consumes: `placeNativeTextAnchor(..., { finalized, reportClick })` from Task 1.

- [ ] **Step 1: Add a failing final-state test**

Add to `lib/ads/native-text.test.ts`:

```ts
test("isNativeTextPlacementFinal only leaves the active streamed answer provisional", () => {
  assert.equal(isNativeTextPlacementFinal("streaming", true), false)
  assert.equal(isNativeTextPlacementFinal("streaming", false), true)
  assert.equal(isNativeTextPlacementFinal("ready", true), true)
  assert.equal(isNativeTextPlacementFinal("error", true), true)
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test --experimental-strip-types lib/ads/native-text.test.ts
```

Expected: FAIL because `isNativeTextPlacementFinal` is not exported.

- [ ] **Step 3: Implement and wire the final-state signal**

Add the pure helper:

```ts
type NativeTextChatStatus = "streaming" | "ready" | "submitted" | "error"

export function isNativeTextPlacementFinal(
  status: NativeTextChatStatus | undefined,
  isLast: boolean | undefined
): boolean {
  return status !== "streaming" || !isLast
}
```

In `MessageAssistant`, compute the value from `status` and `isLast`, then pass it to `useNativeTextAnchors`. Extend the Hook with a `finalized` argument and call:

```ts
placeNativeTextAnchor(container, instruction, {
  finalized,
  reportClick: reportTrackingUrl,
})
```

Include `finalized` in the effect dependency list so the ready transition performs final calibration even when content is unchanged. Continue observing the returned anchor and clean up the previous observer on content or placement changes.

- [ ] **Step 4: Run focused and full verification**

Run:

```bash
node --test --experimental-strip-types lib/ads/native-text.test.ts lib/ads/dom.test.ts
npm run type-check
npm test
```

Expected: TypeScript exits with code 0 and every test passes with zero failures.

- [ ] **Step 5: Commit Task 2**

```bash
git add lib/ads/native-text.ts lib/ads/native-text.test.ts app/components/ads/use-native-text-anchors.ts app/components/chat/message-assistant.tsx
git commit -m "feat: finalize native text ad placement"
```

---

### Task 3: Publish the Authoritative Advertising Integration Guide

**Files:**
- Create: `docs/advertising-integration-guide.md`
- Modify: `docs/superpowers/specs/2026-07-15-ai-ad-placements-design.md`
- Modify: `docs/superpowers/plans/2026-07-15-ai-ad-placements.md`

**Interfaces:**
- Documents: the external platform contract and this repository's implementation mapping.
- Supersedes: outdated first-match, tracking-as-href, and full-width presentation descriptions in the 2026-07-15 design materials.

- [ ] **Step 1: Create the integration guide**

Create `docs/advertising-integration-guide.md` with these exact top-level sections:

```md
# AI 广告接入指南

> 唯一广告数据来源是 `http://10.1.51.76:8080`。本项目不生成、不匹配、不存储广告素材。

## 1. 整体架构与数据来源
## 2. 广告位配置
## 3. Small Card 接入流程
## 4. Native Text 接入流程
## 5. 高价值动态选位
## 6. 跳转、点击与曝光监测
## 7. 本项目代码映射
## 8. 环境变量与 CSP
## 9. 本地验证与排障
```

Document the verified endpoints, placement IDs and keys, request/response fields, lifecycle timing, 50%/one-second exposure rule, `landing_url` navigation, background click tracking, silent degradation, case-insensitive matching, and the scoring/finalization rules from the approved design.

Explicitly state this Small Card chain:

```text
浏览器 → 本项目 /api/ads/small-card（仅传输代理）
       → http://10.1.51.76:8080/api/v1/ad/query（广告匹配与素材来源）
```

Explicitly state that Native Text connects directly to `ws://10.1.51.76:8080/api/v1/ad/stream-match`.

- [ ] **Step 2: Mark historical design materials as superseded**

At the top of both 2026-07-15 files, add:

```md
> 历史设计说明：本文记录初始实现过程。当前广告接入、跳转、尺寸和 Native Text 动态选位行为以 [`docs/advertising-integration-guide.md`](../../advertising-integration-guide.md) 为准。
```

In the design document, replace the outdated Native Text first-match and tracking-URL-as-href claims with a short reference to the guide. Replace outdated Small Card full-width and tracking-URL-as-navigation claims with current half-width, two-line, `landing_url` behavior.

- [ ] **Step 3: Verify documentation consistency**

Run:

```bash
rg -n "唯一广告数据来源|10\\.1\\.51\\.76|高价值动态选位|landing_url|仅传输代理" docs/advertising-integration-guide.md docs/superpowers/specs/2026-07-15-ai-ad-placements-design.md docs/superpowers/plans/2026-07-15-ai-ad-placements.md
git diff --check
```

Expected: every required concept appears and `git diff --check` reports no whitespace errors.

- [ ] **Step 4: Run production verification**

Run:

```bash
npm run type-check && npm test && npm run build
```

Expected: TypeScript, all tests, and the Next.js production build complete successfully.

- [ ] **Step 5: Commit Task 3**

```bash
git add docs/advertising-integration-guide.md docs/superpowers/specs/2026-07-15-ai-ad-placements-design.md docs/superpowers/plans/2026-07-15-ai-ad-placements.md docs/superpowers/plans/2026-07-16-native-text-value-placement.md
git commit -m "docs: publish advertising integration guide"
```
