type SmallCardLinkInput = {
  title: string
  badgeText: string
  clickTrackingUrl: string
}

export function getSmallCardLinkPresentation(input: SmallCardLinkInput) {
  return {
    href: input.clickTrackingUrl,
    target: "_blank" as const,
    rel: "noopener noreferrer sponsored",
    ariaLabel: `${input.badgeText}: ${input.title}`,
  }
}
