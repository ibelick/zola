"use client"

import { placeNativeTextAnchor } from "@/lib/ads/dom"
import { observeAdImpression, reportTrackingUrl } from "@/lib/ads/impression"
import type { NativeTextInstruction } from "@/lib/ads/types"
import { useEffect, type RefObject } from "react"

export function useNativeTextAnchors(
  messageRef: RefObject<HTMLDivElement | null>,
  content: string,
  instructions: NativeTextInstruction[],
  finalized: boolean,
  reportedImpressions: Set<string>
) {
  useEffect(() => {
    const container = messageRef.current
    if (!container || instructions.length === 0) return

    const cleanups: Array<() => void> = []
    for (const instruction of instructions) {
      const result = placeNativeTextAnchor(container, instruction, {
        finalized,
        reportClick: reportTrackingUrl,
      })
      if (!result.placed || !result.anchor)
        continue
      const anchor = result.anchor
      if (!container.contains(anchor)) continue
      cleanups.push(
        observeAdImpression(anchor, {
          dedupeKey: `native-text:${instruction.anchor_dom_id}`,
          impressionUrl: instruction.impression_tracking_url,
          reported: reportedImpressions,
        })
      )
    }

    return () => cleanups.forEach((cleanup) => cleanup())
  }, [content, finalized, instructions, messageRef, reportedImpressions])
}
