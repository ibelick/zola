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

async function runResearchAgent(prompt: string) {
  /* ---------- 1. create a clean report title ---------- */
  const { object: titleObj } = await generateObject({
    model: openai("gpt-4.1-nano", { structuredOutputs: true }),
    schema: z.object({ title: z.string() }),
    prompt: `Write a short report title (max 12 words) for:
  "${prompt}". Only capitalize the first word; no trailing punctuation; avoid the word “report”.`,
  })
  const reportTitle = titleObj.title

  /* ---------- 2. pick 2–3 distinct sub‑topics ---------- */
  const { object: subtopics } = await generateObject({
    model: openai("gpt-4.1-nano", { structuredOutputs: true }),
    schema: z.object({ topics: z.array(z.string()) }),
    prompt: `Suggest 2–3 clear subtopics that explore different, useful angles of the main topic.

Each subtopic should:
- be practical or specific (not too broad or abstract)
- be distinct from the others (no overlap)
- sound like a good section title in a short report

"${prompt}"`,
  })

  /* ---------- 3. fetch and deduplicate sources ---------- */
  const searchResults = await Promise.all(
    subtopics.topics.map(async (topic) => {
      const { results } = await exa.searchAndContents(topic, {
        livecrawl: "always",
        numResults: 2,
      })
      const seen = new Set<string>()
      const unique = results
        .filter((r) => r.url && !seen.has(r.url) && seen.add(r.url))
        .slice(0, 2)

      return {
        topic,
        sources: unique.map((r) => ({
          title: r.title ?? "Untitled",
          url: r.url!,
          snippet: (r.text ?? "").slice(0, 280),
        })),
      }
    })
  )

  /* ---------- 4. produce tight bullet‑style summaries ---------- */
  const summaries = await Promise.all(
    searchResults.map(async ({ topic, sources }) => {
      const bulletedSources = sources
        .map((s, i) => `${i + 1}. "${s.title}": ${s.snippet}`)
        .join("\n")

      const { object } = await generateObject({
        model: openai("gpt-4.1-mini"),
        schema: z.object({ summary: z.string() }),
        prompt: `Summarize the key insights about "${topic}" as **exactly 2‑6 bullets**.
  • Each bullet **must start with "-" "** (hyphen + space) – no other bullet symbols.
  • One concise sentence per bullet; no intro, no conclusion, no extra paragraphs.
  • Base the bullets only on the information below, do not include links.
  • Focus on specific ideas, patterns, or tactics, not general claims.
  • Do not sound AI-generated, sound like a human writing a report.
  
  ${bulletedSources}`,
      })

      return {
        topic,
        summary: object.summary.trim(),
        citations: sources,
      }
    })
  )

  /* ---------- 5. assemble markdown & citation parts ---------- */
  return {
    markdown:
      `# ${reportTitle}\n\n` +
      summaries
        .map(({ topic, summary }) => `## ${topic}\n\n${summary}`)
        .join("\n\n"),
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
