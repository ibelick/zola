import { tool } from "ai"
import { z } from "zod"
import { runImageSearch } from "./run"

export const imageSearchTool = tool({
  id: "exa.imageSearch" as const,
  description: "Search for relevant images related to a query using Exa.",
  parameters: z.object({
    query: z.string().describe("Search topic for fetching images"),
    numResults: z
      .number()
      .optional()
      .describe("Max number of images to return (default: 3)"),
  }),
  async execute({ query, numResults }) {
    return await runImageSearch({ query, numResults })
  },
})
