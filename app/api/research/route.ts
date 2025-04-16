import { checkUsage, incrementUsage } from "@/lib/api"
import { sanitizeUserInput } from "@/lib/sanitize"
import { validateUserIdentity } from "@/lib/server/api"
import { openai } from "@ai-sdk/openai"
import { SourceUIPart } from "@ai-sdk/ui-utils"
import { generateObject } from "ai"
import { z } from "zod"

async function runResearchAgent(prompt: string) {
  const model = openai("gpt-4.1-nano")

  const { object: subtopics } = await generateObject({
    model,
    schema: z.object({
      topics: z.array(z.string().min(3)).min(1).max(5),
    }),
    prompt: `Break this research request into 3–5 subtopics:\n"${prompt}"`,
  })

  const fakeSearchResults = await Promise.all(
    subtopics.topics.map(async (topic) => {
      const { object } = await generateObject({
        model,
        schema: z.object({
          results: z
            .array(
              z.object({
                title: z.string(),
                url: z.string().url(),
                snippet: z.string(),
              })
            )
            .min(2)
            .max(4),
        }),
        prompt: `Give 3 fake but realistic search results for this subtopic:\n"${topic}". Include title, URL, and snippet.`,
      })
      return { topic, sources: object.results }
    })
  )

  const summaries = await Promise.all(
    fakeSearchResults.map(async ({ topic, sources }) => {
      const { object } = await generateObject({
        model,
        schema: z.object({
          summary: z.string().min(100),
        }),
        prompt: `Write a clear summary based on these fake search results for "${topic}":\n\n${sources
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
        title: source.title,
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

    console.log("Research agent request:", {
      prompt,
      chatId,
      userId,
      isAuthenticated,
    })

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
