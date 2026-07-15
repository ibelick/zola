import assert from "node:assert/strict"
import test from "node:test"
// prettier-ignore
// @ts-expect-error Node's TypeScript test runner requires the explicit extension.
import { buildSmallCardUpstreamRequest, parseSmallCardResponse, SMALL_CARD_PLACEMENT_KEY } from "./small-card.ts";

test("buildSmallCardUpstreamRequest maps the approved placement", () => {
  const request = buildSmallCardUpstreamRequest(
    { query: "budget", language: "zh-CN", userAgent: "test-agent" },
    "req-1"
  )

  assert.equal(request.url, "http://10.1.51.76:8080/api/v1/ad/query")
  assert.equal(request.headers["X-Placement-Key"], SMALL_CARD_PLACEMENT_KEY)
  assert.equal(request.headers["X-Publisher-Key"], SMALL_CARD_PLACEMENT_KEY)
  assert.equal(request.headers["X-Ad-Slot-ID"], "7")
  assert.deepEqual(request.body, {
    slot_id: "7",
    request_id: "req-1",
    device: { ua: "test-agent", language: "zh-CN" },
    context: { query: "budget", keywords: [] },
  })
})

test("parseSmallCardResponse selects the first valid ad", () => {
  const ad = parseSmallCardResponse({
    code: 200,
    message: "success",
    request_id: "req-1",
    style: "SMALL_CARD",
    ads: [
      {
        ad_id: "ad-1",
        creative: {
          icon_url: "https://cdn.example.com/icon.png",
          title: "Budget smarter",
          description: "Track every account in one place.",
          badge_text: "Sponsored",
        },
        landing_url: "https://example.com/landing",
        click_tracking_url: "https://example.com/click",
        impression_tracking_url: "http://example.com/impression",
      },
      {
        ad_id: "ad-2",
        creative: {
          icon_url: "https://cdn.example.com/other.png",
          title: "Other",
          description: "Other ad",
          badge_text: "Ad",
        },
        landing_url: "https://example.com/other",
        click_tracking_url: "https://example.com/other-click",
        impression_tracking_url: "https://example.com/other-impression",
      },
    ],
  })

  assert.equal(ad?.ad_id, "ad-1")
  assert.equal(ad?.creative.title, "Budget smarter")
})

test("parseSmallCardResponse silently rejects empty, unsuccessful, or unsafe ads", () => {
  assert.equal(parseSmallCardResponse({ code: 500, ads: [] }), null)
  assert.equal(
    parseSmallCardResponse({
      code: 200,
      style: "SMALL_CARD",
      ads: [],
    }),
    null
  )
  assert.equal(
    parseSmallCardResponse({
      code: 200,
      style: "SMALL_CARD",
      ads: [
        {
          ad_id: "ad-1",
          creative: {
            icon_url: "javascript:alert(1)",
            title: "Unsafe",
            description: "Unsafe ad",
            badge_text: "Ad",
          },
          landing_url: "https://example.com",
          click_tracking_url: "https://example.com/click",
          impression_tracking_url: "https://example.com/impression",
        },
      ],
    }),
    null
  )
})
