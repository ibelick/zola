type VisibilityEntry = {
  isIntersecting: boolean
  intersectionRatio: number
}

type ObserverLike = {
  observe: (element: Element) => void
  disconnect: () => void
}

type ImpressionOptions = {
  dedupeKey: string
  impressionUrl: string
  reported: Set<string>
  report?: (url: string) => void
  createObserver?: (
    callback: (entries: VisibilityEntry[]) => void
  ) => ObserverLike
  setTimer?: (callback: () => void, delay: number) => unknown
  clearTimer?: (timer: unknown) => void
}

export function reportTrackingUrl(url: string): void {
  void fetch(url, {
    method: "GET",
    mode: "no-cors",
    keepalive: true,
  }).catch(() => undefined)
}

export function observeAdImpression(
  element: Element,
  options: ImpressionOptions
): () => void {
  const report = options.report ?? reportTrackingUrl
  const setTimer =
    options.setTimer ??
    ((callback: () => void, delay: number) => globalThis.setTimeout(callback, delay))
  const clearTimer =
    options.clearTimer ??
    ((timer: unknown) => globalThis.clearTimeout(timer as ReturnType<typeof setTimeout>))

  let timer: unknown = null
  let observer: ObserverLike
  const onVisibility = (entries: VisibilityEntry[]) => {
    const entry = entries[0]
    if (options.reported.has(options.dedupeKey)) {
      observer.disconnect()
      return
    }

    const isVisible = Boolean(
      entry?.isIntersecting && entry.intersectionRatio >= 0.5
    )
    if (!isVisible) {
      if (timer !== null) {
        clearTimer(timer)
        timer = null
      }
      return
    }
    if (timer !== null) return

    timer = setTimer(() => {
      timer = null
      if (options.reported.has(options.dedupeKey)) return
      options.reported.add(options.dedupeKey)
      report(options.impressionUrl)
      observer.disconnect()
    }, 1000)
  }

  observer = options.createObserver
    ? options.createObserver(onVisibility)
    : new IntersectionObserver(onVisibility as IntersectionObserverCallback, {
        threshold: [0.5],
      })
  observer.observe(element)

  return () => {
    if (timer !== null) clearTimer(timer)
    timer = null
    observer.disconnect()
  }
}
