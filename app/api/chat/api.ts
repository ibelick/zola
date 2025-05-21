import { saveFinalAssistantMessage } from "@/app/api/chat/db"
import { checkSpecialAgentUsage, incrementSpecialAgentUsage } from "@/lib/api"
import { sanitizeUserInput } from "@/lib/sanitize"
import { validateUserIdentity } from "@/lib/server/api"
import { checkUsageByModel, incrementUsageByModel } from "@/lib/usage"
import type { Attachment } from "@ai-sdk/ui-utils"

export async function validateAndTrackUsage({
  userId,
  model,
  isAuthenticated,
}: {
  userId: string
  model: string
  isAuthenticated: boolean
}) {
  const supabase = await validateUserIdentity(userId, isAuthenticated)
  if (!supabase) return null

  await checkUsageByModel(supabase, userId, model, isAuthenticated)
  return supabase
}

export async function logUserMessage({
  supabase,
  userId,
  chatId,
  content,
  attachments,
  model,
  isAuthenticated,
}: {
  supabase: any
  userId: string
  chatId: string
  content: string
  attachments?: Attachment[]
  model: string
  isAuthenticated: boolean
}) {
  if (!supabase) return

  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    role: "user",
    content: sanitizeUserInput(content),
    experimental_attachments: attachments as any,
    user_id: userId,
  })

  if (error) {
    console.error("Error saving user message:", error)
  } else {
    await incrementUsageByModel(supabase, userId, model, isAuthenticated)
  }
}

export async function trackSpecialAgentUsage(supabase: any, userId: string) {
  if (!supabase) return
  await checkSpecialAgentUsage(supabase, userId)
  await incrementSpecialAgentUsage(supabase, userId)
}

export async function storeAssistantMessage({
  supabase,
  chatId,
  messages,
}: {
  supabase: any
  chatId: string
  messages: any
}) {
  if (!supabase) return
  try {
    await saveFinalAssistantMessage(supabase, chatId, messages)
  } catch (err) {
    console.error("Failed to save assistant messages:", err)
  }
}
