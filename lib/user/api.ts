import type { UserProfile } from "@/app/types/user"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"
import { MODEL_DEFAULT } from "../config"

export async function getSupabaseUser() {
  const supabase = await createClient()
  if (!supabase) return { supabase: null, user: null }

  const { data } = await supabase.auth.getUser()
  return {
    supabase,
    user: data.user ?? null,
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  if (!isSupabaseEnabled) {
    return {
      id: "guest",
      email: "guest@zola.chat",
      display_name: "Guest",
      profile_image: "",
      anonymous: true,
      created_at: "",
      daily_message_count: 0,
      daily_reset: "",
      message_count: 0,
      preferred_model: MODEL_DEFAULT,
      premium: false,
      last_active_at: "",
      daily_pro_message_count: 0,
      daily_pro_reset: "",
      system_prompt: "",
    }
  }

  const { supabase, user } = await getSupabaseUser()
  if (!supabase || !user) return null

  const { data: userProfileData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()

  return {
    ...userProfileData,
    profile_image: user.user_metadata?.avatar_url ?? "",
    display_name: user.user_metadata?.name ?? "",
  } as UserProfile
}
