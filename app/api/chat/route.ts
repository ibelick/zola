import { getMessagesFromDb } from "@/lib/chat-store/messages/api"
import { SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { getAllModels } from "@/lib/models"
import { getProviderForModel } from "@/lib/openproviders/provider-map"
import { createClient } from "@/lib/supabase/server"
import type { ProviderWithoutOllama } from "@/lib/user-keys"
import { generateUUID } from "@/lib/utils"
import { Attachment } from "@ai-sdk/ui-utils"
import {
  createDataStream,
  Message as MessageAISDK,
  streamText,
  ToolSet,
} from "ai"
import { after, NextResponse } from "next/server"
import { createResumableStreamContext } from "resumable-stream"
import {
  incrementMessageCount,
  logUserMessage,
  storeAssistantMessage,
  validateAndTrackUsage,
} from "./api"
import { createStreamId } from "./db"
import { createErrorResponse, extractErrorMessage } from "./utils"

export const maxDuration = 60

const streamContext = createResumableStreamContext({
  waitUntil: after,
})

type ChatRequest = {
  messages: MessageAISDK[]
  chatId: string
  userId: string
  model: string
  isAuthenticated: boolean
  systemPrompt: string
  enableSearch: boolean
  message_group_id?: string
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
      enableSearch,
      message_group_id,
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

    // Increment message count for successful validation
    if (supabase) {
      await incrementMessageCount({ supabase, userId })
    }

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
        message_group_id,
      })
    }

    const allModels = await getAllModels()
    const modelConfig = allModels.find((m) => m.id === model)

    if (!modelConfig || !modelConfig.apiSdk) {
      throw new Error(`Model ${model} not found`)
    }

    const effectiveSystemPrompt = systemPrompt || SYSTEM_PROMPT_DEFAULT

    let apiKey: string | undefined
    if (isAuthenticated && userId) {
      const { getEffectiveApiKey } = await import("@/lib/user-keys")
      const provider = getProviderForModel(model)
      apiKey =
        (await getEffectiveApiKey(userId, provider as ProviderWithoutOllama)) ||
        undefined
    }

    const streamId = generateUUID()
    await createStreamId(supabase!, { streamId, chatId })

    const stream = createDataStream({
      execute: (dataStream) => {
        const result = streamText({
          model: modelConfig.apiSdk!(apiKey, { enableSearch }),
          system: effectiveSystemPrompt,
          messages: messages,
          tools: {} as ToolSet,
          maxSteps: 10,
          onError: (err: unknown) => {
            console.error("Streaming error occurred:", err)
            // Don't set streamError anymore - let the AI SDK handle it through the stream
          },

          onFinish: async ({ response }) => {
            if (supabase) {
              await storeAssistantMessage({
                supabase,
                chatId,
                messages:
                  response.messages as unknown as import("@/app/types/api.types").Message[],
                message_group_id,
                model,
              })
            }
          },
        })
        result.consumeStream()

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
          sendSources: true,
        })
      },
      onError: (err: unknown) => {
        console.error("Error forwarded to client:", err)
        return extractErrorMessage(err)
      },
    })

    return new Response(
      await streamContext.resumableStream(streamId, () => stream)
    )
  } catch (err: unknown) {
    console.error("Error in /api/chat:", err)
    const error = err as {
      code?: string
      message?: string
      statusCode?: number
    }

    return createErrorResponse(error)
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const chatId = searchParams.get("chatId")

    if (!chatId) {
      return new Response("id is required", { status: 400 })
    }
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      )
    }

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the chat by id
    const chat = await supabase
      .from("chats")
      .select("*")
      .eq("id", chatId)
      .single()

    if (!chat.data) {
      return new Response("Not found", { status: 404 })
    }

    if (chat.data.user_id !== user.id) {
      return new Response("Forbidden", { status: 403 })
    }

    // Get the stream ids by chat id
    const streamIds = await supabase
      .from("stream_ids")
      .select("*")
      .eq("chat_id", chatId)

    if (!streamIds.data) {
      return new Response("No streams found", { status: 404 })
    }

    const recentStreamId = streamIds.data.at(-1)?.stream_id

    if (!recentStreamId) {
      return new Response("No recent stream found", { status: 404 })
    }

    const emptyDataStream = createDataStream({
      execute: () => {},
    })

    const stream = await streamContext.resumableStream(
      recentStreamId,
      () => emptyDataStream
    )

    if (stream) {
      return new Response(stream, { status: 200 })
    }

    /*
     * For when the generation is "active" during SSR but the
     * resumable stream has concluded after reaching this point.
     */

    const messages = await getMessagesFromDb(chatId)
    const mostRecentMessage = messages.at(-1)

    if (!mostRecentMessage || mostRecentMessage.role !== "assistant") {
      return new Response(emptyDataStream, { status: 200 })
    }

    const streamWithMessage = createDataStream({
      execute: (buffer) => {
        buffer.writeData({
          type: "append-message",
          message: JSON.stringify(mostRecentMessage),
        })
      },
    })

    return new Response(streamWithMessage, { status: 200 })
  } catch (error) {
    console.error("Error in chat GET API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
