import { SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { validateUserIdentity } from "@/lib/server/api"
import { checkUsageByModel } from "@/lib/usage"

export async function POST(request: Request) {
  try {
    const { userId, title, model, isAuthenticated, systemPrompt } =
      await request.json()
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
      })
    }

    const supabase = await validateUserIdentity(userId, isAuthenticated)

    await checkUsageByModel(supabase, userId, model, isAuthenticated)

    // Insert a new chat record in the chats table
    const { data: chatData, error: chatError } = await supabase
      .from("chats")
      .insert({
        user_id: userId,
        title: title || "New Chat",
        model: model,
        system_prompt: systemPrompt || SYSTEM_PROMPT_DEFAULT,
      })
      .select("*")
      .single()

    if (chatError || !chatData) {
      console.error("Error creating chat record:", chatError)
      return new Response(
        JSON.stringify({
          error: "Failed to create chat record",
          details: chatError?.message,
        }),
        { status: 500 }
      )
    }

    // return the new chat to write to indexedDB
    return new Response(JSON.stringify({ chat: chatData }), {
      status: 200,
    })
  } catch (err: any) {
    console.error("Error in create-chat endpoint:", err)

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
