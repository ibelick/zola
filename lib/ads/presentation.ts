type SmallCardLinkInput = {
  title: string
  badgeText: string
  landingUrl: string
}

export function getSmallCardLinkPresentation(input: SmallCardLinkInput) {
  return {
    href: input.landingUrl,
    target: "_blank" as const,
    rel: "noopener noreferrer sponsored",
    ariaLabel: `${input.badgeText}: ${input.title}`,
  }
}
