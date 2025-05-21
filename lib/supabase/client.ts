import { Database } from "@/app/types/database.types"
import { createBrowserClient } from "@supabase/ssr"
import { isSupabaseEnabled } from "./config"

export function createClient() {
  if (!isSupabaseEnabled) {
    return null
  }

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
