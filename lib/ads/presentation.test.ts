import assert from "node:assert/strict"
import test from "node:test"
// @ts-expect-error Node's TypeScript test runner requires the explicit extension.
import { getSmallCardLinkPresentation } from "./presentation.ts"

test("getSmallCardLinkPresentation sends clicks through tracking with an ad label", () => {
  assert.deepEqual(
    getSmallCardLinkPresentation({
      title: "Budget smarter",
      badgeText: "Sponsored",
      clickTrackingUrl: "https://example.com/click",
    }),
    {
      href: "https://example.com/click",
      target: "_blank",
      rel: "noopener noreferrer sponsored",
      ariaLabel: "Sponsored: Budget smarter",
    }
  )
})
