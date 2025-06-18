import type { UIMessageFull } from "./chat"

export function getSources(parts: UIMessageFull["parts"]) {
  const sources = parts
    ?.filter(
      (part) =>
        part.type === "source-url" || part.type === "tool-summarizeSources"
    )
    .map((part) => {
      if (part.type === "source-url") {
        return part.url
      }

      if (
        part.type === "tool-summarizeSources" &&
        part.state === "output-available"
      ) {
        const result = part.output

        if (
          part.type === "tool-summarizeSources" &&
          result?.result?.[0]?.citations
        ) {
          return result.result.flatMap(
            (item: { citations?: unknown[] }) => item.citations || []
          )
        }

        return Array.isArray(result) ? result.flat() : result
      }

      return null
    })
    .filter(Boolean)
    .flat()

  const validSources =
    sources?.filter(
      (source) =>
        source && typeof source === "object" && source.url && source.url !== ""
    ) || []

  return validSources
}
