import assert from "node:assert/strict"
import test from "node:test"
// prettier-ignore
// @ts-expect-error Node's TypeScript test runner requires the explicit extension.
import { getSmallCardLinkPresentation, SMALL_CARD_DESCRIPTION_CLASS, SMALL_CARD_WIDTH_CLASS } from "./presentation.ts";

test("getSmallCardLinkPresentation links directly to the landing URL", () => {
  assert.deepEqual(
    getSmallCardLinkPresentation({
      title: "Budget smarter",
      badgeText: "Sponsored",
      landingUrl: "https://example.com/landing",
    }),
    {
      href: "https://example.com/landing",
      target: "_blank",
      rel: "noopener noreferrer sponsored",
      ariaLabel: "Sponsored: Budget smarter",
    }
  )
})

test("small card presentation uses half width and two description lines", () => {
  assert.equal(SMALL_CARD_WIDTH_CLASS, "w-1/2")
  assert.equal(SMALL_CARD_DESCRIPTION_CLASS, "line-clamp-2")
})
