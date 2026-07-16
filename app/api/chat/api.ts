import { saveFinalAssistantMessage } from "@/app/api/chat/db"
import type {
  ChatApiParams,
  LogUserMessageParams,
  StoreAssistantMessageParams,
  SupabaseClientType,
} from "@/app/types/api.types"
import { sanitizeUserInput } from "@/lib/sanitize"
import { validateUserIdentity } from "@/lib/server/api"
import { checkUsageByModel, incrementUsage } from "@/lib/usage"

export async function validateAndTrackUsage({
  userId,
  model,
  isAuthenticated,
}: ChatApiParams): Promise<SupabaseClientType | null> {
  const supabase = await validateUserIdentity(userId, isAuthenticated)
  if (!supabase) return null

  if (supabase) {
    await checkUsageByModel(supabase, userId, model, isAuthenticated)
  }

  return supabase
}

export async function incrementMessageCount({
  supabase,
  userId,
}: {
  supabase: SupabaseClientType
  userId: string
}): Promise<void> {
  if (!supabase) return

  try {
    await incrementUsage(supabase, userId)
  } catch (err) {
    console.error("Failed to increment message count:", err)
    // Don't throw error as this shouldn't block the chat
  }
}

export async function logUserMessage({
  supabase,
  userId,
  chatId,
  content,
  attachments,
  model,
  isAuthenticated,
  message_group_id,
}: LogUserMessageParams): Promise<void> {
  if (!supabase) return

  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    role: "user",
    content: sanitizeUserInput(content),
    experimental_attachments: attachments,
    user_id: userId,
    message_group_id,
  })

  if (error) {
    console.error("Error saving user message:", error)
  }
}

export async function storeAssistantMessage({
  supabase,
  chatId,
  messages,
  message_group_id,
  model,
}: StoreAssistantMessageParams): Promise<void> {
  if (!supabase) return
  try {
    await saveFinalAssistantMessage(
      supabase,
      chatId,
      messages,
      message_group_id,
      model
    )
  } catch (err) {
    console.error("Failed to save assistant messages:", err)
  }
}
