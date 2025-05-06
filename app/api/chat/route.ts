import { loadAgent } from "@/lib/agents/load-agent"
import { checkSpecialAgentUsage, incrementSpecialAgentUsage } from "@/lib/api"
import { MODELS_OPTIONS, SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { loadMCPToolsFromURL } from "@/lib/mcp/load-mcp-from-url"
import { sanitizeUserInput } from "@/lib/sanitize"
import { validateUserIdentity } from "@/lib/server/api"
import { checkUsageByModel, incrementUsageByModel } from "@/lib/usage"
import { Attachment } from "@ai-sdk/ui-utils"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { LanguageModelV1, Message as MessageAISDK, streamText } from "ai"
import { saveFinalAssistantMessage } from "./db"

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

    const supabase = await validateUserIdentity(userId, isAuthenticated)

    await checkUsageByModel(supabase, userId, model, isAuthenticated)

    const userMessage = messages[messages.length - 1]
    if (userMessage && userMessage.role === "user") {
      const { error: msgError } = await supabase.from("messages").insert({
        chat_id: chatId,
        role: "user",
        content: sanitizeUserInput(userMessage.content),
        experimental_attachments:
          userMessage.experimental_attachments as unknown as Attachment[],
        user_id: userId,
      })
      if (msgError) {
        console.error("Error saving user message:", msgError)
      } else {
        console.log("User message saved successfully.")
        await incrementUsageByModel(supabase, userId, model, isAuthenticated)
      }
    }

    let agentConfig = null

    if (agentId) {
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
      await checkSpecialAgentUsage(supabase, userId)
      await incrementSpecialAgentUsage(supabase, userId)
    }

    const result = streamText({
      model: modelInstance as LanguageModelV1,
      system: effectiveSystemPrompt,
      messages,
      tools: toolsToUse,
      maxSteps: effectiveMaxSteps,
      onError: (err) => {
        console.error("🛑 streamText error:", err)
      },
      async onFinish({ response }) {
        try {
          await saveFinalAssistantMessage(supabase, chatId, response.messages)
        } catch (err) {
          console.error(
            "Error in onFinish while saving assistant messages:",
            err
          )
        }
      },
    })

    // Ensure the stream is consumed so onFinish is triggered.
    result.consumeStream()
    const originalResponse = result.toDataStreamResponse({
      sendReasoning: true,
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
