import { checkUsage } from "@/lib/api"
import { validateUserIdentity } from "@/lib/server/api"

export async function POST(request: Request) {
  try {
    const { userId, agentId, title, model, isAuthenticated } =
      await request.json()

    if (!userId || !agentId) {
      return new Response(
        JSON.stringify({ error: "Missing userId or agentId" }),
        { status: 400 }
      )
    }

    const supabase = await validateUserIdentity(userId, isAuthenticated)

    await checkUsage(supabase, userId)

    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("system_prompt")
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404,
      })
    }

    const { data: chatData, error: chatError } = await supabase
      .from("chats")
      .insert({
        user_id: userId,
        title: title || "New Chat",
        model,
        system_prompt: agent.system_prompt,
        agent_id: agentId,
      })
      .select("*")
      .single()

    if (chatError || !chatData) {
      console.error("Error creating chat with agent:", chatError)
      return new Response(
        JSON.stringify({
          error: "Failed to create chat with agent",
          details: chatError?.message,
        }),
        { status: 500 }
      )
    }

    return new Response(
      JSON.stringify({
        chat: {
          id: chatData.id,
          title: chatData.title,
          created_at: chatData.created_at,
          model: chatData.model,
          system_prompt: chatData.system_prompt,
          agent_id: chatData.agent_id,
        },
      }),
      {
        status: 200,
      }
    )
  } catch (err: any) {
    console.error("Error in create-chat-agent endpoint:", err)

    if (err.code === "DAILY_LIMIT_REACHED") {
      return new Response(
        JSON.stringify({ error: err.message, code: err.code }),
        { status: 403 }
      )
    }

    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500 }
    )
  }
}
