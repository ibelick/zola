import { MODELS_OPTIONS, SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { sanitizeUserInput } from "@/lib/sanitize"
import { validateUserIdentity } from "@/lib/server/api"
import { checkUsageByModel, incrementUsageByModel } from "@/lib/usage"
import { Attachment } from "@ai-sdk/ui-utils"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { LanguageModelV1, Message as MessageAISDK, streamText } from "ai"

// Maximum allowed duration for streaming (in seconds)
export const maxDuration = 30

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

    let effectiveSystemPrompt = systemPrompt || SYSTEM_PROMPT_DEFAULT

    if (agentId) {
      const { data: agent, error } = await supabase
        .from("agents")
        .select("system_prompt")
        .eq("id", agentId)
        .single()

      if (error || !agent) {
        console.warn("Failed to fetch agent prompt, using fallback.")
      } else {
        effectiveSystemPrompt = agent.system_prompt || effectiveSystemPrompt
      }
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

    const result = streamText({
      model: modelInstance as LanguageModelV1,
      system: effectiveSystemPrompt,
      messages,
      onError: (err) => {
        console.error("🛑 streamText error:", err)
      },
      // When the response finishes, insert the assistant messages to supabase
      async onFinish({ response }) {
        try {
          for (const msg of response.messages) {
            console.log("Response message role:", msg.role)
            if (msg.content) {
              let plainText = msg.content
              try {
                const parsed = msg.content
                if (Array.isArray(parsed)) {
                  // Join all parts of type "text"
                  plainText = parsed
                    .filter((part) => part.type === "text")
                    .map((part) => part.text)
                    .join(" ")
                }
              } catch (err) {
                console.warn(
                  "Could not parse message content as JSON, using raw content"
                )
              }

              const { error: assistantError } = await supabase
                .from("messages")
                .insert({
                  chat_id: chatId,
                  role: "assistant",
                  content: plainText.toString(),
                })
              if (assistantError) {
                console.error("Error saving assistant message:", assistantError)
              } else {
                console.log("Assistant message saved successfully.")
              }
            }
          }
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
    const originalResponse = result.toDataStreamResponse()
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
