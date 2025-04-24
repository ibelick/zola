import { checkSpecialAgentUsage, incrementSpecialAgentUsage } from "@/lib/api"
import { sanitizeUserInput } from "@/lib/sanitize"
import { validateUserIdentity } from "@/lib/server/api"
import { checkUsage, incrementUsage } from "@/lib/usage"
import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Check if the request is valid and the user has not exceeded usage limits
 */
export async function validateRequest(
  userId: string,
  isAuthenticated: boolean,
  prompt: string,
  chatId: string
) {
  if (!prompt || !chatId || !userId) {
    throw new Error("Missing required data")
  }

  const supabase = await validateUserIdentity(userId, isAuthenticated)
  await checkUsage(supabase, userId)
  await checkSpecialAgentUsage(supabase, userId)

  return {
    supabase,
    sanitizedPrompt: sanitizeUserInput(prompt),
  }
}

/**
 * Persist user message to database
 */
export async function saveUserMessage(
  supabase: SupabaseClient,
  chatId: string,
  userId: string,
  content: string
) {
  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    role: "user",
    content,
    user_id: userId,
  })

  if (error) {
    throw new Error("Failed to save user message: " + error.message)
  }
}

/**
 * Persist assistant message to database
 */
export async function saveAssistantMessage(
  supabase: SupabaseClient,
  chatId: string,
  userId: string,
  content: string,
  parts: any[] = []
) {
  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    role: "assistant",
    content,
    user_id: userId,
    parts,
  })

  if (error) {
    throw new Error("Failed to save assistant message: " + error.message)
  }
}

/**
 * Increment usage counters after successful agent run
 */
export async function incrementUsageCounters(
  supabase: SupabaseClient,
  userId: string
) {
  await Promise.all([
    incrementUsage(supabase, userId),
    incrementSpecialAgentUsage(supabase, userId),
  ])
}
