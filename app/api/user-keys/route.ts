import { encryptKey } from "@/lib/encryption"
import { getModelsForProvider } from "@/lib/models"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { provider, apiKey } = await request.json()

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: "Provider and API key are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not available" },
        { status: 500 }
      )
    }

    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { encrypted, iv } = encryptKey(apiKey)

    // Check if this is a new API key (not an update)
    const { data: existingKey } = await supabase
      .from("user_keys")
      .select("provider")
      .eq("user_id", authData.user.id)
      .eq("provider", provider)
      .single()

    const isNewKey = !existingKey

    // Save the API key
    const { error } = await supabase.from("user_keys").upsert({
      user_id: authData.user.id,
      provider,
      encrypted_key: encrypted,
      iv,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If this is a new API key, add provider models to favorites
    if (isNewKey) {
      try {
        // Get current user's favorite models
        const { data: userData } = await supabase
          .from("users")
          .select("favorite_models")
          .eq("id", authData.user.id)
          .single()

        const currentFavorites = userData?.favorite_models || []

        // Get models for this provider
        const providerModels = await getModelsForProvider(provider)
        const providerModelIds = providerModels.map((model) => model.id)

        // Skip if no models found for this provider
        if (providerModelIds.length === 0) {
          return NextResponse.json({
            success: true,
            isNewKey,
            message: "API key saved",
          })
        }

        // Add provider models to favorites (only if not already there)
        const newModelsToAdd = providerModelIds.filter(
          (modelId) => !currentFavorites.includes(modelId)
        )

        if (newModelsToAdd.length > 0) {
          const updatedFavorites = [...currentFavorites, ...newModelsToAdd]

          // Update user's favorite models
          const { error: favoritesError } = await supabase
            .from("users")
            .update({ favorite_models: updatedFavorites })
            .eq("id", authData.user.id)

          if (favoritesError) {
            console.error("Failed to update favorite models:", favoritesError)
          }
        }
      } catch (modelsError) {
        console.error("Failed to update favorite models:", modelsError)
        // Don't fail the main request if favorite models update fails
      }
    }

    return NextResponse.json({
      success: true,
      isNewKey,
      message: isNewKey
        ? `API key saved and ${provider} models added to favorites`
        : "API key updated",
    })
  } catch (error) {
    console.error("Error in POST /api/user-keys:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { provider } = await request.json()

    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not available" },
        { status: 500 }
      )
    }

    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase
      .from("user_keys")
      .delete()
      .eq("user_id", authData.user.id)
      .eq("provider", provider)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/user-keys:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
