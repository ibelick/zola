import { UIMessageFull } from "@/app/components/chat/use-chat-core"
import type { ContentPart, Message } from "@/app/types/api.types"
import type { Database, Json } from "@/app/types/database.types"
import type { SupabaseClient } from "@supabase/supabase-js"

const DEFAULT_STEP = 0

export async function saveFinalAssistantMessage(
  supabase: SupabaseClient<Database>,
  chatId: string,
  rawParts: UIMessageFull["parts"]
) {
  const parts = rawParts

  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    role: "assistant",
    parts: parts,
    message_group_id,
    model,
  })

  if (error) {
    console.error("Error saving final assistant message:", error)
    throw new Error(`Failed to save assistant message: ${error.message}`)
  } else {
    console.log("Assistant message saved successfully (merged).")
  }
}
