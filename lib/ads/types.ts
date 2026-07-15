export type NativeTextInstruction = {
  ad_id: string
  keyword: string
  anchor_dom_id: string
  landing_url: string
  click_tracking_url: string
  impression_tracking_url: string
}

export type SmallCardAd = {
  ad_id: string
  creative: {
    icon_url: string
    title: string
    description: string
    badge_text: string
  }
  landing_url: string
  click_tracking_url: string
  impression_tracking_url: string
}
