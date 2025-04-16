import { checkUsage, incrementUsage } from "@/lib/api"
import { sanitizeUserInput } from "@/lib/sanitize"
import { validateUserIdentity } from "@/lib/server/api"
import { openai } from "@ai-sdk/openai"
import { SourceUIPart } from "@ai-sdk/ui-utils"
import { generateObject } from "ai"
import Exa from "exa-js"
import { z } from "zod"

const exa = new Exa(process.env.EXA_API_KEY!)

async function runResearchAgent(prompt: string) {
  const { object: subtopics } = await generateObject({
    model: openai("gpt-4.1-nano", { structuredOutputs: true }),
    output: "object",
    schema: z.object({ topics: z.array(z.string()) }),
    system:
      "You are a research planner. You generate a diverse set of subtopics from a user research prompt. Avoid repetition.",
    schemaName: "ResearchSubtopics",
    schemaDescription:
      "A list of 2–3 diverse subtopics related to the given query",
    prompt: `Generate exactly 2–3 distinct and interesting subtopics related to:\n"${prompt}"`,
  })

  const searchResults = await Promise.all(
    subtopics.topics.map(async (topic) => {
      const { results } = await exa.searchAndContents(topic, {
        livecrawl: "always",
        numResults: 3,
      })

      const parsed = results.slice(0, 2).map((r) => ({
        title: r.title || "",
        url: r.url || "",
        snippet: r.text?.slice(0, 300) || "",
      }))

      return { topic, sources: parsed }
    })
  )

  console.log("searchResults", searchResults)

  const summaries = await Promise.all(
    searchResults.map(async ({ topic, sources }) => {
      const { object } = await generateObject({
        model: openai("gpt-4.1-mini"),
        schema: z.object({
          summary: z.string().min(100),
        }),
        prompt: `Write a clear summary based on these search results for "${topic}":\n\n${sources
          .map((s, i) => `${i + 1}. ${s.title} — ${s.snippet}`)
          .join("\n")}`,
      })

      return {
        topic,
        summary: object.summary,
        citations: sources.map((s) => ({
          title: s.title,
          url: s.url,
        })),
      }
    })
  )

  const markdown = [
    `# Research Report: ${prompt}`,
    "",
    ...summaries.map(({ topic, summary }) => `## ${topic}\n\n${summary}\n`),
  ].join("\n")

  const parts: SourceUIPart[] = summaries.flatMap(({ citations }) =>
    citations.map((source, index) => ({
      type: "source",
      source: {
        sourceType: "url",
        id: `${index}-${Math.random().toString(16).slice(2, 8)}`,
        url: source.url,
        title: source.title || "",
      },
    }))
  )

  return {
    markdown,
    parts,
  }
}

export async function POST(req: Request) {
  try {
    const { prompt, chatId, userId, isAuthenticated } = await req.json()

    if (!prompt || !chatId || !userId) {
      return new Response(JSON.stringify({ error: "Missing data" }), {
        status: 400,
      })
    }

    const supabase = await validateUserIdentity(userId, isAuthenticated)

    await checkUsage(supabase, userId)

    const sanitizedPrompt = sanitizeUserInput(prompt)

    // Save user message
    await supabase.from("messages").insert({
      chat_id: chatId,
      role: "user",
      content: sanitizedPrompt,
      user_id: userId,
    })

    const result = await runResearchAgent(sanitizedPrompt)

    // Save assistant response
    await supabase.from("messages").insert({
      chat_id: chatId,
      role: "assistant",
      content: result.markdown,
      user_id: userId,
      parts: result.parts,
    })

    await incrementUsage(supabase, userId)

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err: any) {
    console.error("/api/research error", err)
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
    })
  }
}
