import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { chatId, pinned } = await request.json()

    if (!chatId || typeof pinned !== "boolean") {
      return new Response(
        JSON.stringify({ error: "Missing chatId or pinned" }),
        { status: 400 }
      )
    }

    if (!supabase) {
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }

    const toggle = pinned
      ? { pinned: true, pinned_at: new Date().toISOString() }
      : { pinned: false, pinned_at: null }

    const { error } = await supabase
      .from("chats")
      .update(toggle)
      .eq("id", chatId)

    if (error) {
      return new Response(
        JSON.stringify({
          error: "Failed to update pinned",
          details: error.message,
        }),
        { status: 500 }
      )
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: (error as Error).message || "Internal server error",
      }),
      { status: 500 }
    )
  }
}
