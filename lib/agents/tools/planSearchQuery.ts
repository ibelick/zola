// lib/agents/tools/plan-search-queries.ts
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

export async function planSearchQueries(input: {
  prompt: string
}): Promise<{ result: string[] }> {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4.1-nano", { structuredOutputs: true }),
      schema: z.object({ queries: z.array(z.string()) }),
      prompt: `Generate exactly 3 search queries for "${input.prompt}" that would make good H2 sections.`,
    })

    return { result: object.queries }
  } catch (error) {
    console.error("Error in planSearchQueries:", error)
    throw new Error("planSearchQueries failed")
  }
}
