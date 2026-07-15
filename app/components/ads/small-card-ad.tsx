"use client"

import { observeAdImpression } from "@/lib/ads/impression"
import { getSmallCardLinkPresentation } from "@/lib/ads/presentation"
import type { SmallCardAd as SmallCardAdType } from "@/lib/ads/types"
import { useEffect, useRef, useState } from "react"

type SmallCardAdProps = {
  ad: SmallCardAdType
  reportedImpressions: Set<string>
}

export function SmallCardAd({ ad, reportedImpressions }: SmallCardAdProps) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const [imageFailed, setImageFailed] = useState(false)
  const link = getSmallCardLinkPresentation({
    title: ad.creative.title,
    badgeText: ad.creative.badge_text,
    clickTrackingUrl: ad.click_tracking_url,
  })

  useEffect(() => {
    if (!cardRef.current) return
    return observeAdImpression(cardRef.current, {
      dedupeKey: `small-card:${ad.ad_id}`,
      impressionUrl: ad.impression_tracking_url,
      reported: reportedImpressions,
    })
  }, [ad.ad_id, ad.impression_tracking_url, reportedImpressions])

  return (
    <a
      ref={cardRef}
      href={link.href}
      target={link.target}
      rel={link.rel}
      aria-label={link.ariaLabel}
      className="border-border/70 bg-muted/35 hover:bg-muted/65 group/ad my-2 flex w-full items-center gap-3 rounded-xl border p-3 no-underline shadow-sm transition-colors"
    >
      <span className="bg-muted text-muted-foreground flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg text-lg font-semibold">
        {imageFailed ? (
          ad.creative.title.trim().charAt(0).toUpperCase()
        ) : (
          <img
            src={ad.creative.icon_url}
            alt=""
            className="size-full object-cover"
            onError={() => setImageFailed(true)}
          />
        )}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-foreground min-w-0 flex-1 truncate text-sm font-semibold">
            {ad.creative.title}
          </span>
          <span className="text-muted-foreground bg-background/80 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide">
            {ad.creative.badge_text}
          </span>
        </span>
        <span className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-4">
          {ad.creative.description}
        </span>
      </span>
    </a>
  )
}
