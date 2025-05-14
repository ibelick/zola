import { validateUserIdentity } from "@/lib/server/api"

export async function POST(request: Request) {
  try {
    const { userId, chatId, agentId, isAuthenticated } = await request.json()

    if (!userId || !chatId) {
      return new Response(
        JSON.stringify({ error: "Missing userId or chatId" }),
        {
          status: 400,
        }
      )
    }

    const supabase = await validateUserIdentity(userId, isAuthenticated)

    const { error: updateError } = await supabase
      .from("chats")
      .update({
        agent_id: agentId || null,
      })
      .eq("id", chatId)
      .select()
      .single()

    if (updateError) {
      return new Response(JSON.stringify({ error: "Failed to update chat" }), {
        status: 500,
      })
    }

    return new Response(JSON.stringify({ chat: updateError }), {
      status: 200,
    })
  } catch (error) {
    console.error("Error updating chat agent:", error)
    return new Response(
      JSON.stringify({ error: "Failed to update chat agent" }),
      {
        status: 500,
      }
    )
  }
}
