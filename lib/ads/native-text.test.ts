import assert from "node:assert/strict"
import test from "node:test"
// prettier-ignore
// @ts-expect-error Node's TypeScript test runner requires the explicit extension.
import { buildNativeTextUrl, createTextChunkFrame, findLatestAssistantMessage, findUserQueryForAssistant, getNativeTextConnectSource, getTextDelta, NATIVE_TEXT_PLACEMENT_KEY, parseNativeTextInstruction, remapMessageScopedValue } from "./native-text.ts";

test("buildNativeTextUrl uses the verified placement query parameters", () => {
  const url = new URL(buildNativeTextUrl("req-1"))

  assert.equal(url.origin, "ws://10.1.51.76:8080")
  assert.equal(url.pathname, "/api/v1/ad/stream-match")
  assert.equal(url.searchParams.get("placement_key"), NATIVE_TEXT_PLACEMENT_KEY)
  assert.equal(url.searchParams.get("slot_id"), "8")
  assert.equal(url.searchParams.get("request_id"), "req-1")
})

test("getNativeTextConnectSource exposes the WebSocket origin for CSP", () => {
  assert.equal(getNativeTextConnectSource(), "ws://10.1.51.76:8080")
})

test("getTextDelta only returns newly appended text", () => {
  assert.equal(getTextDelta("hello", "hello world"), " world")
  assert.equal(getTextDelta("hello", "hello"), "")
})

test("getTextDelta returns replacement content after a non-append update", () => {
  assert.equal(getTextDelta("old", "replacement"), "replacement")
})

test("createTextChunkFrame follows the documented wire shape", () => {
  assert.deepEqual(createTextChunkFrame(3, " chunk", 1234), {
    event: "text_chunk",
    data: { chunk_id: 3, text: " chunk", timestamp: 1234 },
  })
})

test("parseNativeTextInstruction accepts a complete inject_anchor frame", () => {
  assert.deepEqual(
    parseNativeTextInstruction({
      event: "inject_anchor",
      data: {
        ad_id: "ad-1",
        keyword: "YNAB",
        anchor_dom_id: "anchor-1",
        landing_url: "https://example.com/landing",
        click_tracking_url: "https://example.com/click",
        impression_tracking_url: "http://example.com/impression",
      },
    }),
    {
      ad_id: "ad-1",
      keyword: "YNAB",
      anchor_dom_id: "anchor-1",
      landing_url: "https://example.com/landing",
      click_tracking_url: "https://example.com/click",
      impression_tracking_url: "http://example.com/impression",
    }
  )
})

test("parseNativeTextInstruction rejects unsafe or incomplete frames", () => {
  assert.equal(parseNativeTextInstruction({ event: "other", data: {} }), null)
  assert.equal(
    parseNativeTextInstruction({
      event: "inject_anchor",
      data: {
        ad_id: "ad-1",
        keyword: "",
        anchor_dom_id: "anchor-1",
        landing_url: "https://example.com",
        click_tracking_url: "javascript:alert(1)",
        impression_tracking_url: "https://example.com/impression",
      },
    }),
    null
  )
})

test("findLatestAssistantMessage resolves the active streamed response", () => {
  assert.deepEqual(
    findLatestAssistantMessage([
      { id: "u1", role: "user", content: "first question" },
      { id: "a1", role: "assistant", content: "first answer" },
      { id: "u2", role: "user", content: "second question" },
      { id: "a2", role: "assistant", content: "streaming answer" },
    ]),
    { id: "a2", content: "streaming answer" }
  )
})

test("findUserQueryForAssistant binds the assistant to its preceding user message", () => {
  const messages = [
    { id: "u1", role: "user", content: "first question" },
    { id: "a1", role: "assistant", content: "first answer" },
    { id: "u2", role: "user", content: "second question" },
    { id: "a2", role: "assistant", content: "second answer" },
  ]

  assert.equal(findUserQueryForAssistant(messages, "a2"), "second question")
  assert.equal(findUserQueryForAssistant(messages, "missing"), null)
})

test("remapMessageScopedValue keeps ad state when an assistant message ID is reconciled", () => {
  const ad = { keyword: "雅诗兰黛小棕瓶" }

  assert.deepEqual(
    remapMessageScopedValue(
      {
        "temporary-assistant-id": ad,
        "older-assistant-id": { keyword: "补水" },
      },
      "temporary-assistant-id",
      "database-assistant-id"
    ),
    {
      "database-assistant-id": ad,
      "older-assistant-id": { keyword: "补水" },
    }
  )
})
