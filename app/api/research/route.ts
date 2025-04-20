import {
  checkSpecialAgentUsage,
  checkUsage,
  incrementSpecialAgentUsage,
  incrementUsage,
  SpecialAgentLimitError,
  UsageLimitError,
} from "@/lib/api"
import { sanitizeUserInput } from "@/lib/sanitize"
import { validateUserIdentity } from "@/lib/server/api"
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import Exa from "exa-js"
import { z } from "zod"

const exa = new Exa(process.env.EXA_API_KEY!)

async function generateReportTitle(prompt: string) {
  const { object: titleObj } = await generateObject({
    model: openai("gpt-4.1-nano", { structuredOutputs: true }),
    schema: z.object({ title: z.string() }),
    prompt: `Write a short report title (max 12 words) for:
  "${prompt}". Only capitalize the first word; no trailing punctuation; avoid the word “report”.`,
  })

  return titleObj.title
}

async function generateSearchQueries(prompt: string) {
  const { object: queries } = await generateObject({
    model: openai("gpt-4.1-nano", { structuredOutputs: true }),
    schema: z.object({ queries: z.array(z.string()) }),
    prompt: `Generate exactly 3 search queries for "${prompt}" that would make good H2 sections.`,
  })

  return queries
}

async function fetchSearchResults(queries: string[]) {
  const searchResults = await Promise.all(
    queries.map(async (query) => {
      const { results } = await exa.searchAndContents(query, {
        livecrawl: "always",
        numResults: 3,
      })
      const seen = new Set<string>()
      const unique = results
        .filter((r) => r.url && !seen.has(r.url) && seen.add(r.url))
        .slice(0, 2)

      return {
        query,
        sources: unique.map((r) => ({
          title: r.title ?? "Untitled",
          url: r.url!,
          snippet: (r.text ?? "").slice(0, 350),
        })),
      }
    })
  )

  return searchResults
}

async function summarizeSources(
  searchResults: {
    query: string
    sources: { title: string; url: string; snippet: string }[]
  }[]
) {
  const summaries = await Promise.all(
    searchResults.map(async ({ query, sources }) => {
      const bulletedSources = sources
        .map((s, i) => `${i + 1}. "${s.title}": ${s.snippet}`)
        .join("\n")

      const { object } = await generateObject({
        model: openai("gpt-4.1-mini"),
        prompt: `Summarize the key insights about "${query}" as **exactly 2-6 bullets**.
  • Each bullet **must start with "-" "** (hyphen + space) – no other bullet symbols.
  • One concise sentence per bullet; no intro, no conclusion, no extra paragraphs.
  • Base the bullets only on the information below, do not include links.
  • Focus on specific ideas, patterns, or tactics, not general claims.
  • Do not sound AI-generated, sound like a human writing a report.
  
  ${bulletedSources}`,
        system: `You are a senior research writer.

Your job is to extract only the most useful and practical insights from a given source.

Write in a clear, direct tone. Avoid filler. No introductions or conclusions.

Always return 3–6 markdown bullet points starting with "- ".

Be specific. If nothing useful is in the snippet, say: "- No relevant insight found."
`,
        schema: z.object({
          summary: z.string(),
        }),
      })

      return {
        query,
        summary: object.summary.trim(),
        citations: sources,
      }
    })
  )

  return summaries
}

type ResearchFinding = {
  query: string
  summary: string
  citations: { title: string; url: string; snippet: string }[]
}

async function analyzeSufficiency(findings: ResearchFinding[], topic: string) {
  const content = findings
    .map((f) => f.summary)
    .join("\n\n")
    .slice(0, 8000) // limit tokens

  const { object } = await generateObject({
    model: openai("gpt-4.1-mini"),
    prompt: `You are reviewing the following findings for the research topic: "${topic}".

    <findings>
    ${content}
    </findings>
    
    Answer:
    - Is this content sufficient to write a useful and specific report?
    - If not, what important information is still missing?
    - Suggest up to 3 follow-up search queries to complete the missing parts.
    
    Respond clearly as JSON. Be pragmatic, not perfectionist.`,
    system: `
You are a senior research analyst.

Your job is to assess whether the findings are **enough to produce a helpful report**.

Be practical: assume the user wants to move fast. If the findings include specific, diverse, and actionable content—even if imperfect—mark it as sufficient.

If something important is missing, suggest targeted queries to close the gap.

Only return structured JSON. No filler.
`,
    schema: z.object({
      sufficient: z.boolean(),
      missing: z.array(z.string()).optional(),
      followupQueries: z.array(z.string()).optional(),
    }),
  })

  return {
    sufficient: object.sufficient,
    missing: object.missing ?? [],
    followupQueries: object.followupQueries ?? [],
  }
}

