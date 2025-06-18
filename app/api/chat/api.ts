import { saveFinalAssistantMessage } from "@/app/api/chat/db"
import type { UIMessageFull } from "@/app/components/chat/chat"
import type {
  ChatApiParams,
  LogUserMessageParams,
  StoreAssistantMessageParams,
  SupabaseClientType,
} from "@/app/types/api.types"
import { checkSpecialAgentUsage, incrementSpecialAgentUsage } from "@/lib/api"
import { sanitizeUserInput } from "@/lib/sanitize"
import { validateUserIdentity } from "@/lib/server/api"
import type { SupabaseClient } from "@/lib/supabase/server"
import { checkUsageByModel, incrementUsageByModel } from "@/lib/usage"

export async function validateAndTrackUsage({
  userId,
  model,
  isAuthenticated,
}: ChatApiParams): Promise<SupabaseClientType | null> {
  const supabase = await validateUserIdentity(userId, isAuthenticated)
  if (!supabase) return null

  await checkUsageByModel(supabase, userId, model, isAuthenticated)
  return supabase
}

function sanitizeUserMessagePart(part: UIMessageFull["parts"][number]) {
  if (part.type === "text") {
    return {
      ...part,
      text: sanitizeUserInput(part.text),
    }
  }
  return part
}

export async function logUserMessage({
  supabase,
  userId,
  chatId,
  model,
  isAuthenticated,
  parts,
}: LogUserMessageParams): Promise<void> {
  if (!supabase) return

  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    role: "user",
    user_id: userId,
    parts: parts.map(sanitizeUserMessagePart),
  })

  if (error) {
    console.error("Error saving user message:", error)
  } else {
    await incrementUsageByModel(supabase, userId, model, isAuthenticated)
  }
}

export async function trackSpecialAgentUsage(
  supabase: SupabaseClientType,
  userId: string
): Promise<void> {
  if (!supabase) return
  await checkSpecialAgentUsage(supabase, userId)
  await incrementSpecialAgentUsage(supabase, userId)
}

export async function storeAssistantMessage({
  supabase,
  chatId,
  parts,
}: StoreAssistantMessageParams): Promise<void> {
  if (!supabase) return
  try {
    await saveFinalAssistantMessage(supabase, chatId, parts)
  } catch (err) {
    console.error("Failed to save assistant messages:", err)
  }
}
