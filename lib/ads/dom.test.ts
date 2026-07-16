import assert from "node:assert/strict"
import test from "node:test"
import { JSDOM } from "jsdom"
// @ts-expect-error Node's TypeScript test runner requires the explicit extension.
import * as domHelpers from "./dom.ts"

const {
  injectNativeTextAnchor,
  placeNativeTextAnchor,
  shouldMoveNativeTextAnchor,
} = domHelpers

const instruction = {
  ad_id: "ad-1",
  keyword: "YNAB",
  anchor_dom_id: "anchor-1",
  landing_url: "https://example.com/landing",
  click_tracking_url: "https://example.com/click",
  impression_tracking_url: "https://example.com/impression",
}

test("placeNativeTextAnchor prefers headings over ordinary paragraphs", () => {
  const dom = new JSDOM(
    `<div><p>YNAB is available.</p><h2>Choose YNAB</h2></div>`
  )
  const container = dom.window.document.querySelector("div")!

  const result = placeNativeTextAnchor(container, instruction, {
    finalized: true,
  })

  assert.equal(result.placed, true)
  assert.equal(container.querySelector("h2 a")?.textContent, "YNAB")
  assert.equal(container.querySelector("p a"), null)
})

test("placeNativeTextAnchor prefers bold text over ordinary paragraphs", () => {
  const dom = new JSDOM(
    `<div><p>YNAB is available.</p><p><strong>Try YNAB today</strong></p></div>`
  )
  const container = dom.window.document.querySelector("div")!

  placeNativeTextAnchor(container, instruction, { finalized: true })

  assert.equal(container.querySelector("strong a")?.textContent, "YNAB")
})

test("placeNativeTextAnchor scores a terminator on the surrounding sentence", () => {
  const dom = new JSDOM(`<div><p>YNAB works. More text follows</p></div>`)
  const container = dom.window.document.querySelector("div")!

  const result = placeNativeTextAnchor(container, instruction, {
    finalized: true,
  })

  assert.equal(result.score, 20)
})

test("shouldMoveNativeTextAnchor requires a 15 point lead while streaming", () => {
  assert.equal(shouldMoveNativeTextAnchor(30, 44, false), false)
  assert.equal(shouldMoveNativeTextAnchor(30, 45, false), true)
})

test("shouldMoveNativeTextAnchor finalizes to any higher score", () => {
  assert.equal(shouldMoveNativeTextAnchor(30, 31, true), true)
  assert.equal(shouldMoveNativeTextAnchor(30, 30, true), false)
})

test("placeNativeTextAnchor moves the existing anchor to a better candidate", () => {
  const dom = new JSDOM(`<div><p>Try ynab today.</p></div>`)
  const container = dom.window.document.querySelector("div")!
  const reports: string[] = []

  const initial = placeNativeTextAnchor(container, instruction, {
    reportClick: (url) => reports.push(url),
  })
  assert.equal(initial.placed, true)
  assert.equal(container.querySelector("p a")?.textContent, "ynab")

  container.insertAdjacentHTML("beforeend", `<h2>Choose YNAB</h2>`)
  const result = placeNativeTextAnchor(container, instruction, {
    finalized: true,
    reportClick: (url) => reports.push(url),
  })

  assert.equal(result.moved, true)
  assert.equal(container.querySelector("p a"), null)
  assert.equal(container.querySelector("p")?.textContent, "Try ynab today.")
  assert.equal(container.querySelector("h2 a")?.textContent, "YNAB")
  assert.equal(result.anchor?.id, instruction.anchor_dom_id)
  assert.equal(result.anchor?.getAttribute("href"), instruction.landing_url)
  assert.equal(result.anchor?.dataset.adPlacementScore, String(result.score))
  result.anchor?.dispatchEvent(new dom.window.MouseEvent("click"))
  assert.deepEqual(reports, [instruction.click_tracking_url])
})

test("injectNativeTextAnchor skips code and injects the first prose match", () => {
  const dom = new JSDOM(
    `<div><code>YNAB</code><p>Try YNAB today. YNAB works.</p></div>`
  )
  const container = dom.window.document.querySelector("div")!

  assert.equal(injectNativeTextAnchor(container, instruction), true)
  assert.equal(container.querySelector("code a"), null)
  assert.equal(container.querySelectorAll("p a").length, 1)
  assert.equal(container.querySelector("p a")?.textContent, "YNAB")
})

test("injectNativeTextAnchor skips existing links and is idempotent", () => {
  const dom = new JSDOM(`<div><a href="/existing">YNAB</a><p>YNAB</p></div>`)
  const container = dom.window.document.querySelector("div")!
  const reports: string[] = []

  assert.equal(
    injectNativeTextAnchor(container, instruction, (url) => reports.push(url)),
    true
  )
  assert.equal(
    injectNativeTextAnchor(container, instruction, (url) => reports.push(url)),
    true
  )
  assert.equal(container.querySelectorAll("#anchor-1").length, 1)
  assert.equal(
    container.querySelector("#anchor-1")?.getAttribute("href"),
    instruction.landing_url
  )
  assert.equal(
    container.querySelector("#anchor-1")?.getAttribute("rel"),
    "noopener noreferrer sponsored"
  )
  container
    .querySelector<HTMLAnchorElement>("#anchor-1")
    ?.dispatchEvent(new dom.window.MouseEvent("click"))
  assert.deepEqual(reports, [instruction.click_tracking_url])
})

test("placeNativeTextAnchor scopes existing anchor lookup to the message container", () => {
  const dom = new JSDOM(
    `<main>
      <section id="message-1"><p>YNAB helps.</p></section>
      <section id="message-2"><p>YNAB helps.</p></section>
    </main>`
  )
  const first = dom.window.document.querySelector("#message-1")!
  const second = dom.window.document.querySelector("#message-2")!
  const sharedInstruction = {
    ...instruction,
    anchor_dom_id: "shared-anchor",
  }

  assert.equal(placeNativeTextAnchor(first, sharedInstruction).placed, true)
  assert.equal(placeNativeTextAnchor(second, sharedInstruction).placed, true)
  assert.equal(placeNativeTextAnchor(second, sharedInstruction).placed, true)

  assert.equal(first.querySelectorAll("#shared-anchor").length, 1)
  assert.equal(second.querySelectorAll("#shared-anchor").length, 1)
  assert.equal(second.querySelectorAll("a a").length, 0)
})

test("injectNativeTextAnchor returns false when no eligible keyword exists", () => {
  const dom = new JSDOM(`<div><pre>YNAB</pre><p>Nothing here.</p></div>`)
  const container = dom.window.document.querySelector("div")!

  assert.equal(injectNativeTextAnchor(container, instruction), false)
})

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
