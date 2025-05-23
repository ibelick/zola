import { tool } from "ai"
import { z } from "zod"
import { runWebSearch } from "./run"

export const webSearchTool = tool({
  id: "exa.webSearch" as const,
  description:
    "Search the web using Exa. Returns relevant results with live crawling.",
  parameters: z.object({
    query: z.string().describe("Search query"),
    numResults: z
      .number()
      .optional()
      .describe("Number of results (default: 5)"),
  }),
  async execute({ query, numResults }) {
    return await runWebSearch({ query, numResults })
  },
})
