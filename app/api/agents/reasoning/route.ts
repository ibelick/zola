import { openai } from "@ai-sdk/openai"
import { CoreMessage, streamText } from "ai"
import { z } from "zod"

const messages = [
  {
    role: "user",
    content: `You are about to generate a research report based on a user prompt.
      
  Steps:
  1. Generate a report title
  2. Create 3 related search queries
  3. Fetch and analyze sources
  4. Summarize findings into bullet points
  5. Generate a final markdown report
  
  Think out loud. Use reasoning steps to reflect on each part of the process before executing it.`,
  },
] as CoreMessage[]

export async function POST(request: Request) {
  //   const { messages } = await request.json()

  const systemMessage = `You are a step-by-step reasoning assistant.
  For each step, call addAReasoningStep.
  Think slowly, test alternatives, doubt yourself, and be methodical.`

  const result = streamText({
    model: openai("gpt-4.1-nano"),
    system: systemMessage,
    messages,
    maxSteps: 10,
    experimental_toolCallStreaming: true,
    tools: {
      addAReasoningStep: {
        description: "Add a step to the reasoning process.",
        parameters: z.object({
          title: z.string().describe("Step title"),
          content: z
            .string()
            .describe("Detailed reasoning content for this step"),
          nextStep: z
            .enum(["continue", "finalAnswer"])
            .describe("Continue or end"),
        }),
        execute: async (params) => params,
      },
    },
  })

  return result.toDataStreamResponse()
}
