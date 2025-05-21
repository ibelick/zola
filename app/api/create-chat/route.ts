import { createChatInDb } from "./api"

export async function POST(request: Request) {
  try {
    const { userId, title, model, isAuthenticated } = await request.json()

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
      })
    }

    const chat = await createChatInDb({
      userId,
      title,
      model,
      isAuthenticated,
    })

    if (!chat) {
      return new Response(
        JSON.stringify({ error: "Supabase not available in this deployment." }),
        { status: 200 }
      )
    }

    return new Response(JSON.stringify({ chat }), { status: 200 })
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
