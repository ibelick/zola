import type { Database } from "@/app/types/database.types"
import { validateUserIdentity } from "@/lib/server/api"
import { checkUsageByModel } from "@/lib/usage"

type CreateChatInput = {
  userId: string
  title?: string
  model: string
  isAuthenticated: boolean
}
export async function createChatInDb({
  userId,
  title,
  model,
  isAuthenticated,
}: CreateChatInput) {
  const supabase = await validateUserIdentity(userId, isAuthenticated)
  if (!supabase) {
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      title,
      model,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      agent_id: null,
    }
  }

  await checkUsageByModel(supabase, userId, model, isAuthenticated)

  const { data, error } = await supabase
    .from("chats")
    .insert({
      user_id: userId,
      title: title || "New Chat",
      model,
    })
    .select("*")
    .single()

  if (error || !data) {
    console.error("Error creating chat:", error)
    return null
  }

  return data
}
