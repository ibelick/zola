import {
  buildSmallCardUpstreamRequest,
  parseSmallCardResponse,
} from "@/lib/ads/small-card"
import { MESSAGE_MAX_LENGTH } from "@/lib/config"

function parseInput(value: unknown): { query: string; language: string } | null {
  if (typeof value !== "object" || value === null) return null
  const input = value as Record<string, unknown>
  if (
    typeof input.query !== "string" ||
    input.query.trim().length === 0 ||
    input.query.length > MESSAGE_MAX_LENGTH
  ) {
    return null
  }

  return {
    query: input.query,
    language:
      typeof input.language === "string" && input.language.trim().length > 0
        ? input.language.slice(0, 35)
        : "en-US",
  }
}

export async function POST(request: Request) {
  try {
    const input = parseInput(await request.json())
    if (!input) return Response.json({ ad: null })

    const upstream = buildSmallCardUpstreamRequest(
      {
        ...input,
        userAgent: request.headers.get("user-agent") || "Unknown",
      },
      `req_sc_${crypto.randomUUID()}`
    )
    const response = await fetch(upstream.url, {
      method: "POST",
      headers: upstream.headers,
      body: JSON.stringify(upstream.body),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    })

    if (!response.ok) return Response.json({ ad: null })
    return Response.json({ ad: parseSmallCardResponse(await response.json()) })
  } catch {
    return Response.json({ ad: null })
  }
}
