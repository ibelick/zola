import { filterLocalAgentId } from "@/lib/agents/utils"
import { validateUserIdentity } from "@/lib/server/api"

export async function POST(request: Request) {
  try {
    const { userId, chatId, agentId, isAuthenticated } = await request.json()

    if (!userId || !chatId) {
      return new Response(
        JSON.stringify({ error: "Missing userId or chatId" }),
        { status: 400 }
      )
    }

    // Filter out local agent IDs for database operations
    const dbAgentId = filterLocalAgentId(agentId)

    const supabase = await validateUserIdentity(userId, isAuthenticated)

    if (!supabase) {
      console.log("Supabase not enabled, skipping agent update")
      return new Response(
        JSON.stringify({ chat: { id: chatId, agent_id: dbAgentId } }),
        {
          status: 200,
        }
      )
    }

    const { data, error: updateError } = await supabase
      .from("chats")
      .update({ agent_id: dbAgentId || null })
      .eq("id", chatId)
      .select()
      .single()

    if (updateError) {
      return new Response(JSON.stringify({ error: "Failed to update chat" }), {
        status: 500,
      })
    }

    return new Response(JSON.stringify({ chat: data }), {
      status: 200,
    })
  } catch (error) {
    console.error("Error updating chat agent:", error)
    return new Response(
      JSON.stringify({ error: "Failed to update chat agent" }),
      { status: 500 }
    )
  }
}
