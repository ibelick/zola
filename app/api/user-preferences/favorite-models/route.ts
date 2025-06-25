import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      )
    }

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse the request body
    const body = await request.json()
    const { favorite_models } = body

    // Validate the favorite_models array
    if (!Array.isArray(favorite_models)) {
      return NextResponse.json(
        { error: "favorite_models must be an array" },
        { status: 400 }
      )
    }

    // Validate that all items in the array are strings
    if (!favorite_models.every((model) => typeof model === "string")) {
      return NextResponse.json(
        { error: "All favorite_models must be strings" },
        { status: 400 }
      )
    }

    // Update the user's favorite models
    const { data, error } = await supabase
      .from("users")
      .update({
        favorite_models,
      })
      .eq("id", user.id)
      .select("favorite_models")
      .single()

    if (error) {
      console.error("Error updating favorite models:", error)
      return NextResponse.json(
        { error: "Failed to update favorite models" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      favorite_models: data.favorite_models,
    })
  } catch (error) {
    console.error("Error in favorite-models API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      )
    }

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's favorite models
    const { data, error } = await supabase
      .from("users")
      .select("favorite_models")
      .eq("id", user.id)
      .single()

    if (error) {
      console.error("Error fetching favorite models:", error)
      return NextResponse.json(
        { error: "Failed to fetch favorite models" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      favorite_models: data.favorite_models || [],
    })
  } catch (error) {
    console.error("Error in favorite-models GET API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
