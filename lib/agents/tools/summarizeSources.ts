// lib/agents/tools/summarize-sources.ts
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

export async function summarizeSources(input: {
  searchResults: {
    query: string
    sources: { title: string; url: string; snippet: string }[]
  }[]
}): Promise<{
  result: {
    query: string
    summary: string
  }[]
}> {
  try {
    const summaries = await Promise.all(
      input.searchResults.map(async ({ query, sources }) => {
        const sourcesList = sources
          .map((s, i) => `(${i + 1}) [${s.title}](${s.url}): ${s.snippet}`)
          .join("\n")

        const { object } = await generateObject({
          model: openai("gpt-4.1-mini"),
          prompt: `Summarize "${query}" with 3–6 bullets.

- Start each bullet with "- "
- Weave the [source title](url) naturally inside each sentence.
- Don't mention "source:" or "favicon" or anything like that.
- Do not list sources separately.
- No intro, no conclusion.

Sources:
${sourcesList}
`,
          system: `
You are a senior research summarizer.

Only return clean markdown bullets with natural in-sentence links.

Use a clear, practical tone. Be specific. Never fake information.
Always integrate source links naturally inside each bullet.
          `,
          schema: z.object({ summary: z.string() }),
        })

        return {
          query,
          summary: object.summary.trim(),
        }
      })
    )

    return { result: summaries }
  } catch (error) {
    console.error("Error in summarizeSources:", error)
    throw new Error("summarizeSources failed")
  }
}