async function generateReport(findings: ResearchFinding[], title: string) {
  const content = findings
    .map((f) => f.summary)
    .join("\n\n")
    .slice(0, 8000)

  const { object } = await generateObject({
    model: openai("gpt-4.1-mini"),
    prompt: `Write a concise, well-structured markdown report titled "${title}".
  Use the research notes below. If anything is missing, fill the gaps with your knowledge.
  
  <research>
  ${content}
  </research>
  
  Return only markdown content. No intro or explanation outside the report.`,
    system: `
  You are a senior technical writer with deep domain knowledge.
  
  Write a report in markdown. Keep it:
  - Structured (H1, H2, H3)
  - Only capitalize the first word of each sentence
  - Clear and direct
  - Based on the provided findings
  - Filled with real, practical insights
  - Not AI-generic, sound sharp and human
  
  Use:
  # Title
  ## Section
  ### Subsection
  - Bullet points when useful
  - Code blocks if relevant
  
  Do not explain the task. Just return the markdown. Start immediately with "#".
  `,
    schema: z.object({ markdown: z.string() }),
  })

  return object.markdown.trim()
}

async function runResearchAgent(prompt: string) {
  const reportTitle = await generateReportTitle(prompt)
  const searchQueries = await generateSearchQueries(prompt)
  const searchResults = await fetchSearchResults(searchQueries.queries)
  const summaries = await summarizeSources(searchResults)
  //   const { sufficient, missing, followupQueries } = await analyzeSufficiency(
  //     summaries,
  //     prompt
  //   )
  const report = await generateReport(summaries, reportTitle)

  return {
    markdown: report,
    parts: summaries.flatMap(({ citations }, i) =>
      citations.map((src, j) => ({
        type: "source",
        source: {
          sourceType: "url",
          id: `src-${i}-${j}`,
          url: src.url,
          title: src.title,
        },
      }))
    ),
  }
}

function jsonRes(
  body: Record<string, unknown>,
  status = 200,
  headers: HeadersInit = {}
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  })
}

export async function POST(req: Request) {
  const start = Date.now()
  try {
    /* ---------- 0. basic validation ---------- */
    const { prompt, chatId, userId, isAuthenticated } = await req.json()
    if (!prompt || !chatId || !userId) {
      return jsonRes({ error: "Missing data" }, 400)
    }

    /* ---------- 1. auth + limit checks ---------- */
    let supabase
    try {
      supabase = await validateUserIdentity(userId, isAuthenticated)
      await checkUsage(supabase, userId)
      await checkSpecialAgentUsage(supabase, userId)
    } catch (e) {
      if (e instanceof UsageLimitError || e instanceof SpecialAgentLimitError) {
        return jsonRes({ error: e.message, code: e.code }, 403)
      }
      console.error("❌ Identity / limit check failed", e)
      return jsonRes({ error: "Auth or quota check failed" }, 401)
    }

    const sanitizedPrompt = sanitizeUserInput(prompt)

    /* ---------- 2. persist user message ---------- */
    const { error: saveUserErr } = await supabase.from("messages").insert({
      chat_id: chatId,
      role: "user",
      content: sanitizedPrompt,
      user_id: userId,
    })
    if (saveUserErr) {
      console.error("❌ DB insert (user msg) failed", saveUserErr)
      return jsonRes({ error: "Database error when saving message" }, 502)
    }

    /* ---------- 3. run the research agent ---------- */
    let result
    try {
      result = await runResearchAgent(sanitizedPrompt)
    } catch (e) {
      console.error("❌ runResearchAgent failed", e)
      return jsonRes({ error: "Research generation failed" }, 502)
    }

    /* ---------- 4. persist assistant message ---------- */
    const { error: saveAssistantErr } = await supabase.from("messages").insert({
      chat_id: chatId,
      role: "assistant",
      content: result.markdown,
      user_id: userId,
      parts: result.parts,
    })
    if (saveAssistantErr) {
      console.error("❌ DB insert (assistant msg) failed", saveAssistantErr)
      return jsonRes(
        { error: "Database error when saving assistant reply" },
        502
      )
    }

    /* ---------- 5. update counters ---------- */
    await Promise.all([
      incrementUsage(supabase, userId),
      incrementSpecialAgentUsage(supabase, userId),
    ])

    console.info(
      `✅ /api/research done in ${Date.now() - start} ms (chat ${chatId})`
    )
    return jsonRes(result, 200)
  } catch (err) {
    // fallback: truly unexpected error
    console.error("🛑 /api/research fatal error", err)
    return jsonRes(
      {
        error: "Internal server error",
        detail: err instanceof Error ? err.message : String(err),
      },
      500
    )
  }
}
