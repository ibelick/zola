import { readFromIndexedDB, writeToIndexedDB } from "@/lib/chat-store/persist"
import type { Chat, Chats } from "@/lib/chat-store/types"
import { createClient } from "@/lib/supabase/client"
import { MODEL_DEFAULT, SYSTEM_PROMPT_DEFAULT } from "../../config"
import { fetchClient } from "../../fetch"
import {
  API_ROUTE_CREATE_CHAT,
  API_ROUTE_CREATE_CHAT_WITH_AGENT,
  API_ROUTE_UPDATE_CHAT_MODEL,
} from "../../routes"

export async function getCachedChats(): Promise<Chats[]> {
  const all = await readFromIndexedDB<Chats>("chats")
  return (all as Chats[]).sort(
    (a, b) => +new Date(b.created_at || "") - +new Date(a.created_at || "")
  )
}

export async function fetchAndCacheChats(userId: string): Promise<Chats[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("chats")
    .select("id, title, created_at, model, system_prompt, agent_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (!data || error) {
    console.error("Failed to fetch chats:", error)
    return []
  }

  await writeToIndexedDB("chats", data)
  return data
}

export async function updateChatTitle(
  id: string,
  title: string
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("chats").update({ title }).eq("id", id)
  if (error) throw error

  const all = await getCachedChats()
  const updated = (all as Chats[]).map((c) =>
    c.id === id ? { ...c, title } : c
  )
  await writeToIndexedDB("chats", updated)
}

export async function deleteChat(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("chats").delete().eq("id", id)
  if (error) throw error

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
  const supabase = createClient()
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (!data || error) return []
  await writeToIndexedDB("chats", data)
  return data
}

export async function createChat(
  userId: string,
  title: string,
  model: string,
  systemPrompt: string
): Promise<string> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("chats")
    .insert({ user_id: userId, title, model, system_prompt: systemPrompt })
    .select("id")
    .single()

  if (error || !data?.id) throw error

  await writeToIndexedDB("chats", {
    id: data.id,
    title,
    model,
    user_id: userId,
    system_prompt: systemPrompt,
    created_at: new Date().toISOString(),
  })

  return data.id
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
  systemPrompt?: string,
  agentId?: string
): Promise<Chats> {
  try {
    const apiRoute = agentId
      ? API_ROUTE_CREATE_CHAT_WITH_AGENT
      : API_ROUTE_CREATE_CHAT

    const payload = agentId
      ? {
          userId,
          agentId,
          title: title || `Conversation with agent`,
          model: model || MODEL_DEFAULT,
          isAuthenticated,
        }
      : {
          userId,
          title,
          model: model || MODEL_DEFAULT,
          isAuthenticated,
          systemPrompt: systemPrompt || SYSTEM_PROMPT_DEFAULT,
        }

    const res = await fetchClient(apiRoute, {
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
      system_prompt: responseData.chat.system_prompt,
      agent_id: responseData.chat.agent_id,
    }

    await writeToIndexedDB("chats", chat)
    return chat
  } catch (error) {
    console.error("Error creating new chat:", error)
    throw error
  }
}
