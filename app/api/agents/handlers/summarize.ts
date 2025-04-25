import { TECHNICAL_WRITER_PROMPT } from "@/app/api/agents/core/prompts"
import { generateReportTitle } from "@/app/api/agents/core/tools/ai"
import { AgentOutput } from "@/app/api/agents/core/types"
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

/**
 * Generate a concise summary
 */
async function generateSummary(prompt: string): Promise<string> {
  const { object } = await generateObject({
    model: openai("gpt-4.1-mini"),
    prompt: `Generate a concise summary of: "${prompt}".
    
    Make it comprehensive yet brief. Focus on essential information only.
    Return only markdown content. No intro or explanation.`,
    system: TECHNICAL_WRITER_PROMPT,
    schema: z.object({
      markdown: z.string(),
    }),
  })

  return object.markdown.trim()
}

/**
 * Summarization agent
 */
export async function runSummarizeAgent(prompt: string): Promise<AgentOutput> {
  // 1. Generate a title for the summary
  const title = await generateReportTitle(prompt)

  // 2. Generate the summary content
  const summary = await generateSummary(prompt)

  // 3. Return the markdown with no source citations
  return {
    markdown: summary,
    parts: [],
  }
}
