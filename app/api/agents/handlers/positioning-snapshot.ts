import { openai } from "@ai-sdk/openai"
import { generateText, tool } from "ai"
import Exa from "exa-js"
import { z } from "zod"

const exa = new Exa(process.env.EXA_API_KEY!)

const fetchHomepageContent = tool({
  description: "Fetch and return homepage text content for a given URL",
  parameters: z.object({
    url: z.string().describe("The website URL"),
  }),
  execute: async ({ url }) => {
    const { results } = await exa.searchAndContents(`site:${url}`, {
      numResults: 1,
      livecrawl: "fallback",
    })

    const page = results[0]

    return {
      url: page.url || url,
      title: page.title || "Homepage",
      text: page.text?.slice(0, 3000) || "",
    }
  },
})

const searchOfficialSite = tool({
  description: "Search for the official website of a product",
  parameters: z.object({
    productName: z.string().describe("The name of the product"),
  }),
  execute: async ({ productName }) => {
    const { results } = await exa.search(`${productName} official website`, {
      numResults: 3,
    })

    if (results.length === 0) {
      return { url: "", error: "No results found" }
    }

    return { url: results[0].url }
  },
})

const analyzeCompetitors = tool({
  description: "Analyze competitors for a given product",
  parameters: z.object({
    productName: z.string().describe("The name of the product"),
  }),
  execute: async ({ productName }) => {
    const { results } = await exa.search(
      `${productName} competitors alternatives`,
      {
        numResults: 5,
      }
    )

    return {
      competitors: results.slice(0, 3).map((r) => ({
        name: r.title?.split(/[-|]/)[0].trim() || "",
        url: r.url,
      })),
    }
  },
})

// Positioning Snapshot Agent
export async function runPositioningSnapshotAgent(prompt: string) {
  const result = await generateText({
    model: openai("gpt-4.1-nano"),
    tools: {
      fetchHomepageContent,
      searchOfficialSite,
      analyzeCompetitors,
    },
    maxSteps: 3,
    prompt: `You are a brand positioning expert. Analyze a product and provide a positioning snapshot.

For the given input, determine if it's a URL or product name:
- For a URL: fetch the homepage content
- For a product name: first search for its official website, then fetch that content
- Also analyze its competitors

Based on the information gathered, determine:
1. The target audience (who it's for)
2. The value proposition (what it promises)
3. How it positions itself compared to competitors

Format your response as markdown with the following sections:
# Product Name

## Target Audience

## Value Proposition

## Competitive Positioning

## URL

Input: ${prompt}`,
    temperature: 0.5,
  })

  return {
    markdown: result.text,
    parts: [],
  }
}
