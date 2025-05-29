import { validateUserIdentity } from "@/lib/server/api"
import { checkUsageByModel } from "@/lib/usage"

type CreateChatInput = {
  userId: string
  title?: string
  model: string
  isAuthenticated: boolean
  agentId?: string
}

export async function createChatInDb({
  userId,
  title,
  model,
  isAuthenticated,
  agentId,
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
      agent_id: agentId || null,
    }
  }

  await checkUsageByModel(supabase, userId, model, isAuthenticated)

  const insertData: any = {
    user_id: userId,
    title: title || "New Chat",
    model,
  }

  if (agentId) {
    insertData.agent_id = agentId
  }

  const { data, error } = await supabase
    .from("chats")
    .insert(insertData)
    .select("*")
    .single()

  if (error || !data) {
    console.error("Error creating chat:", error)
    return null
  }

  return data
}
