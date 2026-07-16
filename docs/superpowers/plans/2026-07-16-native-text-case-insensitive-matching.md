# Native Text Case-Insensitive Matching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Native Text keyword matching ignore English letter case while preserving the AI response's original casing in the rendered link.

**Architecture:** Keep matching inside `injectNativeTextAnchor`. Compute the match index from lowercase copies of the text node and keyword, then use that index to split the untouched original text so display casing and existing link/tracking behavior remain unchanged.

**Tech Stack:** TypeScript, JSDOM, Node.js test runner, Next.js

## Global Constraints

- Match all English letters case-insensitively.
- Preserve the AI response's original text casing in the rendered anchor.
- Continue using `landing_url` for navigation and `click_tracking_url` for click reporting.
- Keep skipped-node, deduplication, and impression behavior unchanged.
- Add no dependencies and perform no unrelated refactoring.

---

### Task 1: Case-Insensitive Native Text Matching

**Files:**
- Modify: `lib/ads/dom.ts:29-43`
- Test: `lib/ads/dom.test.ts`

**Interfaces:**
- Consumes: `injectNativeTextAnchor(container: Element, instruction: NativeTextInstruction, reportClick?: (url: string) => void): boolean`
- Produces: The same function signature with case-insensitive keyword lookup and original-case anchor text.

- [ ] **Step 1: Write the failing test**

Add this test to `lib/ads/dom.test.ts`:

```ts
test("injectNativeTextAnchor matches English keywords case-insensitively", () => {
  const dom = new JSDOM(`<div><p>Try olay for daily skincare.</p></div>`)
  const container = dom.window.document.querySelector("div")!

  assert.equal(
    injectNativeTextAnchor(container, { ...instruction, keyword: "OLAY" }),
    true
  )
  assert.equal(container.querySelector("a")?.textContent, "olay")
  assert.equal(
    container.querySelector("a")?.getAttribute("href"),
    instruction.landing_url
  )
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test --experimental-strip-types lib/ads/dom.test.ts
```

Expected: FAIL because `injectNativeTextAnchor` currently compares `node.data` and `instruction.keyword` case-sensitively and returns `false`.

- [ ] **Step 3: Implement the minimal matching change**

In `lib/ads/dom.ts`, replace the case-sensitive lookup with:

```ts
const index = node.data.toLowerCase().indexOf(instruction.keyword.toLowerCase())
```

Keep slicing `node.data` and set the anchor text from the matched original substring:

```ts
const matchedText = node.data.slice(index, index + instruction.keyword.length)
anchor.textContent = matchedText
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
node --test --experimental-strip-types lib/ads/dom.test.ts
```

Expected: all Native Text DOM tests pass.

- [ ] **Step 5: Run full verification**

Run:

```bash
npm run type-check && npm test
```

Expected: TypeScript exits with code 0 and every test passes with zero failures.

- [ ] **Step 6: Commit the implementation**

```bash
git add lib/ads/dom.ts lib/ads/dom.test.ts docs/superpowers/plans/2026-07-16-native-text-case-insensitive-matching.md
git commit -m "fix: match native text ads case-insensitively"
```
