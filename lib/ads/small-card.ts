import type { SmallCardAd } from "./types"

export const AD_SERVER_BASE_URL =
  process.env.AD_SERVER_BASE_URL || "http://10.1.51.76:8080"
export const SMALL_CARD_PLACEMENT_ID =
  process.env.SMALL_CARD_PLACEMENT_ID || "7"
export const SMALL_CARD_PLACEMENT_KEY =
  process.env.SMALL_CARD_PLACEMENT_KEY || "cmrlha7j000011xywcsjy39x1"

type SmallCardQuery = {
  query: string
  language: string
  userAgent: string
}

type SmallCardUpstreamRequest = {
  url: string
  headers: Record<string, string>
  body: {
    slot_id: string
    request_id: string
    device: { ua: string; language: string }
    context: { query: string; keywords: string[] }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function isHttpUrl(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false
  try {
    const protocol = new URL(value).protocol
    return protocol === "http:" || protocol === "https:"
  } catch {
    return false
  }
}

export function buildSmallCardUpstreamRequest(
  input: SmallCardQuery,
  requestId: string
): SmallCardUpstreamRequest {
  return {
    url: `${AD_SERVER_BASE_URL.replace(/\/$/, "")}/api/v1/ad/query`,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Placement-Key": SMALL_CARD_PLACEMENT_KEY,
      "X-Publisher-Key": SMALL_CARD_PLACEMENT_KEY,
      "X-Ad-Slot-ID": SMALL_CARD_PLACEMENT_ID,
    },
    body: {
      slot_id: SMALL_CARD_PLACEMENT_ID,
      request_id: requestId,
      device: { ua: input.userAgent, language: input.language },
      context: { query: input.query, keywords: [] },
    },
  }
}

export function parseSmallCardResponse(value: unknown): SmallCardAd | null {
  if (!isRecord(value) || value.code !== 200 || value.style !== "SMALL_CARD") {
    return null
  }
  if (!Array.isArray(value.ads) || !isRecord(value.ads[0])) return null

  const ad = value.ads[0]
  if (!isRecord(ad.creative)) return null
  const creative = ad.creative

  if (
    !isNonEmptyString(ad.ad_id) ||
    !isHttpUrl(creative.icon_url) ||
    !isNonEmptyString(creative.title) ||
    !isNonEmptyString(creative.description) ||
    !isNonEmptyString(creative.badge_text) ||
    !isHttpUrl(ad.landing_url) ||
    !isHttpUrl(ad.click_tracking_url) ||
    !isHttpUrl(ad.impression_tracking_url)
  ) {
    return null
  }

  return {
    ad_id: ad.ad_id,
    creative: {
      icon_url: creative.icon_url,
      title: creative.title,
      description: creative.description,
      badge_text: creative.badge_text,
    },
    landing_url: ad.landing_url,
    click_tracking_url: ad.click_tracking_url,
    impression_tracking_url: ad.impression_tracking_url,
  }
}
