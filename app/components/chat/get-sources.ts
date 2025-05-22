import { UIMessageWithMetadata } from "./chat"

export function getSources(parts: UIMessageWithMetadata["parts"]) {
  const sources = parts
    ?.filter(
      (part) => part.type === "source-url" || part.type === "tool-invocation"
    )
    .map((part) => {
      if (part.type === "source-url") {
        return part.url
      }

      if (
        part.type === "tool-invocation" &&
        part.toolInvocation.state === "result"
      ) {
        const result = part.toolInvocation.result

        if (
          part.toolInvocation.toolName === "summarizeSources" &&
          result?.result?.[0]?.citations
        ) {
          return result.result.flatMap((item: any) => item.citations || [])
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
