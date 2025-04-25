import { AgentOutput } from "@/app/api/agents/core/types"
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import Exa from "exa-js"
import { z } from "zod"

// Initialize Exa client
const exa = new Exa(process.env.EXA_API_KEY!)

type RelevantUrl = {
  type:
    | "homepage"
    | "pricing"
    | "docs"
    | "about"
    | "blog"
    | "careers"
    | "features"
  url: string
}

async function extractProductSlug(prompt: string) {
  const schema = z.object({
    product: z.string().min(2).max(50), // example: linear.app or notion.so
  })

  const { object } = await generateObject({
    model: openai("gpt-4.1-nano"),
    schema,
    prompt: `Extract the main product domain or brand slug from this prompt. Respond with just the domain (e.g. linear.app or notion.so), not the full sentence.

Prompt:
"${prompt}"`,
  })

  return object.product.toLowerCase().trim()
}

const extractProductsFromPrompt = async (prompt: string) => {
  const schema = z.object({
    isMultiple: z.boolean(),
    products: z
      .array(
        z.object({
          name: z.string(),
          url: z.string().optional(),
        })
      )
      .min(1),
  })

  const { object } = await generateObject({
    model: openai("gpt-4.1-nano"),
    schema,
    prompt: `Analyze this prompt and return structured data:

1. Detect if it's about multiple products (use true/false).
2. Extract a list of products. Each product can include:
- name (always)
- url (if available)

Example input:
"1. Linear: https://linear.app\n2. Mozza: https://mozza.io\nOr analyze Figma."

Only extract names and URLs. If no URL is present, skip it or leave it empty.

Prompt:
"""
${prompt}
"""`,
  })

  return object
}

async function extractRelevantUrls(
  productName: string
): Promise<RelevantUrl[]> {
  const query = `Find the homepage, pricing page, features page, and blog (if available) for the product \"${productName}\". Only return URLs from the official product site.`

  const { results } = await exa.searchAndContents(query, {
    numResults: 10,
    livecrawl: "always",
  })

  const urls: RelevantUrl[] = []
  const seen = new Set<string>()

  for (const r of results) {
    const url = r.url?.toLowerCase()
    if (!url || seen.has(url)) continue
    seen.add(url)

    if (url.includes("/pricing")) {
      urls.push({ type: "pricing", url: r.url })
    } else if (url.includes("/features")) {
      urls.push({ type: "features", url: r.url })
    } else if (url.includes("/blog")) {
      urls.push({ type: "blog", url: r.url })
    } else if (url.includes(productName.toLowerCase())) {
      urls.push({ type: "homepage", url: r.url })
    }
  }

  // Ensure homepage is included if available
  const hasHomepage = urls.some((u) => u.type === "homepage")
  if (!hasHomepage) {
    const homepage = results.find((r) =>
      r.url?.includes(productName.toLowerCase())
    )?.url
    if (homepage) {
      urls.unshift({ type: "homepage", url: homepage })
    }
  }

  return urls.slice(0, 5) // Limit to top 5
}

async function fetchWebsiteContent(urls: { type: string; url: string }[]) {
  const results = await Promise.all(
    urls.map(async ({ type, url }) => {
      const { results } = await exa.searchAndContents(url, {
        livecrawl: "always",
        numResults: 1,
      })

      const page = results[0]

      return {
        type,
        title: page.title || "",
        url: page.url || url,
        text: page.text?.slice(0, 1000) || "", // limit content
      }
    })
  )

  return results
}

async function summarizeContentByType(
  contents: { type: string; text: string }[]
) {
  const summaries = await Promise.all(
    contents.map(async ({ type, text }) => {
      const schema = z.object({
        summary: z.string().min(50),
      })

      const promptMap: Record<string, string> = {
        pricing:
          "Summarize this pricing page into clear, structured tiers with costs and features.",
        homepage:
          "Extract brand tone, messaging style, and core product claims from this homepage.",
        features:
          "List key features mentioned in this product page. Focus on unique value.",
        blog: "Summarize the main argument or insight from this article.",
      }

      const prompt =
        promptMap[type] || "Summarize this page clearly and concisely."

      const { object } = await generateObject({
        model: openai("gpt-4.1-nano"),
        schema,
        prompt: `${prompt}\n\n---\n\n${text.slice(0, 3000)}`,
      })

      return {
        type,
        summary: object.summary,
      }
    })
  )

  return summaries
}

