// app/api/live-search/route.ts

import { logUserMessage, storeAssistantMessage, validateAndTrackUsage } from "@/app/api/chat/api"
import { XAICitation } from "@/app/types/citation"
import { validateUserIdentity } from "@/lib/server/api"

export async function POST(request: Request) {
  try {
    const { userId, isAuthenticated, messages, chatId, searchOptions } =
      await request.json()

    if (!userId || !messages || !chatId) {
      return new Response(
        JSON.stringify({ error: "Missing userId, messages, or chatId" }),
        {
          status: 400,
        }
      )
    }

    const supabase = await validateAndTrackUsage({
      userId,
      model: "grok-3-latest", // Default model for live search
      isAuthenticated,
    })

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      })
    }

    const userMessage = messages[messages.length - 1]
    if (userMessage?.role === "user") {
      await logUserMessage({
        supabase,
        userId,
        chatId,
        content: userMessage.content,
        model: "grok-3-latest",
        isAuthenticated,
      })
    }

    if (!process.env.XAI_API_KEY) {
      console.error("Missing XAI_API_KEY environment variable")
      return new Response(
        JSON.stringify({ error: "Live Search configuration error" }),
        { status: 500 }
      )
    }

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-3-latest",
        messages,
        search_parameters: {
          mode: "on",
          return_citations: true,
          ...(searchOptions || {}),
        },
      }),
    })

    const data = await response.json()
    
    if (data.choices && data.choices.length > 0) {
      await storeAssistantMessage({
        supabase,
        chatId,
        messages: [{
          role: "assistant",
          content: [
            {
              type: "text",
              text: data.choices[0].message.content
            },
            ...(data.choices[0].message.citations ? 
              data.choices[0].message.citations.map((citation: XAICitation) => ({
                type: "source",
                source: citation
              })) : [])
          ]
        }]
      })
    }

    return new Response(JSON.stringify(data), { status: response.status })
  } catch (error) {
    console.error("Live Search error:", error)
    return new Response(JSON.stringify({ error: "Live Search failed" }), {
      status: 500,
    })
  }
}
