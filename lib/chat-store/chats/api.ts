import { filterLocalAgentId } from "@/lib/agents/utils"
import { readFromIndexedDB, writeToIndexedDB } from "@/lib/chat-store/persist"
import type { Chat, Chats } from "@/lib/chat-store/types"
import { createClient } from "@/lib/supabase/client"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { MODEL_DEFAULT } from "../../config"
import { fetchClient } from "../../fetch"
import {
  API_ROUTE_CREATE_CHAT,
  API_ROUTE_UPDATE_CHAT_AGENT,
  API_ROUTE_UPDATE_CHAT_MODEL,
} from "../../routes"

export async function getChatsForUserInDb(userId: string): Promise<Chats[]> {
  const supabase = createClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })

  if (!data || error) {
    console.error("Failed to fetch chats:", error)
    return []
  }

  return data
}

export async function updateChatTitleInDb(id: string, title: string) {
  const supabase = createClient()
  if (!supabase) return

  const { error } = await supabase
    .from("chats")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw error
}

export async function deleteChatInDb(id: string) {
  const supabase = createClient()
  if (!supabase) return

  const { error } = await supabase.from("chats").delete().eq("id", id)
  if (error) throw error
}

export async function getAllUserChatsInDb(userId: string): Promise<Chats[]> {
  const supabase = createClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (!data || error) return []
  return data
}

export async function createChatInDb(
  userId: string,
  title: string,
  model: string,
  systemPrompt: string
): Promise<string | null> {
  const supabase = createClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from("chats")
    .insert({ user_id: userId, title, model, system_prompt: systemPrompt })
    .select("id")
    .single()

  if (error || !data?.id) return null
  return data.id
}

export async function fetchAndCacheChats(userId: string): Promise<Chats[]> {
  if (!isSupabaseEnabled) {
    return await getCachedChats()
  }

  const data = await getChatsForUserInDb(userId)

  if (data.length > 0) {
    await writeToIndexedDB("chats", data)
  }

  return data
}

export async function getCachedChats(): Promise<Chats[]> {
  const all = await readFromIndexedDB<Chats>("chats")
  return (all as Chats[]).sort(
    (a, b) => +new Date(b.created_at || "") - +new Date(a.created_at || "")
  )
}

export async function updateChatTitle(
  id: string,
  title: string
): Promise<void> {
  await updateChatTitleInDb(id, title)
  const all = await getCachedChats()
  const updated = (all as Chats[]).map((c) =>
    c.id === id ? { ...c, title } : c
  )
  await writeToIndexedDB("chats", updated)
}

export async function deleteChat(id: string): Promise<void> {
  await deleteChatInDb(id)
  const all = await getCachedChats()
  await writeToIndexedDB(
    "chats",
    (all as Chats[]).filter((c) => c.id !== id)
  )
}

export async function getChat(chatId: string): Promise<Chat | null> {
  const all = await readFromIndexedDB<Chat>("chats")
  return (all as Chat[]).find((c) => c.id === chatId) || null
}

export async function getUserChats(userId: string): Promise<Chat[]> {
  const data = await getAllUserChatsInDb(userId)
  if (!data) return []
  await writeToIndexedDB("chats", data)
  return data
}

export async function createChat(
  userId: string,
  title: string,
  model: string,
  systemPrompt: string
): Promise<string> {
  const id = await createChatInDb(userId, title, model, systemPrompt)
  const finalId = id ?? crypto.randomUUID()

  await writeToIndexedDB("chats", {
    id: finalId,
    title,
    model,
    user_id: userId,
    system_prompt: systemPrompt,
    created_at: new Date().toISOString(),
  })

  return finalId
}

export async function updateChatModel(chatId: string, model: string) {
  try {
    const res = await fetchClient(API_ROUTE_UPDATE_CHAT_MODEL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, model }),
    })
    const responseData = await res.json()

    if (!res.ok) {
      throw new Error(
        responseData.error ||
          `Failed to update chat model: ${res.status} ${res.statusText}`
      )
    }

    const all = await getCachedChats()
    const updated = (all as Chats[]).map((c) =>
      c.id === chatId ? { ...c, model } : c
    )
    await writeToIndexedDB("chats", updated)

    return responseData
  } catch (error) {
    console.error("Error updating chat model:", error)
    throw error
  }
}

export async function createNewChat(
  userId: string,
  title?: string,
  model?: string,
  isAuthenticated?: boolean,
  agentId?: string,
  projectId?: string
): Promise<Chats> {
  try {
    // Note: Local agent IDs are filtered out at the API level (create-chat route)
    const payload: {
      userId: string
      title: string
      model: string
      isAuthenticated?: boolean
      agentId?: string
      projectId?: string
    } = {
      userId,
      title: title || (agentId ? `Conversation with agent` : "New Chat"),
      model: model || MODEL_DEFAULT,
      isAuthenticated,
    }

    if (agentId) {
      payload.agentId = agentId
    }

    if (projectId) {
      payload.projectId = projectId
    }

    const res = await fetchClient(API_ROUTE_CREATE_CHAT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const responseData = await res.json()

    if (!res.ok || !responseData.chat) {
      throw new Error(responseData.error || "Failed to create chat")
    }

    const chat: Chats = {
      id: responseData.chat.id,
      title: responseData.chat.title,
      created_at: responseData.chat.created_at,
      model: responseData.chat.model,
      agent_id: responseData.chat.agent_id,
      user_id: responseData.chat.user_id,
      public: responseData.chat.public,
      updated_at: responseData.chat.updated_at,
      project_id: responseData.chat.project_id || null,
    }

    await writeToIndexedDB("chats", chat)
    return chat
  } catch (error) {
    console.error("Error creating new chat:", error)
    throw error
  }
}

export async function updateChatAgent(
  userId: string,
  chatId: string,
  agentId: string | null,
  isAuthenticated: boolean
) {
  try {
    // Filter out local agent IDs for database operations
    const dbAgentId = filterLocalAgentId(agentId)

    const res = await fetchClient(API_ROUTE_UPDATE_CHAT_AGENT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        chatId,
        agentId: dbAgentId,
        isAuthenticated,
      }),
    })
    const responseData = await res.json()

    if (!res.ok) {
      throw new Error(
        responseData.error ||
          `Failed to update chat agent: ${res.status} ${res.statusText}`
      )
    }

    const all = await getCachedChats()
    const updated = (all as Chats[]).map((c) =>
      c.id === chatId ? { ...c, agent_id: dbAgentId } : c
    )
    await writeToIndexedDB("chats", updated)

    return responseData
  } catch (error) {
    console.error("Error updating chat agent:", error)
    throw error
  }
}
