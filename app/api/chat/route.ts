import { loadAgent } from "@/lib/agents/load-agent"
import { MODELS_OPTIONS, SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { loadMCPToolsFromURL } from "@/lib/mcp/load-mcp-from-url"
import { Attachment } from "@ai-sdk/ui-utils"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import {
  LanguageModelV1,
  Message as MessageAISDK,
  streamText,
  ToolSet,
} from "ai"
import {
  logUserMessage,
  storeAssistantMessage,
  trackSpecialAgentUsage,
  validateAndTrackUsage,
} from "./api"

export const maxDuration = 60

type ChatRequest = {
  messages: MessageAISDK[]
  chatId: string
  userId: string
  model: string
  isAuthenticated: boolean
  systemPrompt: string
  agentId?: string
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      chatId,
      userId,
      model,
      isAuthenticated,
      systemPrompt,
      agentId,
    } = (await req.json()) as ChatRequest

    if (!messages || !chatId || !userId) {
      return new Response(
        JSON.stringify({ error: "Error, missing information" }),
        { status: 400 }
      )
    }

    const supabase = await validateAndTrackUsage({
      userId,
      model,
      isAuthenticated,
    })

    const userMessage = messages[messages.length - 1]

    if (supabase && userMessage?.role === "user") {
      await logUserMessage({
        supabase,
        userId,
        chatId,
        content: userMessage.content,
        attachments: userMessage.experimental_attachments as Attachment[],
        model,
        isAuthenticated,
      })
    }

    let agentConfig = null

    if (supabase && agentId) {
      agentConfig = await loadAgent(agentId)
    }

    const modelConfig = MODELS_OPTIONS.find((m) => m.id === model)

    if (!modelConfig) {
      throw new Error(`Model ${model} not found`)
    }
    let modelInstance
    if (modelConfig.provider === "openrouter") {
      const openRouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
      })
      modelInstance = openRouter.chat(modelConfig.api_sdk as string) // this is a special case for openrouter. Normal openrouter models are not supported.
    } else {
      modelInstance = modelConfig.api_sdk
    }

    let effectiveSystemPrompt =
      agentConfig?.systemPrompt || systemPrompt || SYSTEM_PROMPT_DEFAULT

    let toolsToUse = undefined
    let effectiveMaxSteps = agentConfig?.maxSteps || 3

    if (agentConfig?.mcpConfig) {
      const { tools } = await loadMCPToolsFromURL(agentConfig.mcpConfig.server)
      toolsToUse = tools
    } else if (agentConfig?.tools) {
      toolsToUse = agentConfig.tools
      await trackSpecialAgentUsage(supabase, userId)
    }

    let streamError: Error | null = null

    const result = streamText({
      model: modelInstance as LanguageModelV1,
      system: effectiveSystemPrompt,
      messages,
      tools: toolsToUse as ToolSet,
      // @todo: remove this
      // hardcoded for now
      maxSteps: 10,
      onError: (err: any) => {
        console.error("🛑 streamText error:", err)
        streamError = new Error(
          err?.error ||
            "AI generation failed. Please check your model or API key."
        )
      },

      onFinish: async ({ response }) => {
        await storeAssistantMessage({
          supabase,
          chatId,
          messages: response.messages,
        })
      },
    })

    await result.consumeStream()

    if (streamError) {
      throw streamError
    }

    const originalResponse = result.toDataStreamResponse({
      sendReasoning: true,
      sendSources: true,
    })
    // Optionally attach chatId in a custom header.
    const headers = new Headers(originalResponse.headers)
    headers.set("X-Chat-Id", chatId)

    return new Response(originalResponse.body, {
      status: originalResponse.status,
      headers,
    })
  } catch (err: any) {
    console.error("Error in /api/chat:", err)
    // Return a structured error response if the error is a UsageLimitError.
    if (err.code === "DAILY_LIMIT_REACHED") {
      return new Response(
        JSON.stringify({ error: err.message, code: err.code }),
        { status: 403 }
      )
    }

    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500 }
    )
  }
}
