import { createGuestServerClient } from "@/lib/supabase/server-guest"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
      })
    }

    const supabase = await createGuestServerClient()
    if (!supabase) {
      console.log("Supabase not enabled, skipping guest creation.")
      return new Response(
        JSON.stringify({ user: { id: userId, anonymous: true } }),
        {
          status: 200,
        }
      )
    }

    // Check if the user record already exists.
    let { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    if (!userData) {
      const { data, error } = await supabase
        .from("users")
        .insert({
          id: userId,
          email: `${userId}@anonymous.example`,
          anonymous: true,
          message_count: 0,
          premium: false,
          created_at: new Date().toISOString(),
        })
        .select("*")
        .single()

      if (error || !data) {
        console.error("Error creating guest user:", error)
        return new Response(
          JSON.stringify({
            error: "Failed to create guest user",
            details: error?.message,
          }),
          { status: 500 }
        )
      }

      userData = data
    }

    return new Response(JSON.stringify({ user: userData }), { status: 200 })
  } catch (err: any) {
    console.error("Error in create-guest endpoint:", err)
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500 }
    )
  }
}
