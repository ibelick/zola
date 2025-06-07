import { createClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"
import slugify from "slugify"

function generateAgentSlug(title: string) {
  const base = slugify(title, { lower: true, strict: true, trim: true })
  const id = nanoid(6)
  return `${base}-${id}`
}

export async function POST(request: Request) {
  try {
    const {
      name,
      description,
      systemPrompt,
      mcp_config,
      example_inputs,
      avatar_url,
      tools = [],
      remixable = false,
      is_public = true,
      max_steps = 5,
    } = await request.json()

    if (!name || !description || !systemPrompt) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
        }
      )
    }

    const supabase = await createClient()

    if (!supabase) {
      return new Response(
        JSON.stringify({ error: "Supabase not available in this deployment." }),
        { status: 200 }
      )
    }

    const { data: authData } = await supabase.auth.getUser()

    if (!authData?.user?.id) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
      })
    }

    const { data: agent, error: supabaseError } = await supabase
      .from("agents")
      .insert({
        slug: generateAgentSlug(name),
        name,
        description,
        avatar_url,
        mcp_config,
        example_inputs,
        tools,
        remixable,
        is_public,
        system_prompt: systemPrompt,
        max_steps,
        creator_id: authData.user.id,
      })
      .select()
      .single()

    if (supabaseError) {
      return new Response(JSON.stringify({ error: supabaseError.message }), {
        status: 500,
      })
    }

    return new Response(JSON.stringify({ agent }), { status: 201 })
  } catch (err: unknown) {
    console.error("Error in create-agent endpoint:", err)

    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal server error" }),
      { status: 500 }
    )
  }
}