type SummarySection = {
  type: string
  summary: string
}

type Mention = {
  title: string
  url: string
}

type ExaInsights = {
  notableMentions: string[]
  keywordStrategy: string
  growthSignals: string
}

function generateFinalTeardown({
  productName,
  summaries,
  exaInsights,
  citations,
}: {
  productName: string
  summaries: SummarySection[]
  exaInsights: ExaInsights
  citations: Mention[]
}) {
  const markdown = [
    `# ${productName} — Competitor Teardown\n`,
    `## Positioning, Product & Pricing\n`,
    ...summaries.map((s) => `### ${s.type}\n${s.summary.trim()}\n`),

    `## Growth & Marketing Insights\n`,
    `**Keyword Strategy:** ${exaInsights.keywordStrategy}\n\n`,
    `**Growth Signals:** ${exaInsights.growthSignals}\n\n`,
    `**Notable Mentions:**\n${exaInsights.notableMentions.map((m) => `- ${m}`).join("\n")}\n`,

    `## Sources\n`,
    ...citations.map((c) => `- [${c.title}](${c.url})`),

    `\n---\n`,
    `> ✨ Want to go deeper? [Remix this analysis](/agents/competitor-teardown) or [Compare vs another product](/agents/compare).`,
  ]

  return markdown.join("\n")
}

async function enrichWithExaInsights(productName: string) {
  // 1. Search for general mentions and SEO signals
  const { results } = await exa.searchAndContents(
    `${productName} SEO growth site:*.com`,
    {
      numResults: 5,
      useAutoprompt: true,
      livecrawl: "fallback",
    }
  )

  const cleanedResults = results.map((r) => ({
    title: r.title || "",
    url: r.url || "",
    text: r.text?.slice(0, 1000) || "",
  }))

  // 2. Send to LLM for structured insights
  const { object } = await generateObject({
    model: openai("gpt-4.1-nano"),
    schema: z.object({
      notableMentions: z.array(z.string()).default([]),
      keywordStrategy: z.string().default(""),
      growthSignals: z.string().default(""),
    }),
    prompt: `You are analyzing growth and marketing signals for ${productName}.
      
  Here are some search results, backlinks, and SEO data:
  
  ${cleanedResults
    .map((r, i) => `${i + 1}. ${r.title} - ${r.text.slice(0, 300)}\n${r.url}`)
    .join("\n\n")}
  
  Give me:
  - Notable mentions (list)
  - Their keyword strategy (1 short paragraph)
  - Growth signals or marketing insights (1 short paragraph)`,
  })

  return {
    notableMentions: object.notableMentions || [],
    keywordStrategy: object.keywordStrategy || "",
    growthSignals: object.growthSignals || "",
  }
}

/**
 * Research agent that generates a report based on web search results
 */
export async function runCompetitorTeardownAgent(
  prompt: string
): Promise<AgentOutput> {
  const productName = await extractProductSlug(prompt)

  const urls = await extractRelevantUrls(productName)

  const pageContents = await fetchWebsiteContent(urls)

  const teardown = await summarizeContentByType(pageContents)

  const enriched = await enrichWithExaInsights(prompt)

  const formatted = generateFinalTeardown({
    productName: prompt,
    summaries: teardown,
    exaInsights: enriched,
    citations: [],
  })

  return {
    markdown: formatted,
    parts: urls.map((u) => ({
      type: "source",
      source: {
        sourceType: "url",
        id: u.url,
        url: u.url,
        title: u.type,
      },
    })),
  }
}
