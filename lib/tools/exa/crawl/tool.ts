import { tool } from "ai"
import { z } from "zod"
import { runCrawl } from "./run"

export const crawlTool = tool({
  id: "exa.crawl" as const,
  description:
    "Extract content from a specific URL using Exa. Useful for articles, PDFs, or any webpage when you know the exact URL.",
  parameters: z.object({
    url: z.string().url().describe("The URL to crawl"),
  }),
  async execute({ url }) {
    return await runCrawl({ url })
  },
})
