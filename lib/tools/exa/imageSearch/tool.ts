import { tool } from "ai"
import { z } from "zod"
import { runImageSearch } from "./run"

export const imageSearchTool = tool({
  description: "Search for images using Exa.",
  parameters: z.object({
    query: z.string().describe("The topic to search for images"),
    numResults: z
      .number()
      .optional()
      .describe("Max number of images (default 3)"),
  }),
  async execute({ query, numResults }) {
    return await runImageSearch({ query, numResults })
  },
})
