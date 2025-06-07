import { NextRequest, NextResponse } from "next/server"
import { getEffectiveApiKey, Provider } from "@/lib/user-keys"
import { validateCsrfToken } from "@/lib/csrf"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { provider, userId, csrfToken } = await request.json()
    
    if (!validateCsrfToken(csrfToken)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiKey = await getEffectiveApiKey(userId, provider as Provider)
    
    const envKeyMap: Record<Provider, string | undefined> = {
      openai: process.env.OPENAI_API_KEY,
      mistral: process.env.MISTRAL_API_KEY,
      google: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      xai: process.env.XAI_API_KEY,
    }
    
    return NextResponse.json({ 
      hasUserKey: !!apiKey && apiKey !== envKeyMap[provider as Provider],
      provider 
    })
  } catch (error) {
    console.error("Error checking provider keys:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
