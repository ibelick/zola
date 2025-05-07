// lib/agents/tools.ts
import { tool } from "ai"
import { z } from "zod"
import { generateReport } from "./tools/generateReport"
import { generateTitle } from "./tools/generateTitle"
import { planSearchQueries } from "./tools/planSearchQuery"
import { searchWeb } from "./tools/searchWeb"
import { summarizeSources } from "./tools/summarizeSources"

export const tools = {
  search: tool({
    description: "Search the web.",
    parameters: z.object({
      query: z.string(),
    }),
    async execute({ query }) {
      return await searchWeb(query)
    },
  }),
  planSearchQueries: tool({
    description: "Plan search queries.",
    parameters: z.object({
      prompt: z.string(),
    }),
    async execute({ prompt }) {
      return await planSearchQueries({ prompt })
    },
  }),
  generateTitle: tool({
    description: "Generate a title for a report.",
    parameters: z.object({
      prompt: z.string(),
    }),
    async execute({ prompt }) {
      return await generateTitle(prompt)
    },
  }),
  summarizeSources: tool({
    description: "Summarize sources.",
    parameters: z.object({
      searchResults: z
        .union([
          z.array(
            z.object({
              query: z.string(),
              sources: z.array(
                z.object({
                  title: z.string(),
                  url: z.string(),
                  snippet: z.string(),
                })
              ),
            })
          ),
          z
            .object({
              query: z.string(),
              sources: z.array(
                z.object({
                  title: z.string(),
                  url: z.string(),
                  snippet: z.string(),
                })
              ),
            })
            .transform((item) => [item]),
        ])
        .transform((input) => (Array.isArray(input) ? input : [input])),
    }),
    async execute({ searchResults }) {
      return await summarizeSources({ searchResults })
    },
  }),
  generateReport: tool({
    description: "Generate a report.",
    parameters: z.object({
      findings: z.array(
        z.object({
          query: z.string(),
          summary: z.string(),
          citations: z.array(
            z.object({
              title: z.string(),
              url: z.string(),
              snippet: z.string(),
            })
          ),
        })
      ),
      title: z.string(),
    }),
    async execute({ findings, title }) {
      return await generateReport({ findings, title })
    },
  }),
}
