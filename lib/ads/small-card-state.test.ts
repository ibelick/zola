import assert from "node:assert/strict"
import test from "node:test"
// @ts-expect-error Node's TypeScript test runner requires the explicit extension.
import { replaceActiveSmallCard } from "./small-card-state.ts"

const firstAd = {
  ad_id: "ad-1",
  creative: {
    icon_url: "https://example.com/1.png",
    title: "First",
    description: "First card",
    badge_text: "Ad",
  },
  landing_url: "https://example.com/1",
  click_tracking_url: "https://example.com/1/click",
  impression_tracking_url: "https://example.com/1/impression",
}

const secondAd = {
  ...firstAd,
  ad_id: "ad-2",
  creative: { ...firstAd.creative, title: "Second" },
}

test("replaceActiveSmallCard removes the previous card", () => {
  assert.deepEqual(
    replaceActiveSmallCard({ "message-1": firstAd }, "message-2", secondAd),
    { "message-2": secondAd }
  )
})
