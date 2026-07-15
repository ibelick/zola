import type { NativeTextInstruction } from "./types"

export const NATIVE_TEXT_WS_URL =
  process.env.NEXT_PUBLIC_NATIVE_TEXT_WS_URL ||
  "ws://10.1.51.76:8080/api/v1/ad/stream-match"
export const NATIVE_TEXT_PLACEMENT_ID =
  process.env.NEXT_PUBLIC_NATIVE_TEXT_PLACEMENT_ID || "8"
export const NATIVE_TEXT_PLACEMENT_KEY =
  process.env.NEXT_PUBLIC_NATIVE_TEXT_PLACEMENT_KEY ||
  "cmrloph8700031xywuz5ijj94"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false

  try {
    const protocol = new URL(value).protocol
    return protocol === "http:" || protocol === "https:"
  } catch {
    return false
  }
}

export function buildNativeTextUrl(requestId: string): string {
  const url = new URL(NATIVE_TEXT_WS_URL)
  url.searchParams.set("placement_key", NATIVE_TEXT_PLACEMENT_KEY)
  url.searchParams.set("slot_id", NATIVE_TEXT_PLACEMENT_ID)
  url.searchParams.set("request_id", requestId)
  return url.toString()
}

export function getTextDelta(previous: string, current: string): string {
  if (previous === current) return ""
  return current.startsWith(previous) ? current.slice(previous.length) : current
}

export function createTextChunkFrame(
  chunkId: number,
  text: string,
  timestamp: number
) {
  return {
    event: "text_chunk" as const,
    data: { chunk_id: chunkId, text, timestamp },
  }
}

export function parseNativeTextInstruction(
  value: unknown
): NativeTextInstruction | null {
  if (!isRecord(value) || value.event !== "inject_anchor") return null
  if (!isRecord(value.data)) return null

  const data = value.data
  const requiredStrings = [
    data.ad_id,
    data.keyword,
    data.anchor_dom_id,
    data.landing_url,
    data.click_tracking_url,
    data.impression_tracking_url,
  ]
  if (
    requiredStrings.some(
      (field) => typeof field !== "string" || field.trim().length === 0
    )
  ) {
    return null
  }
  if (
    !isHttpUrl(data.landing_url) ||
    !isHttpUrl(data.click_tracking_url) ||
    !isHttpUrl(data.impression_tracking_url)
  ) {
    return null
  }

  return {
    ad_id: data.ad_id as string,
    keyword: data.keyword as string,
    anchor_dom_id: data.anchor_dom_id as string,
    landing_url: data.landing_url as string,
    click_tracking_url: data.click_tracking_url as string,
    impression_tracking_url: data.impression_tracking_url as string,
  }
}
