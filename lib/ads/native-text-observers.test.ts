import assert from "node:assert/strict"
import test from "node:test"
import { JSDOM } from "jsdom"
// @ts-expect-error Node's TypeScript test runner requires the explicit extension.
import { cleanupInactiveNativeTextImpressionObservers, cleanupNativeTextImpressionObservers, syncNativeTextImpressionObserver } from "./native-text-observers.ts"

const instruction = {
  ad_id: "ad-1",
  keyword: "YNAB",
  anchor_dom_id: "anchor-1",
  landing_url: "https://example.com/landing",
  click_tracking_url: "https://example.com/click",
  impression_tracking_url: "https://example.com/impression",
}

test("syncNativeTextImpressionObserver keeps the same observer for unchanged anchors", () => {
  const dom = new JSDOM(`<a id="anchor-1">YNAB</a>`)
  const anchor = dom.window.document.querySelector("a")!
  const cleanups: string[] = []
  const observes: Element[] = []
  const observers = new Map()

  syncNativeTextImpressionObserver(observers, instruction, anchor, {
    observe: (element) => {
      observes.push(element)
      return () => cleanups.push("cleanup")
    },
  })
  syncNativeTextImpressionObserver(observers, instruction, anchor, {
    observe: (element) => {
      observes.push(element)
      return () => cleanups.push("cleanup")
    },
  })

  assert.equal(observes.length, 1)
  assert.deepEqual(cleanups, [])
  assert.equal(observers.size, 1)
})

test("syncNativeTextImpressionObserver rebinds only when an anchor moves", () => {
  const dom = new JSDOM(
    `<div><a id="anchor-1">old</a><a id="anchor-1">new</a></div>`
  )
  const anchors = dom.window.document.querySelectorAll("a")
  const cleanups: string[] = []
  const observes: Element[] = []
  const observers = new Map()

  for (const anchor of anchors) {
    syncNativeTextImpressionObserver(observers, instruction, anchor, {
      observe: (element) => {
        observes.push(element)
        return () => cleanups.push(element.textContent ?? "")
      },
    })
  }

  assert.deepEqual(
    observes.map((element) => element.textContent),
    ["old", "new"]
  )
  assert.deepEqual(cleanups, ["old"])
  assert.equal(observers.size, 1)
})

test("cleanupInactiveNativeTextImpressionObservers removes observers that no longer have anchors", () => {
  const dom = new JSDOM(
    `<div><a id="anchor-1">one</a><a id="anchor-2">two</a></div>`
  )
  const anchors = dom.window.document.querySelectorAll("a")
  const observers = new Map()
  const cleanups: string[] = []

  syncNativeTextImpressionObserver(observers, instruction, anchors[0], {
    observe: () => () => cleanups.push("one"),
  })
  syncNativeTextImpressionObserver(
    observers,
    { ...instruction, anchor_dom_id: "anchor-2" },
    anchors[1],
    {
      observe: () => () => cleanups.push("two"),
    }
  )

  cleanupInactiveNativeTextImpressionObservers(
    observers,
    new Set(["anchor-2"])
  )

  assert.deepEqual(cleanups, ["one"])
  assert.equal(observers.size, 1)
  assert.equal(observers.has("anchor-2"), true)
})

test("cleanupNativeTextImpressionObservers removes every observer", () => {
  const dom = new JSDOM(
    `<div><a id="anchor-1">one</a><a id="anchor-2">two</a></div>`
  )
  const anchors = dom.window.document.querySelectorAll("a")
  const observers = new Map()
  const cleanups: string[] = []

  syncNativeTextImpressionObserver(observers, instruction, anchors[0], {
    observe: () => () => cleanups.push("one"),
  })
  syncNativeTextImpressionObserver(
    observers,
    { ...instruction, anchor_dom_id: "anchor-2" },
    anchors[1],
    {
      observe: () => () => cleanups.push("two"),
    }
  )

  cleanupNativeTextImpressionObservers(observers)

  assert.deepEqual(cleanups, ["one", "two"])
  assert.equal(observers.size, 0)
})
