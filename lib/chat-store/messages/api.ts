import { UIMessageFull } from "@/app/components/chat/use-chat-core"
import { createClient } from "@/lib/supabase/client"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { readFromIndexedDB, writeToIndexedDB } from "../persist"

export async function getMessagesFromDb(
  chatId: string
): Promise<UIMessageFull[]> {
  // fallback to local cache only
  if (!isSupabaseEnabled) {
    const cached = await getCachedMessages(chatId)
    return cached
  }

  const supabase = createClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("messages")
    .select("id, role, created_at, parts, message_group_id, model")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })

  if (!data || error) {
    console.error("Failed to fetch messages:", error)
    return []
  }

  return data.map((message) => {
    const uiMessage: UIMessageFull = {
      id: String(message.id),
      role: message["role"],
      // metadata: {
      //   createdAt: new Date(message.created_at || ""),
      // },
      parts: (message?.parts as UIMessageFull["parts"]) || undefined,
      message_group_id: message.message_group_id,
      model: message.model,
    }

    return uiMessage
  })
}

async function insertMessageToDb(chatId: string, message: UIMessageFull) {
  const supabase = createClient()
  if (!supabase) return

  await supabase.from("messages").insert({
    chat_id: chatId,
    role: message.role,
    created_at: message.metadata?.createdAt || new Date().toISOString(),
    message_group_id: (message as any).message_group_id || null,
    model: (message as any).model || null,
  })
}

async function insertMessagesToDb(chatId: string, messages: UIMessageFull[]) {
  const supabase = createClient()
  if (!supabase) return

  const payload = messages.map((message) => ({
    chat_id: chatId,
    role: message.role,
    created_at: message.metadata?.createdAt || new Date().toISOString(),
    message_group_id: (message as any).message_group_id || null,
    model: (message as any).model || null,
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
  messages: UIMessageFull[]
}

export async function getCachedMessages(
  chatId: string
): Promise<UIMessageFull[]> {
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
  messages: UIMessageFull[]
): Promise<void> {
  await writeToIndexedDB("messages", { id: chatId, messages })
}

export async function addMessage(
  chatId: string,
  message: UIMessageFull
): Promise<void> {
  await insertMessageToDb(chatId, message)
  const current = await getCachedMessages(chatId)
  const updated = [...current, message]

  await writeToIndexedDB("messages", { id: chatId, messages: updated })
}

export async function setMessages(
  chatId: string,
  messages: UIMessageFull[]
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
