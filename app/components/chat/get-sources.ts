import { SourceUIPart } from "@ai-sdk/ui-utils"
import type { UIMessageFull } from "./chat"

export function getSources(
  parts: UIMessageFull["parts"]
): SourceUIPart["source"][] {
  const sources = parts
    ?.filter((part) => part.type === "source-url")
    .map((part) => {
      if (part.type === "source-url") {
        return part.url
      }

      return null
    })
    .filter(Boolean)
    .flat()

  const validSources =
    sources?.filter(
      (source) => source && typeof source === "string" && source !== ""
    ) || []

  return validSources.map((source) => ({
    id: source!,
    sourceType: "url",
    url: source!,
    title: source!,
  }))
}
