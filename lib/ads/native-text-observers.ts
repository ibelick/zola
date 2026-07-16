import type { NativeTextInstruction } from "./types"

type NativeTextObserverRecord = {
  element: Element
  cleanup: () => void
}

export type NativeTextObserverState = Map<string, NativeTextObserverRecord>

type SyncNativeTextObserverOptions = {
  observe: (element: Element) => () => void
}

export function syncNativeTextImpressionObserver(
  observers: NativeTextObserverState,
  instruction: NativeTextInstruction,
  anchor: Element,
  options: SyncNativeTextObserverOptions
): void {
  const existing = observers.get(instruction.anchor_dom_id)
  if (existing?.element === anchor) return

  existing?.cleanup()

  const cleanup = options.observe(anchor)
  observers.set(instruction.anchor_dom_id, { element: anchor, cleanup })
}

export function cleanupInactiveNativeTextImpressionObservers(
  observers: NativeTextObserverState,
  activeAnchorIds: Set<string>
): void {
  for (const [anchorId, observer] of observers) {
    if (activeAnchorIds.has(anchorId)) continue
    observer.cleanup()
    observers.delete(anchorId)
  }
}

export function cleanupNativeTextImpressionObservers(
  observers: NativeTextObserverState
): void {
  for (const observer of observers.values()) observer.cleanup()
  observers.clear()
}
