import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: Request) {
  try {
    const { slug } = await request.json()

    if (!slug) {
      return new Response(JSON.stringify({ error: "Missing agent slug" }), {
        status: 400,
      })
    }

    const supabase = await createClient()

    if (!supabase) {
      return new Response(
        JSON.stringify({ error: "Supabase not available in this deployment." }),
        { status: 500 }
      )
    }

    // Get the authenticated user
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData?.user?.id) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401 }
      )
    }

    // First, check if the agent exists and the user owns it
    const { data: agent, error: fetchError } = await supabase
      .from("agents")
      .select("id, creator_id, name")
      .eq("slug", slug)
      .single()

    if (fetchError || !agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404,
      })
    }

    if (agent.creator_id !== authData.user.id) {
      return new Response(
        JSON.stringify({
          error: "You can only delete agents that you created",
        }),
        { status: 403 }
      )
    }

    // Delete the agent
    const { error: deleteError } = await supabase
      .from("agents")
      .delete()
      .eq("slug", slug)
      .eq("creator_id", authData.user.id) // Extra safety check

    if (deleteError) {
      console.error("Error deleting agent:", deleteError)
      return new Response(
        JSON.stringify({
          error: "Failed to delete agent",
          details: deleteError.message,
        }),
        { status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ message: "Agent deleted successfully" }),
      { status: 200 }
    )
  } catch (err: unknown) {
    console.error("Error in delete-agent endpoint:", err)

    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal server error" }),
      { status: 500 }
    )
  }
}
