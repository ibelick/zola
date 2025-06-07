import type { UIMessageWithMetadata } from "@/app/components/chat/chat"
import type { ContentPart, Message } from "@/app/types/api.types"
import type { Database, Json } from "@/app/types/database.types"
import type { SupabaseClient } from "@supabase/supabase-js"

const DEFAULT_STEP = 0

export async function saveFinalAssistantMessage(
  supabase: SupabaseClient<Database>,
  chatId: string,
  rawParts: UIMessageWithMetadata["parts"]
) {
  const parts = rawParts

  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    role: "assistant",
    parts: parts,
  })

  if (error) {
    console.error("Error saving final assistant message:", error)
    throw new Error(`Failed to save assistant message: ${error.message}`)
  } else {
    console.log("Assistant message saved successfully (merged).")
  }
}
