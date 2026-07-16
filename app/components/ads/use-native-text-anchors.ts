"use client"

import { placeNativeTextAnchor } from "@/lib/ads/dom"
import { observeAdImpression, reportTrackingUrl } from "@/lib/ads/impression"
import {
  cleanupInactiveNativeTextImpressionObservers,
  cleanupNativeTextImpressionObservers,
  syncNativeTextImpressionObserver,
  type NativeTextObserverState,
} from "@/lib/ads/native-text-observers"
import type { NativeTextInstruction } from "@/lib/ads/types"
import { useEffect, useRef, type RefObject } from "react"

export function useNativeTextAnchors(
  messageRef: RefObject<HTMLDivElement | null>,
  content: string,
  instructions: NativeTextInstruction[],
  finalized: boolean,
  reportedImpressions: Set<string>
) {
  const observerStateRef = useRef<NativeTextObserverState>(new Map())

  useEffect(() => {
    const container = messageRef.current
    if (!container || instructions.length === 0) {
      cleanupNativeTextImpressionObservers(observerStateRef.current)
      return
    }

    const activeAnchorIds = new Set<string>()
    for (const instruction of instructions) {
      const result = placeNativeTextAnchor(container, instruction, {
        finalized,
        reportClick: reportTrackingUrl,
      })
      if (!result.placed || !result.anchor)
        continue
      const anchor = result.anchor
      if (!container.contains(anchor)) continue
      activeAnchorIds.add(instruction.anchor_dom_id)
      syncNativeTextImpressionObserver(
        observerStateRef.current,
        instruction,
        anchor,
        {
          observe: (element) =>
            observeAdImpression(element, {
              dedupeKey: `native-text:${instruction.anchor_dom_id}`,
              impressionUrl: instruction.impression_tracking_url,
              reported: reportedImpressions,
            }),
        }
      )
    }

    cleanupInactiveNativeTextImpressionObservers(
      observerStateRef.current,
      activeAnchorIds
    )
  }, [content, finalized, instructions, messageRef, reportedImpressions])

  useEffect(() => {
    return () =>
      cleanupNativeTextImpressionObservers(observerStateRef.current)
  }, [])
}
