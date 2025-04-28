import { AgentOutput, ResearchFinding } from "../types"

export function generateCitationData(findings: ResearchFinding[]) {
  const citationMap = new Map<string, string>()
  const refLines: string[] = []
  const parts: AgentOutput["parts"] = []
  let index = 0

  findings.forEach(({ citations }) => {
    citations.forEach((src) => {
      if (!citationMap.has(src.url)) {
        const id = `src-${index++}`
        citationMap.set(src.url, id)
        refLines.push(`[${id}]: ${src.title} — ${src.url}`)
        parts.push({
          type: "source",
          source: {
            sourceType: "url",
            id,
            url: src.url,
            title: src.title,
          },
        })
      }
    })
  })

  return {
    citationMap,
    citationReferenceBlock: refLines.join("\n"),
    citationParts: parts,
  }
}
