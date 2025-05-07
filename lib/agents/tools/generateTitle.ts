import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

export async function generateTitle(prompt: string): Promise<string> {
  try {
    const { object: titleObj } = await generateObject({
      model: openai("gpt-4.1-nano", { structuredOutputs: true }),
      schema: z.object({ title: z.string() }),
      prompt: `Write a short report title (max 12 words) for:
        "${prompt}". Only capitalize the first word; no trailing punctuation; avoid the word "report".`,
    })

    return titleObj.title
  } catch (error) {
    console.error("Failed to generate title:", error)
    throw new Error("generateTitle failed")
  }
}
