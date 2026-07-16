"use client"

import { injectNativeTextAnchor } from "@/lib/ads/dom"
import { observeAdImpression, reportTrackingUrl } from "@/lib/ads/impression"
import type { NativeTextInstruction } from "@/lib/ads/types"
import { useEffect, type RefObject } from "react"

export function useNativeTextAnchors(
  messageRef: RefObject<HTMLDivElement | null>,
  content: string,
  instructions: NativeTextInstruction[],
  reportedImpressions: Set<string>
) {
  useEffect(() => {
    const container = messageRef.current
    if (!container || instructions.length === 0) return

    const cleanups: Array<() => void> = []
    for (const instruction of instructions) {
      if (!injectNativeTextAnchor(container, instruction, reportTrackingUrl))
        continue
      const anchor = container.ownerDocument.getElementById(
        instruction.anchor_dom_id
      )
      if (!anchor || !container.contains(anchor)) continue
      cleanups.push(
        observeAdImpression(anchor, {
          dedupeKey: `native-text:${instruction.anchor_dom_id}`,
          impressionUrl: instruction.impression_tracking_url,
          reported: reportedImpressions,
        })
      )
    }

    return () => cleanups.forEach((cleanup) => cleanup())
  }, [content, instructions, messageRef, reportedImpressions])
}
