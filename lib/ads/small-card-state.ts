import type { SmallCardAd } from "./types"

export function replaceActiveSmallCard(
  _current: Record<string, SmallCardAd>,
  messageId: string,
  ad: SmallCardAd
): Record<string, SmallCardAd> {
  return { [messageId]: ad }
}
