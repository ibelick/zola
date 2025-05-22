import { saveFinalAssistantMessage } from "@/app/api/chat/db"
import type { UIMessageWithMetadata } from "@/app/components/chat/chat"
import { checkSpecialAgentUsage, incrementSpecialAgentUsage } from "@/lib/api"
import { sanitizeUserInput } from "@/lib/sanitize"
import { validateUserIdentity } from "@/lib/server/api"
import type { SupabaseClient } from "@/lib/supabase/server"
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
  model,
  isAuthenticated,
  parts,
}: {
  supabase: SupabaseClient
  userId: string
  chatId: string
  model: string
  isAuthenticated: boolean
  parts: UIMessageWithMetadata["parts"]
}) {
  if (!supabase) return

  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    role: "user",
    // content: sanitizeUserInput(content),
    // experimental_attachments: attachments as any,
    user_id: userId,
    parts,
  })

  if (error) {
    console.error("Error saving user message:", error)
  } else {
    await incrementUsageByModel(supabase, userId, model, isAuthenticated)
  }
}

export async function trackSpecialAgentUsage(
  supabase: SupabaseClient,
  userId: string
) {
  if (!supabase) return
  await checkSpecialAgentUsage(supabase, userId)
  await incrementSpecialAgentUsage(supabase, userId)
}

export async function storeAssistantMessage({
  supabase,
  chatId,
  parts,
}: {
  supabase: SupabaseClient
  chatId: string
  parts: UIMessageWithMetadata["parts"]
}) {
  if (!supabase) return
  try {
    await saveFinalAssistantMessage(supabase, chatId, parts)
  } catch (err) {
    console.error("Failed to save assistant messages:", err)
  }
}
