import { Agent } from "@/app/types/agent"
import { createClient } from "@/lib/supabase/client"
import { CURATED_AGENTS_SLUGS } from "../config"

export async function fetchCuratedAgentsFromDb(): Promise<Agent[] | null> {
  const supabase = createClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .in("slug", CURATED_AGENTS_SLUGS)

  if (error) {
    console.error("Error fetching curated agents:", error)
    return null
  }

  return data
}

export async function fetchUserAgentsFromDb(
  userId: string
): Promise<Agent[] | null> {
  const supabase = createClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("creator_id", userId)

  if (error) {
    console.error("Error fetching user agents:", error)
    return null
  }

  return data
}

export async function fetchAgentBySlugOrId({
  slug,
  id,
}: {
  slug?: string
  id?: string | null
}): Promise<Agent | null> {
  const supabase = createClient()
  if (!supabase) return null

  let query = supabase.from("agents").select("*")

  if (slug) {
    query = query.eq("slug", slug)
  } else if (id) {
    query = query.eq("id", id)
  } else {
    return null
  }

  const { data, error } = await query.single()

  if (error || !data) {
    console.error("Error fetching agent:", error)
    return null
  }

  return data
}
