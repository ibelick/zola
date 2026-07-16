type AdPlatformCspOptions = {
  extraOrigins?: string
}

export const DEFAULT_AD_SERVER_BASE_URL = "http://10.1.51.76:8080"

function httpOrigin(value: string): string | null {
  try {
    const url = new URL(value)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    return url.origin
  } catch {
    return null
  }
}

export function getAdPlatformCspSources(
  adServerBaseUrl: string = process.env.AD_SERVER_BASE_URL ||
    DEFAULT_AD_SERVER_BASE_URL,
  options: AdPlatformCspOptions = {}
): string[] {
  const sources = new Set<string>()
  const adServerOrigin = httpOrigin(adServerBaseUrl)
  if (adServerOrigin) sources.add(adServerOrigin)

  const extraOrigins = options.extraOrigins ?? process.env.AD_CSP_EXTRA_ORIGINS
  for (const value of extraOrigins?.split(",") ?? []) {
    const origin = httpOrigin(value.trim())
    if (origin) sources.add(origin)
  }

  return [...sources]
}
