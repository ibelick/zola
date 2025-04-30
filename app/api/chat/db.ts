import type { Database } from "@/app/types/database.types"
import type { SupabaseClient } from "@supabase/supabase-js"

type ContentPart = {
  type: string
  text?: string
  toolCallId?: string
  toolName?: string
  args?: any
  result?: any
  toolInvocation?: {
    state: string
    step: number
    toolCallId: string
    toolName: string
    args?: any
    result?: any
  }
}

type Message = {
  role: "user" | "assistant" | "system" | "data" | "tool" | "tool-call"
  content: string | null | ContentPart[]
}

const DEFAULT_STEP = 0

export async function saveFinalAssistantMessage(
  supabase: SupabaseClient<Database>,
  chatId: string,
  messages: Message[]
) {
  const parts: ContentPart[] = []
  const toolInvocations: any[] = []
  let textParts: string[] = []

  for (const msg of messages) {
    if (msg.role === "assistant") {
      if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === "text") {
            textParts.push(part.text || "")
            parts.push(part)
          } else if (part.type === "tool-call") {
            parts.push({
              type: "tool-invocation",
              toolInvocation: {
                state: "requested",
                step: DEFAULT_STEP,
                toolCallId: part.toolCallId || "",
                toolName: part.toolName || "",
                args: part.args,
              },
            })
          }
        }
      }
    } else if (msg.role === "tool") {
      if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === "tool-result") {
            parts.push({
              type: "tool-invocation",
              toolInvocation: {
                state: "result",
                step: DEFAULT_STEP,
                toolCallId: part.toolCallId || "",
                toolName: part.toolName || "",
                result: part.result,
              },
            })
            toolInvocations.push({
              state: "result",
              step: DEFAULT_STEP,
              toolCallId: part.toolCallId || "",
              toolName: part.toolName || "",
              result: part.result,
            })
          }
        }
      }
    }
  }

  const finalPlainText = textParts.join("\n\n")

  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    role: "assistant",
    content: finalPlainText || "",
    parts: parts,
    tool_invocations: toolInvocations,
  })

  if (error) {
    console.error("Error saving final assistant message:", error)
    throw new Error(`Failed to save assistant message: ${error.message}`)
  } else {
    console.log("Assistant message saved successfully (merged).")
  }
}
