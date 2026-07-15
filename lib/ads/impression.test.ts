import assert from "node:assert/strict"
import test from "node:test"
// @ts-expect-error Node's TypeScript test runner requires the explicit extension.
import { observeAdImpression } from "./impression.ts"

type Entry = { isIntersecting: boolean; intersectionRatio: number }

function createHarness(reported = new Set<string>()) {
  let observerCallback: ((entries: Entry[]) => void) | undefined
  let timerCallback: (() => void) | undefined
  let clearCount = 0
  let disconnectCount = 0
  const reports: string[] = []

  const cleanup = observeAdImpression({} as Element, {
    dedupeKey: "native:anchor-1",
    impressionUrl: "https://example.com/impression",
    reported,
    report: (url) => reports.push(url),
    createObserver: (callback) => {
      observerCallback = callback as (entries: Entry[]) => void
      return {
        observe: () => undefined,
        disconnect: () => {
          disconnectCount += 1
        },
      }
    },
    setTimer: (callback) => {
      timerCallback = callback
      return 1
    },
    clearTimer: () => {
      clearCount += 1
      timerCallback = undefined
    },
  })

  return {
    cleanup,
    reported,
    reports,
    enter: (ratio: number) =>
      observerCallback?.([
        { isIntersecting: ratio > 0, intersectionRatio: ratio },
      ]),
    fireTimer: () => timerCallback?.(),
    clearCount: () => clearCount,
    disconnectCount: () => disconnectCount,
  }
}

test("observeAdImpression requires one continuous second at 50 percent", () => {
  const harness = createHarness()

  harness.enter(0.49)
  harness.fireTimer()
  assert.deepEqual(harness.reports, [])

  harness.enter(0.5)
  harness.enter(0.2)
  harness.fireTimer()
  assert.deepEqual(harness.reports, [])
  assert.equal(harness.clearCount(), 1)

  harness.enter(0.75)
  harness.fireTimer()
  assert.deepEqual(harness.reports, ["https://example.com/impression"])
  assert.equal(harness.disconnectCount(), 1)
})

test("observeAdImpression reports once per session dedupe key", () => {
  const reported = new Set<string>()
  const first = createHarness(reported)
  first.enter(1)
  first.fireTimer()

  const second = createHarness(reported)
  second.enter(1)
  second.fireTimer()

  assert.equal(first.reports.length, 1)
  assert.equal(second.reports.length, 0)
  assert.equal(second.disconnectCount(), 1)
})
