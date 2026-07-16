import assert from "node:assert/strict"
import test from "node:test"
import { JSDOM } from "jsdom"
// @ts-expect-error Node's TypeScript test runner requires the explicit extension.
import { injectNativeTextAnchor } from "./dom.ts"

const instruction = {
  ad_id: "ad-1",
  keyword: "YNAB",
  anchor_dom_id: "anchor-1",
  landing_url: "https://example.com/landing",
  click_tracking_url: "https://example.com/click",
  impression_tracking_url: "https://example.com/impression",
}

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
