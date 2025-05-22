import type { UIMessageWithMetadata } from "@/app/components/chat/chat"
import { createClient } from "@/lib/supabase/client"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import type { UIMessage } from "ai"
import { readFromIndexedDB, writeToIndexedDB } from "../persist"

export async function getMessagesFromDb(
  chatId: string
): Promise<UIMessageWithMetadata[]> {
  // fallback to local cache only
  if (!isSupabaseEnabled) {
    const cached = await getCachedMessages(chatId)
    return cached
  }

  const supabase = createClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("messages")
    .select("id, role, created_at, parts")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })

  if (!data || error) {
    console.error("Failed to fetch messages:", error)
    return []
  }

  return data.map((message) => {
    const uiMessage: UIMessageWithMetadata = {
      id: String(message.id),
      role: message["role"],
      metadata: {
        createdAt: new Date(message.created_at || ""),
      },
      parts: (message?.parts as UIMessage["parts"]) || undefined,
    }

    return uiMessage
  })
}

async function insertMessageToDb(
  chatId: string,
  message: UIMessageWithMetadata
) {
  const supabase = createClient()
  if (!supabase) return

  await supabase.from("messages").insert({
    chat_id: chatId,
    role: message.role,
    created_at: message.metadata?.createdAt || new Date().toISOString(),
  })
}

async function insertMessagesToDb(
  chatId: string,
  messages: UIMessageWithMetadata[]
) {
  const supabase = createClient()
  if (!supabase) return

  const payload = messages.map((message) => ({
    chat_id: chatId,
    role: message.role,
    created_at: message.metadata?.createdAt || new Date().toISOString(),
  }))

  await supabase.from("messages").insert(payload)
}

async function deleteMessagesFromDb(chatId: string) {
  const supabase = createClient()
  if (!supabase) return

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("chat_id", chatId)

  if (error) {
    console.error("Failed to clear messages from database:", error)
  }
}

type ChatMessageEntry = {
  id: string
  messages: UIMessageWithMetadata[]
}

export async function getCachedMessages(
  chatId: string
): Promise<UIMessageWithMetadata[]> {
  const entry = await readFromIndexedDB<ChatMessageEntry>("messages", chatId)

  if (!entry || Array.isArray(entry)) return []

  return (entry.messages || []).sort(
    (a, b) =>
      +new Date(a.metadata?.createdAt || 0) -
      +new Date(b.metadata?.createdAt || 0)
  )
}

export async function cacheMessages(
  chatId: string,
  messages: UIMessageWithMetadata[]
): Promise<void> {
  await writeToIndexedDB("messages", { id: chatId, messages })
}

export async function addMessage(
  chatId: string,
  message: UIMessageWithMetadata
): Promise<void> {
  await insertMessageToDb(chatId, message)
  const current = await getCachedMessages(chatId)

  console.log("current", current)

  const updated = [...current, message]
  console.log("updated", updated)

  await writeToIndexedDB("messages", { id: chatId, messages: updated })
}

export async function setMessages(
  chatId: string,
  messages: UIMessageWithMetadata[]
): Promise<void> {
  await insertMessagesToDb(chatId, messages)
  await writeToIndexedDB("messages", { id: chatId, messages })
}

export async function clearMessagesCache(chatId: string): Promise<void> {
  await writeToIndexedDB("messages", { id: chatId, messages: [] })
}

export async function clearMessagesForChat(chatId: string): Promise<void> {
  await deleteMessagesFromDb(chatId)
  await clearMessagesCache(chatId)
}
