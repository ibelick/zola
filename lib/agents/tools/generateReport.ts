// lib/agents/tools/generate-report.ts
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

export async function generateReport(input: {
  findings: {
    query: string
    summary: string
  }[]
  title: string
}): Promise<{ result: string }> {
  try {
    const content = input.findings
      .map((f) => f.summary)
      .join("\n\n")
      .slice(0, 8000)

    const { object } = await generateObject({
      model: openai("gpt-4.1-mini"),
      prompt: `Write a markdown document titled "${input.title}" based on the summaries below.

- Structure with ## sections based on the queries
- Keep each bullet exactly as provided
- No source listing needed — sources are already linked in bullets
- Only capitalize first word
- Clear, practical, no filler

Summaries:
${content}
`,
      system: `
You are a senior technical writer.

Format into clean markdown:
- Use # for title
- Use ## for each major section
- Respect bullet formatting
- Do not reformat links, bullets, or headings

No intro, no conclusion.
      `,
      schema: z.object({ markdown: z.string() }),
    })

    return { result: object.markdown.trim() }
  } catch (error) {
    console.error("Error in generateReport:", error)
    throw new Error("generateReport failed")
  }
}
