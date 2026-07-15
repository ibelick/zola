type SmallCardLinkInput = {
  title: string
  badgeText: string
  landingUrl: string
}

export const SMALL_CARD_WIDTH_CLASS = "w-1/2"
export const SMALL_CARD_DESCRIPTION_CLASS = "line-clamp-2"

export function getSmallCardLinkPresentation(input: SmallCardLinkInput) {
  return {
    href: input.landingUrl,
    target: "_blank" as const,
    rel: "noopener noreferrer sponsored",
    ariaLabel: `${input.badgeText}: ${input.title}`,
  }
}
